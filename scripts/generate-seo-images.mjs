import sharp from 'sharp';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const publicDir = join(root, 'public');

async function generateFavicon() {
  console.log('Generating favicon.ico (32x32 PNG)...');

  // Generate 32x32 PNG from the 512x512 icon
  await sharp(join(publicDir, 'icons', 'icon-512x512.png'))
    .resize(32, 32)
    .png()
    .toFile(join(publicDir, 'favicon-32x32.png'));

  // Generate 16x16 PNG
  await sharp(join(publicDir, 'icons', 'icon-512x512.png'))
    .resize(16, 16)
    .png()
    .toFile(join(publicDir, 'favicon-16x16.png'));

  // Generate ICO-compatible PNG (use 32x32 as favicon.ico replacement)
  // Modern browsers support PNG favicons, so we'll use that
  await sharp(join(publicDir, 'icons', 'icon-512x512.png'))
    .resize(48, 48)
    .png()
    .toFile(join(publicDir, 'favicon.ico'));

  console.log('  Created favicon.ico, favicon-16x16.png, favicon-32x32.png');
}

async function generateOgImage() {
  console.log('Generating OG image (1200x630)...');

  // Create a dark background canvas
  const width = 1200;
  const height = 630;

  // Load the landing image and resize it to fit nicely
  const landingImage = await sharp(join(publicDir, 'images', 'landing.png'))
    .resize(400, 400, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  // Create SVG overlay with text
  const svgOverlay = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#1a1a2e;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#16213e;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#0f3460;stop-opacity:1" />
        </linearGradient>
        <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#e94560;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#ff6b6b;stop-opacity:1" />
        </linearGradient>
      </defs>
      <!-- Background -->
      <rect width="${width}" height="${height}" fill="url(#bg)" />
      <!-- Decorative circles -->
      <circle cx="900" cy="100" r="200" fill="#e94560" opacity="0.08" />
      <circle cx="200" cy="500" r="150" fill="#0f3460" opacity="0.15" />
      <!-- Accent line -->
      <rect x="530" y="280" width="80" height="4" rx="2" fill="url(#accent)" />
      <!-- Text -->
      <text x="570" y="260" font-family="Arial, Helvetica, sans-serif" font-size="72" font-weight="bold" fill="#ffffff" text-anchor="left">MundoBL</text>
      <text x="535" y="340" font-family="Arial, Helvetica, sans-serif" font-size="26" fill="#cccccc" text-anchor="left">Catálogo de Series BL, GL</text>
      <text x="535" y="380" font-family="Arial, Helvetica, sans-serif" font-size="26" fill="#cccccc" text-anchor="left">y Doramas Asiáticos</text>
      <!-- Subtitle -->
      <text x="535" y="440" font-family="Arial, Helvetica, sans-serif" font-size="18" fill="#888888" text-anchor="left">Reseñas · Calificaciones · Actores · Episodios</text>
      <!-- URL -->
      <text x="535" y="540" font-family="Arial, Helvetica, sans-serif" font-size="20" fill="#e94560" text-anchor="left">mundobl.win</text>
    </svg>
  `;

  // Create the OG image by compositing
  await sharp(Buffer.from(svgOverlay))
    .composite([
      {
        input: landingImage,
        left: 65,
        top: 115,
      },
    ])
    .png({ quality: 90 })
    .toFile(join(publicDir, 'images', 'og-image.png'));

  console.log('  Created public/images/og-image.png (1200x630)');
}

async function main() {
  try {
    await generateFavicon();
    await generateOgImage();
    console.log('\nAll SEO images generated successfully!');
  } catch (error) {
    console.error('Error generating images:', error);
    process.exit(1);
  }
}

main();
