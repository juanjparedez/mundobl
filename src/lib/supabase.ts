import { createClient, SupabaseClient } from '@supabase/supabase-js';

const BUCKET = 'images';

let _supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (_supabase) return _supabase;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      'Supabase Storage no configurado: faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY'
    );
  }

  _supabase = createClient(supabaseUrl, supabaseServiceKey);
  return _supabase;
}

/**
 * Sube una imagen a Supabase Storage
 * @param file Buffer de la imagen
 * @param path Ruta dentro del bucket (ej: "series/1234_foto.jpg")
 * @param contentType Tipo MIME de la imagen
 * @returns URL pública de la imagen
 */
export async function uploadImage(
  file: Buffer,
  path: string,
  contentType: string
): Promise<string> {
  const supabase = getSupabase();

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType,
    upsert: true,
  });

  if (error) {
    throw new Error(`Error subiendo imagen: ${error.message}`);
  }

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);

  return urlData.publicUrl;
}

/**
 * Elimina una imagen de Supabase Storage
 * @param path Ruta dentro del bucket
 */
export async function deleteImage(path: string): Promise<void> {
  const supabase = getSupabase();

  const { error } = await supabase.storage.from(BUCKET).remove([path]);

  if (error) {
    throw new Error(`Error eliminando imagen: ${error.message}`);
  }
}

/**
 * Verifica si una URL pertenece al storage de Supabase
 */
export function isSupabaseUrl(url: string): boolean {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return false;
  try {
    const parsed = new URL(url);
    const supabaseHost = new URL(supabaseUrl).hostname;
    return parsed.hostname === supabaseHost;
  } catch {
    return false;
  }
}

const VALID_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const EXTENSION_MAP: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

/**
 * Descarga una imagen desde una URL externa y la sube a Supabase Storage.
 * Si la URL ya es de Supabase, retorna la URL sin cambios.
 * @param url URL externa de la imagen
 * @param folder Carpeta dentro del bucket (ej: 'series', 'actors')
 * @returns URL pública de la imagen en Supabase
 */
export async function downloadAndUploadExternalImage(
  url: string,
  folder: string
): Promise<string> {
  if (isSupabaseUrl(url)) return url;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'MundoBL/1.0' },
    });
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} descargando imagen`);
    }

    const contentType =
      response.headers
        .get('content-type')
        ?.split(';')[0]
        .trim()
        .toLowerCase() ?? '';

    if (!VALID_IMAGE_TYPES.has(contentType)) {
      throw new Error(`Tipo de contenido no soportado: ${contentType}`);
    }

    const ext = EXTENSION_MAP[contentType] ?? 'jpg';
    const timestamp = Date.now();
    const random = Math.random().toString(36).slice(2, 8);
    const path = `${folder}/${timestamp}_${random}.${ext}`;

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return await uploadImage(buffer, path, contentType);
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}
