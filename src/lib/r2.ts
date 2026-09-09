import { AwsClient } from 'aws4fetch';

/**
 * Subida de imagenes a Cloudflare R2 via su API S3-compatible.
 *
 * Por que R2 y no Supabase Storage: medido el 2026-09-09, el 99,8% de las
 * requests a Supabase eran imagenes, y Supabase cobra ese egress este
 * cacheado o no. R2 no cobra egress. Los 604 posters existentes se migraron
 * con scripts/migrate-images-to-r2.ts; esto cierra la otra mitad, para que
 * lo que se sube de ahora en mas nazca directamente en R2.
 *
 * Se firma con aws4fetch (80 KB) en vez del SDK de AWS: es un PUT firmado y
 * nada mas, y el SDK completo pesa ordenes de magnitud mas en una lambda.
 */

const REGION = 'auto'; // R2 siempre usa "auto" como region S3.

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicHost: string;
}

/**
 * Devuelve la config si estan las 5 variables, o null si falta alguna.
 * Null significa "R2 no configurado todavia" — los callers caen a Supabase
 * en vez de romper la subida.
 */
export function getR2Config(): R2Config | null {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET;
  const publicHost = process.env.R2_PUBLIC_HOST;

  if (
    !accountId ||
    !accessKeyId ||
    !secretAccessKey ||
    !bucket ||
    !publicHost
  ) {
    return null;
  }
  return { accountId, accessKeyId, secretAccessKey, bucket, publicHost };
}

export function isR2Configured(): boolean {
  return getR2Config() !== null;
}

let cachedClient: AwsClient | null = null;

function getClient(config: R2Config): AwsClient {
  if (!cachedClient) {
    cachedClient = new AwsClient({
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
      service: 's3',
      region: REGION,
    });
  }
  return cachedClient;
}

function endpointFor(config: R2Config, key: string): string {
  return `https://${config.accountId}.r2.cloudflarestorage.com/${config.bucket}/${key}`;
}

/** URL publica final de una key, servida por el dominio conectado al bucket. */
export function r2PublicUrl(key: string, config?: R2Config): string {
  const resolved = config ?? getR2Config();
  if (!resolved) throw new Error('R2 no configurado');
  return `https://${resolved.publicHost}/${key}`;
}

/**
 * Sube un buffer a R2 y devuelve su URL publica.
 *
 * El cache-control es de un año e `immutable` porque las keys llevan
 * timestamp + sufijo aleatorio: el contenido de una key nunca cambia. Es el
 * mismo valor con el que se migraron los archivos existentes.
 */
export async function uploadToR2(
  file: Buffer,
  key: string,
  contentType: string
): Promise<string> {
  const config = getR2Config();
  if (!config) throw new Error('R2 no configurado');

  const client = getClient(config);
  const response = await client.fetch(endpointFor(config, key), {
    method: 'PUT',
    body: new Uint8Array(file),
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(
      `R2 respondio ${response.status} subiendo ${key}: ${detail.slice(0, 200)}`
    );
  }

  return r2PublicUrl(key, config);
}

/** Borra un objeto de R2. Silencioso si ya no existe. */
export async function deleteFromR2(key: string): Promise<void> {
  const config = getR2Config();
  if (!config) throw new Error('R2 no configurado');

  const client = getClient(config);
  const response = await client.fetch(endpointFor(config, key), {
    method: 'DELETE',
  });

  if (!response.ok && response.status !== 404) {
    throw new Error(`R2 respondio ${response.status} borrando ${key}`);
  }
}

/** Extrae la key de una URL publica de R2, o null si no es de R2. */
export function r2KeyFromUrl(url: string): string | null {
  const config = getR2Config();
  if (!config) return null;
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== config.publicHost) return null;
    return decodeURIComponent(parsed.pathname.replace(/^\//, ''));
  } catch {
    return null;
  }
}
