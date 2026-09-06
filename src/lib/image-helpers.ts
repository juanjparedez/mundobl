/**
 * Detecta si una URL de imagen vive en Supabase Storage.
 *
 * No depende de NEXT_PUBLIC_SUPABASE_URL: verifica el hostname directamente.
 * Esto es importante porque next/image necesita esta función en el cliente
 * y la env var puede no estar inyectada en el bundle según la config de Vercel.
 */
export function isSupabaseImageUrl(url?: string | null): boolean {
  if (!url) return false;
  try {
    const { hostname, pathname } = new URL(url);
    return (
      hostname.endsWith('.supabase.co') && pathname.startsWith('/storage/')
    );
  } catch {
    return false;
  }
}

/**
 * Elige la imagen a mostrar en un contexto de CARD/grilla (catalogo,
 * filmografia, carousels): prioriza la miniatura de 600x900 (ver
 * image-processing.ts) sobre el poster completo. El master (1200x1800) queda
 * solo para hero/detalle. `imageThumbUrl` es `null` en series legacy que
 * todavia no pasaron por el backfill o cuyo poster es externo — en esos
 * casos cae al poster completo, nunca al reves.
 */
export function cardImageUrl(entity: {
  imageUrl?: string | null;
  imageThumbUrl?: string | null;
}): string | null {
  return entity.imageThumbUrl || entity.imageUrl || null;
}
