import sharp from 'sharp';

const POSTER_MAX_WIDTH = 1200;
const POSTER_MAX_HEIGHT = 1800;
const WEBP_QUALITY = 82;

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
