import sharp from 'sharp';

const POSTER_MAX_WIDTH = 1200;
const POSTER_MAX_HEIGHT = 1800;
const WEBP_QUALITY = 82;

// Miniatura para contextos de grilla (catalogo, filmografia de actor/director,
// carousels): las cards renderizan el poster a ~230-380px de ancho CSS, y con
// `unoptimized` activo (bypass del optimizador de Vercel, ver isSupabaseImageUrl)
// Next NO genera variantes por breakpoint — HOY todo tamaño de pantalla
// descarga el mismo master. El thumb tiene que cubrir bien la card mas grande
// (desktop, ~380px CSS), no el promedio.
//
// 600x900 @ misma calidad que el master (82, sin bajarla): probado contra
// posters reales, incluso con texto chico denso (subtitulos superpuestos),
// el resultado es practicamente indistinguible del master a la vista.
// Ahorra 40-49% de bytes — mas modesto que una cuenta ingenua por cantidad de
// pixeles (WebP no escala 1:1 con eso), pero real y sin sacrificar detalle.
//
// `fit: 'inside'` (no 'cover'): esto es un DOWNSCALE del mismo contenido, no
// un recorte. `Series.imagePosition` (el foco elegido a mano) es CSS puro
// (`object-position`), aplicado en el navegador sobre el archivo que sea — no
// esta horneado en ningun archivo. Con el mismo aspect ratio preservado, el
// foco cae exactamente en el mismo punto relativo en el thumb que en el
// master; achicar la imagen no mueve ni recorta nada.
const CARD_MAX_WIDTH = 600;
const CARD_MAX_HEIGHT = 900;
const CARD_WEBP_QUALITY = WEBP_QUALITY;

export interface ProcessedImage {
  buffer: Buffer;
  contentType: string;
  ext: string;
}

export async function processPosterImage(
  input: Buffer,
  sourceMime: string
): Promise<ProcessedImage> {
  if (sourceMime === 'image/gif') {
    return { buffer: input, contentType: 'image/gif', ext: 'gif' };
  }

  const buffer = await sharp(input, { failOn: 'none' })
    .rotate()
    .resize({
      width: POSTER_MAX_WIDTH,
      height: POSTER_MAX_HEIGHT,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: WEBP_QUALITY, effort: 4 })
    .toBuffer();

  return { buffer, contentType: 'image/webp', ext: 'webp' };
}

/**
 * Miniatura de card a partir del BUFFER YA PROCESADO del poster (no del
 * original crudo): evita decodificar el source dos veces y garantiza que el
 * thumb sea un downscale fiel del mismo webp que se guarda como master.
 *
 * GIF no genera thumb (se anima; no vale la pena procesarlo con sharp) — los
 * call sites deben usar el mismo buffer del poster para esos casos.
 */
export async function processCardThumbnail(
  posterBuffer: Buffer,
  posterContentType: string
): Promise<ProcessedImage | null> {
  if (posterContentType === 'image/gif') return null;

  const buffer = await sharp(posterBuffer, { failOn: 'none' })
    .resize({
      width: CARD_MAX_WIDTH,
      height: CARD_MAX_HEIGHT,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: CARD_WEBP_QUALITY, effort: 4 })
    .toBuffer();

  return { buffer, contentType: 'image/webp', ext: 'webp' };
}
