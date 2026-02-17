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
