/* eslint-disable no-console */
import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma';
import { processCardThumbnail } from '../src/lib/image-processing';
import { uploadImage } from '../src/lib/supabase';

/**
 * Genera la miniatura de card (600x900) para los posters de Series/Season
 * ya subidos a Supabase Storage que todavia no tienen `imageThumbUrl`.
 *
 * Solo procesa posters Supabase-hosted: los externos (image.tmdb.org,
 * i.vimeocdn.com, etc.) ya se sirven optimizados via Vercel — no son el
 * problema que este thumb resuelve (ver image-processing.ts).
 *
 * Descarga el master, lo re-comprime a 600x900 (misma calidad, 82 — ver
 * CARD_WEBP_QUALITY) y sube el resultado como archivo hermano
 * `{nombre}_card.webp` en el mismo folder de Storage. GIFs no generan thumb
 * (se anima; no se procesa con sharp) y quedan sin `imageThumbUrl` — los
 * call sites caen de vuelta al master via `cardImageUrl()`.
 *
 * Uso:
 *   npx tsx scripts/backfill-image-thumbnails.ts            # dry-run
 *   npx tsx scripts/backfill-image-thumbnails.ts --apply
 *   npx tsx scripts/backfill-image-thumbnails.ts --apply --limit=20   # probar con pocas primero
 */

const APPLY = process.argv.includes('--apply');
const limitArg = process.argv.find((a) => a.startsWith('--limit='));
const LIMIT = limitArg ? parseInt(limitArg.split('=')[1], 10) : Infinity;
const CONCURRENCY = 4;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function isSupabaseUrl(url: string): boolean {
  try {
    return new URL(url).hostname.endsWith('.supabase.co');
  } catch {
    return false;
  }
}

/** Extrae "series/1234_foto.webp" -> folder="series", base="1234_foto". */
function splitStoragePath(url: string): { folder: string; base: string } {
  const { pathname } = new URL(url);
  // .../object/public/images/<folder>/<filename>
  const marker = '/object/public/images/';
  const idx = pathname.indexOf(marker);
  const rel = idx >= 0 ? pathname.slice(idx + marker.length) : pathname;
  const parts = rel.split('/');
  const filename = parts.pop() ?? 'image';
  const folder = parts.join('/') || 'series';
  const base = filename.replace(/\.[^.]+$/, '');
  return { folder, base };
}

interface Target {
  model: 'series' | 'season';
  id: number;
  title: string;
  imageUrl: string;
}

async function collectTargets(): Promise<Target[]> {
  const series = await prisma.series.findMany({
    where: { imageThumbUrl: null, imageUrl: { not: null } },
    select: { id: true, title: true, imageUrl: true },
  });
  const seasons = await prisma.season.findMany({
    where: { imageThumbUrl: null, imageUrl: { not: null } },
    select: { id: true, title: true, imageUrl: true, seriesId: true },
  });

  const targets: Target[] = [];
  for (const s of series) {
    if (s.imageUrl && isSupabaseUrl(s.imageUrl)) {
      targets.push({
        model: 'series',
        id: s.id,
        title: s.title,
        imageUrl: s.imageUrl,
      });
    }
  }
  for (const s of seasons) {
    if (s.imageUrl && isSupabaseUrl(s.imageUrl)) {
      targets.push({
        model: 'season',
        id: s.id,
        title: s.title || `temporada de serie #${s.seriesId}`,
        imageUrl: s.imageUrl,
      });
    }
  }
  return targets;
}

async function processOne(
  target: Target
): Promise<{ ok: true; thumbUrl: string } | { ok: false; error: string }> {
  try {
    const res = await fetch(target.imageUrl, {
      headers: { 'User-Agent': 'MundoBL-backfill/1.0' },
    });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    const contentType =
      res.headers.get('content-type')?.split(';')[0].trim().toLowerCase() ??
      'image/webp';
    const buffer = Buffer.from(await res.arrayBuffer());

    const thumb = await processCardThumbnail(buffer, contentType);
    if (!thumb) return { ok: false, error: 'GIF, sin thumb (esperado)' };

    if (!APPLY) return { ok: true, thumbUrl: '(dry-run, no se sube nada)' };

    const { folder, base } = splitStoragePath(target.imageUrl);
    const path = `${folder}/${base}_card.${thumb.ext}`;
    const thumbUrl = await uploadImage(thumb.buffer, path, thumb.contentType);

    if (target.model === 'series') {
      await prisma.series.update({
        where: { id: target.id },
        data: { imageThumbUrl: thumbUrl },
      });
    } else {
      await prisma.season.update({
        where: { id: target.id },
        data: { imageThumbUrl: thumbUrl },
      });
    }
    return { ok: true, thumbUrl };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function main() {
  console.log(
    `=== Backfill de miniaturas ${APPLY ? '(APPLY)' : '(DRY-RUN)'} ===\n`
  );

  const all = await collectTargets();
  const targets = all.slice(0, LIMIT);
  console.log(
    `Posters Supabase sin thumb: ${all.length}` +
      (LIMIT < all.length ? ` (procesando los primeros ${LIMIT})` : '')
  );

  let done = 0;
  let ok = 0;
  let failed = 0;
  const errors: string[] = [];

  // Concurrencia acotada: 591 imagenes secuenciales tardarian demasiado, pero
  // sin limite se satura la conexion a Supabase Storage (upload + descarga).
  for (let i = 0; i < targets.length; i += CONCURRENCY) {
    const batch = targets.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      batch.map(async (t) => ({ t, r: await processOne(t) }))
    );
    for (const { t, r } of results) {
      done++;
      if (r.ok) {
        ok++;
        if (done <= 5 || done % 50 === 0) {
          console.log(
            `  [${done}/${targets.length}] ${t.model} #${t.id} "${t.title}" -> ${r.thumbUrl}`
          );
        }
      } else {
        failed++;
        errors.push(`${t.model} #${t.id} "${t.title}": ${r.error}`);
      }
    }
  }

  console.log(`\nProcesadas: ${done} | OK: ${ok} | Fallidas: ${failed}`);
  if (errors.length > 0) {
    console.log('\nErrores (primeros 20):');
    errors.slice(0, 20).forEach((e) => console.log(`  - ${e}`));
  }
  console.log(
    APPLY ? '\nListo.' : '\nDry-run. Correr con --apply para escribir.'
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
