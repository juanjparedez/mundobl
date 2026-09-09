import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { processPosterImage, processCardThumbnail } from './image-processing';
import { isR2Configured, uploadToR2, deleteFromR2, r2KeyFromUrl } from './r2';
import { isDirectServedImageUrl } from './image-helpers';

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
  // R2 primero: es el unico punto por el que pasan TODAS las subidas
  // (/api/upload, /api/feedback/upload y el re-hosteo de imagenes externas),
  // asi que cambiarlo aca alcanza para que nada nuevo vuelva a nacer en
  // Supabase Storage — que es lo que cobra egress.
  //
  // El fallback a Supabase no es pereza: sin las 5 variables de R2 la subida
  // seguiria funcionando en vez de romper el alta de series. Avisa por
  // consola para que el desvio no pase inadvertido.
  if (isR2Configured()) {
    return uploadToR2(file, path, contentType);
  }
  console.warn(
    '[storage] R2 sin configurar: subiendo a Supabase Storage, que cobra egress. Faltan R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY / R2_BUCKET / R2_PUBLIC_HOST.'
  );

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
  // El path puede venir como key suelta o como URL completa. Si es una URL
  // de R2 hay que borrar de R2: buscarla en Supabase no encontraria nada y
  // el archivo quedaria huerfano ocupando espacio para siempre.
  const r2Key = r2KeyFromUrl(path);
  if (r2Key) {
    return deleteFromR2(r2Key);
  }
  if (isR2Configured() && !path.includes('://')) {
    return deleteFromR2(path);
  }

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

export interface DownloadedImage {
  url: string;
  /**
   * Miniatura 600x900 recien generada, o `null` si esta llamada no produjo
   * una (URL ya en Supabase → no se re-descarga nada, ver mas abajo). `null`
   * NO significa "sacar el thumb existente" — es "no tengo nada nuevo que
   * ofrecer". Los callers deciden que hacer con eso (ver
   * /api/series/route.ts y /api/series/[id]/route.ts, donde un `null` aca
   * significa "no toques imageThumbUrl", no "borralo").
   */
  thumbUrl: string | null;
}

/**
 * Descarga una imagen desde una URL externa y la re-hostea (R2 si esta
 * configurado, si no Supabase), generando de paso la miniatura de card
 * (mismo pipeline que /api/upload).
 *
 * Si la imagen YA la servimos nosotros — R2 o Supabase — devuelve la URL sin
 * tocar y `thumbUrl: null`: no hay nada que re-procesar. El chequeo cubre
 * los dos hosts a proposito; mirando solo Supabase, cada vez que un admin
 * guardara una serie cuyo poster ya vive en R2 se volveria a descargar y
 * subir con otra key, dejando un duplicado huerfano por guardado.
 *
 * @param url URL externa de la imagen
 * @param folder Carpeta dentro del bucket (ej: 'series', 'actors')
 */
export async function downloadAndUploadExternalImage(
  url: string,
  folder: string
): Promise<DownloadedImage> {
  if (isDirectServedImageUrl(url)) return { url, thumbUrl: null };

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

    const arrayBuffer = await response.arrayBuffer();
    const original = Buffer.from(arrayBuffer);
    const processed = await processPosterImage(original, contentType);

    const timestamp = Date.now();
    const random = Math.random().toString(36).slice(2, 8);
    const path = `${folder}/${timestamp}_${random}.${processed.ext}`;

    const uploadedUrl = await uploadImage(
      processed.buffer,
      path,
      processed.contentType
    );

    const thumb = await processCardThumbnail(
      processed.buffer,
      processed.contentType
    );
    let thumbUrl: string | null = null;
    if (thumb) {
      const thumbPath = `${folder}/${timestamp}_${random}_card.${thumb.ext}`;
      thumbUrl = await uploadImage(thumb.buffer, thumbPath, thumb.contentType);
    }

    return { url: uploadedUrl, thumbUrl };
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}
