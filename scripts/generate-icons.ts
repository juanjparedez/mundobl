import sharp from 'sharp';
import path from 'path';

const SOURCE = path.join(__dirname, '..', 'public', 'images', 'landing.png');
const OUT_DIR = path.join(__dirname, '..', 'public', 'icons');

const sizes = [
  { name: 'icon-192x192.png', size: 192 },
  { name: 'icon-512x512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
];

async function generate() {
  for (const { name, size } of sizes) {
    await sharp(SOURCE)
      .resize(size, size, { fit: 'cover' })
      .png({ quality: 90 })
      .toFile(path.join(OUT_DIR, name));
  }
}

generate().catch(console.error);
