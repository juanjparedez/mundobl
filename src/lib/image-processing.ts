import { getCloudflareContext } from '@opennextjs/cloudflare';

/**
 * Dos motores segun donde corre la app:
 * - Node (Vercel, local, scripts): sharp.
 * - Cloudflare Workers: sharp es nativo y no carga en workerd; se usa el
 *   binding IMAGES (Cloudflare Images, `images` en wrangler.jsonc). Solo se
 *   usa al subir posters o capturas, asi que entra holgado en el cupo
 *   gratuito de transformaciones.
 */
const IS_WORKERD =
  typeof navigator !== 'undefined' &&
  navigator.userAgent === 'Cloudflare-Workers';

interface ResizeSpec {
  width: number;
  height: number;
  quality: number;
  /** Corregir la orientacion EXIF (fotos de celular). */
  autoOrient: boolean;
}

/** Lo que usamos del binding IMAGES de Cloudflare. */
interface CloudflareImagesBinding {
  input(stream: ReadableStream<Uint8Array>): {
    transform(options: { width: number; height: number; fit: 'scale-down' }): {
      output(options: { format: 'image/webp'; quality: number }): Promise<{
        response(): Response;
      }>;
    };
  };
}

async function resizeToWebp(input: Buffer, spec: ResizeSpec): Promise<Buffer> {
  if (IS_WORKERD) {
    const { env } = await getCloudflareContext({ async: true });
    const images = (env as unknown as { IMAGES: CloudflareImagesBinding })
      .IMAGES;
    // Cloudflare Images aplica la orientacion EXIF por defecto.
    const result = await images
      .input(new Blob([new Uint8Array(input)]).stream())
      .transform({ width: spec.width, height: spec.height, fit: 'scale-down' })
      .output({ format: 'image/webp', quality: spec.quality });
    return Buffer.from(await result.response().arrayBuffer());
  }

  const { default: sharp } = await import('sharp');
  const pipeline = sharp(input, { failOn: 'none' });
  if (spec.autoOrient) pipeline.rotate();
  return pipeline
    .resize({
      width: spec.width,
      height: spec.height,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: spec.quality, effort: 4 })
    .toBuffer();
}

const POSTER_MAX_WIDTH = 1200;
const POSTER_MAX_HEIGHT = 1800;
const WEBP_QUALITY = 82;

// Miniatura para contextos de grilla (catalogo, filmografia de actor/director,
// carousels): las cards renderizan el poster a ~230-380px de ancho CSS, y con
// `unoptimized` activo (bypass del optimizador de Vercel, ver isDirectServedImageUrl)
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

  const buffer = await resizeToWebp(input, {
    width: POSTER_MAX_WIDTH,
    height: POSTER_MAX_HEIGHT,
    quality: WEBP_QUALITY,
    autoOrient: true,
  });

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

  const buffer = await resizeToWebp(posterBuffer, {
    width: CARD_MAX_WIDTH,
    height: CARD_MAX_HEIGHT,
    quality: CARD_WEBP_QUALITY,
    autoOrient: false,
  });

  return { buffer, contentType: 'image/webp', ext: 'webp' };
}
