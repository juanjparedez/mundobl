/* eslint-disable no-console */
import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

/**
 * Migra las imagenes de Supabase Storage a Cloudflare R2.
 *
 * Por que: medido el 2026-09-09 sobre 24h de logs, el 99,8% de las
 * requests a Supabase son imagenes de Storage — 70 MB/dia, 42 KB promedio,
 * 92% servidas desde cache. Como Supabase cobra el egress este cacheado o
 * no, mejorar el cache no sirve: ya esta en 92%. R2 no cobra egress, y los
 * 80 MB entran holgados en los 10 GB gratis.
 *
 * Estrategia: se conserva la MISMA key (`series/<archivo>.webp`), asi la
 * reescritura de URLs en la base es un cambio de host y nada mas. Eso
 * ademas deja los archivos de Supabase intactos como respaldo: si algo
 * sale mal, se revierte cambiando el host de vuelta.
 *
 * Las dos fases van separadas a proposito. Copiar es reversible y no toca
 * nada en produccion; recien cuando esta todo arriba y verificado se tocan
 * las URLs.
 *
 * Ejecucion:
 *   npx tsx scripts/migrate-images-to-r2.ts copy --dry-run
 *   npx tsx scripts/migrate-images-to-r2.ts copy
 *   npx tsx scripts/migrate-images-to-r2.ts verify
 *   npx tsx scripts/migrate-images-to-r2.ts rewrite --dry-run
 *   npx tsx scripts/migrate-images-to-r2.ts rewrite
 *
 * Requiere `wrangler login` hecho y el bucket ya creado.
 */

import { execFile } from 'child_process';
import { promisify } from 'util';
import { mkdir, writeFile, readFile, rm } from 'fs/promises';
import path from 'path';
import { prisma } from '../src/lib/database';

const execFileAsync = promisify(execFile);

const BUCKET = process.env.R2_BUCKET ?? 'mundobl-images';
/** Host publico de R2. Debe coincidir con el dominio conectado al bucket. */
const R2_HOST = process.env.R2_PUBLIC_HOST ?? 'img.mundobl.com.ar';
/** Prefijo publico de Supabase Storage; todo lo que siga es la key. */
const SUPABASE_PREFIX = '/storage/v1/object/public/images/';

const TMP_DIR = path.join(process.cwd(), '.r2-migration');
const PROGRESS_FILE = path.join(TMP_DIR, 'copied.json');
const CONCURRENCY = 6;

// Los nombres ya llevan timestamp + sufijo aleatorio, asi que el contenido
// de una key nunca cambia: se puede cachear para siempre. Es justamente lo
// que Supabase no estaba haciendo (default 1h).
const CACHE_CONTROL = 'public, max-age=31536000, immutable';

interface Row {
  id: number;
  imageUrl: string | null;
  imageThumbUrl: string | null;
}

/** Devuelve la key dentro del bucket, o null si la URL no es de Supabase. */
function storageKey(url: string | null): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.endsWith('.supabase.co')) return null;
    const index = parsed.pathname.indexOf(SUPABASE_PREFIX);
    if (index === -1) return null;
    return decodeURIComponent(
      parsed.pathname.slice(index + SUPABASE_PREFIX.length)
    );
  } catch {
    return null;
  }
}

function contentTypeFor(key: string): string {
  const ext = path.extname(key).toLowerCase();
  if (ext === '.webp') return 'image/webp';
  if (ext === '.png') return 'image/png';
  if (ext === '.avif') return 'image/avif';
  if (ext === '.gif') return 'image/gif';
  return 'image/jpeg';
}

async function loadRows(): Promise<Row[]> {
  return prisma.series.findMany({
    where: {
      OR: [
        { imageUrl: { contains: 'supabase.co/storage' } },
        { imageThumbUrl: { contains: 'supabase.co/storage' } },
      ],
    },
    select: { id: true, imageUrl: true, imageThumbUrl: true },
  });
}

/** Todas las keys distintas referenciadas por la base. */
async function collectKeys(): Promise<Map<string, string>> {
  const rows = await loadRows();
  const keys = new Map<string, string>();
  for (const row of rows) {
    for (const url of [row.imageUrl, row.imageThumbUrl]) {
      const key = storageKey(url);
      if (key && url) keys.set(key, url);
    }
  }
  return keys;
}

async function loadProgress(): Promise<Set<string>> {
  try {
    const raw = await readFile(PROGRESS_FILE, 'utf8');
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

async function saveProgress(done: Set<string>): Promise<void> {
  await writeFile(PROGRESS_FILE, JSON.stringify([...done], null, 0));
}

async function copyOne(key: string, sourceUrl: string): Promise<void> {
  const response = await fetch(sourceUrl);
  if (!response.ok) {
    throw new Error(`descarga fallo (${response.status})`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());

  // wrangler sube desde archivo, no desde stdin, asi que hay un temporal.
  const localPath = path.join(TMP_DIR, key.replace(/[/\\]/g, '__'));
  await writeFile(localPath, buffer);
  try {
    await execFileAsync(
      'npx',
      [
        'wrangler',
        'r2',
        'object',
        'put',
        `${BUCKET}/${key}`,
        '--file',
        localPath,
        '--content-type',
        contentTypeFor(key),
        '--cache-control',
        CACHE_CONTROL,
        '--remote',
      ],
      { maxBuffer: 10 * 1024 * 1024 }
    );
  } finally {
    await rm(localPath, { force: true });
  }
}

async function runCopy(dryRun: boolean): Promise<void> {
  const keys = await collectKeys();
  const done = await loadProgress();
  const pending = [...keys.entries()].filter(([key]) => !done.has(key));

  console.log(`Keys referenciadas: ${keys.size}`);
  console.log(`Ya copiadas:        ${done.size}`);
  console.log(`Pendientes:         ${pending.length}`);

  if (dryRun) {
    console.log('\n--dry-run: no se sube nada. Primeras 5:');
    pending.slice(0, 5).forEach(([key]) => console.log(`  ${key}`));
    return;
  }
  if (pending.length === 0) return;

  await mkdir(TMP_DIR, { recursive: true });

  let index = 0;
  let ok = 0;
  const failures: { key: string; error: string }[] = [];

  const workers = Array.from(
    { length: Math.min(CONCURRENCY, pending.length) },
    () =>
      (async () => {
        while (index < pending.length) {
          const current = index++;
          const [key, url] = pending[current];
          try {
            await copyOne(key, url);
            done.add(key);
            ok++;
            if (ok % 25 === 0) {
              console.log(`  ${ok}/${pending.length}...`);
              await saveProgress(done);
            }
          } catch (error) {
            failures.push({
              key,
              error: error instanceof Error ? error.message : 'error',
            });
          }
        }
      })()
  );
  await Promise.all(workers);
  await saveProgress(done);

  console.log(`\nSubidas: ${ok}`);
  console.log(`Fallidas: ${failures.length}`);
  failures.slice(0, 10).forEach((f) => console.log(`  ${f.key}: ${f.error}`));
  if (failures.length > 0) {
    console.log('\nVolve a correr `copy`: retoma solo las que faltan.');
  }
}

/**
 * Comprueba contra el dominio publico que cada key este servida por R2.
 * Sin esto, `rewrite` podria dejar la mitad del catalogo sin imagenes.
 */
async function runVerify(): Promise<void> {
  const keys = await collectKeys();
  const missing: string[] = [];
  const entries = [...keys.keys()];
  let index = 0;

  const workers = Array.from(
    { length: Math.min(CONCURRENCY, entries.length) },
    () =>
      (async () => {
        while (index < entries.length) {
          const key = entries[index++];
          const res = await fetch(`https://${R2_HOST}/${key}`, {
            method: 'HEAD',
          }).catch(() => null);
          if (!res || !res.ok) missing.push(key);
        }
      })()
  );
  await Promise.all(workers);

  console.log(`Verificadas: ${entries.length}`);
  console.log(`Faltantes:   ${missing.length}`);
  missing.slice(0, 10).forEach((key) => console.log(`  ${key}`));
  if (missing.length === 0) {
    console.log('\nTodo arriba. Se puede correr `rewrite`.');
  }
}

async function runRewrite(dryRun: boolean): Promise<void> {
  const rows = await loadRows();
  let changed = 0;

  for (const row of rows) {
    const data: { imageUrl?: string; imageThumbUrl?: string } = {};

    const mainKey = storageKey(row.imageUrl);
    if (mainKey) data.imageUrl = `https://${R2_HOST}/${mainKey}`;

    const thumbKey = storageKey(row.imageThumbUrl);
    if (thumbKey) data.imageThumbUrl = `https://${R2_HOST}/${thumbKey}`;

    if (Object.keys(data).length === 0) continue;
    changed++;

    if (dryRun) {
      if (changed <= 3) {
        console.log(`  #${row.id}: ${row.imageUrl} -> ${data.imageUrl}`);
      }
      continue;
    }
    await prisma.series.update({ where: { id: row.id }, data });
  }

  console.log(
    dryRun
      ? `\n--dry-run: se actualizarian ${changed} series.`
      : `\nActualizadas: ${changed} series.`
  );
}

async function main(): Promise<void> {
  const [phase] = process.argv.slice(2);
  const dryRun = process.argv.includes('--dry-run');

  if (phase === 'copy') await runCopy(dryRun);
  else if (phase === 'verify') await runVerify();
  else if (phase === 'rewrite') await runRewrite(dryRun);
  else {
    console.log('Fases: copy | verify | rewrite   (con --dry-run opcional)');
    process.exitCode = 1;
  }
  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
