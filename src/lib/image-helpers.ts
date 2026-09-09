/** Host de Cloudflare R2 donde viven hoy los posters. Ver `docs`/context.md. */
export const R2_IMAGE_HOST = 'img.mundobl.com.ar';

/**
 * Detecta si una imagen la servimos nosotros desde un CDN propio, y por lo
 * tanto NO tiene que pasar por el optimizador de Vercel (`unoptimized`).
 *
 * Cubre dos hosts a proposito:
 *  - `img.mundobl.com.ar` (Cloudflare R2): es donde estan todos los posters
 *    desde la migracion del 2026-09-09. Ya salen por el CDN de Cloudflare
 *    con `cache-control: immutable` a un año y egress gratis; mandarlos al
 *    optimizador solo gastaria cuota de Vercel sin ganar nada.
 *  - `*.supabase.co/storage/`: quedan los archivos originales como respaldo,
 *    y cualquier imagen subida antes de que el codigo de subida apunte a R2.
 *
 * No depende de NEXT_PUBLIC_SUPABASE_URL: verifica el hostname directamente.
 * Esto es importante porque next/image necesita esta función en el cliente
 * y la env var puede no estar inyectada en el bundle según la config de Vercel.
 */
export function isDirectServedImageUrl(url?: string | null): boolean {
  if (!url) return false;
  try {
    const { hostname, pathname } = new URL(url);
    if (hostname === R2_IMAGE_HOST) return true;
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
