/**
 * Entrada del Worker: el handler que genera OpenNext (`fetch`) mas los crons,
 * que en Vercel vivian en vercel.json. Cada cron pega a su ruta de
 * /api/cron/* con CRON_SECRET, igual que hacia Vercel, asi la logica sigue en
 * un solo lugar. Los horarios estan en wrangler.jsonc (`triggers.crons`).
 *
 * Fuera del tsconfig: .open-next/worker.js solo existe despues del build.
 */
// Generado por `opennextjs-cloudflare build`.
import { default as openNextHandler } from '../.open-next/worker.js';
import { isScannerPath } from '../src/lib/scanner-paths';

interface WorkerEnv {
  CRON_SECRET?: string;
  DATABASE_URL?: string;
  /** Lo agrega el deploy (scripts/ensure-hyperdrive.mjs) si se pudo crear. */
  HYPERDRIVE?: { connectionString: string };
  /** Rate limiting de Cloudflare (wrangler.jsonc `ratelimits`), incluido. */
  RATE_LIMITER?: {
    limit(options: { key: string }): Promise<{ success: boolean }>;
  };
}

interface ScheduledController {
  cron: string;
  scheduledTime: number;
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

interface FetchHandler {
  fetch(
    request: Request,
    env: WorkerEnv,
    ctx: ExecutionContext
  ): Promise<Response>;
}

const handler = openNextHandler as FetchHandler;

/** Cron de wrangler.jsonc -> ruta que ejecuta. */
const CRON_ROUTES: Record<string, string> = {
  '0 5 * * *': '/api/cron/daily',
  '0 12 * * *': '/api/cron/alerts',
};

const SITE_HOST = 'mundobl.com.ar';
const SITE_ORIGIN = `https://${SITE_HOST}`;

/**
 * Con Hyperdrive, la app usa su connection string en vez de DATABASE_URL.
 * OpenNext copia las variables string del env a process.env en cada request,
 * asi que pisar DATABASE_URL en el env que recibe es la forma de que Prisma
 * (src/lib/database.ts) la tome sin saber nada de Cloudflare. Sin el binding
 * queda todo igual que antes.
 */
function withHyperdrive(env: WorkerEnv): WorkerEnv {
  const connectionString = env.HYPERDRIVE?.connectionString;
  return connectionString ? { ...env, DATABASE_URL: connectionString } : env;
}

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Filtros baratos ANTES de Next (cada uno ahorra CPU y consultas a la base):
 * - www.mundobl.com.ar: 301 al dominio principal (contenido duplicado).
 * - Scanners (/wp-login.php, /.env...): 404 sin renderizar nada. /admin
 *   queda afuera porque ahi el proxy registra la IP para poder banearla.
 * - Escrituras a /api (comentarios, feedback, seguimiento, contadores): tope
 *   por IP con el rate limiter de Cloudflare. Los GET y los crawlers no
 *   pasan por aca. Los crons llegan por scheduled(), sin IP, y no cuentan.
 */
async function answerEarly(
  request: Request,
  env: WorkerEnv
): Promise<Response | null> {
  const url = new URL(request.url);
  const { pathname } = url;
  // Una sola version del sitio para Google: www -> dominio principal (301).
  if (url.hostname === `www.${SITE_HOST}`) {
    url.hostname = SITE_HOST;
    return Response.redirect(url.toString(), 301);
  }
  if (!pathname.startsWith('/admin') && isScannerPath(pathname)) {
    return new Response('Not found', {
      status: 404,
      headers: { 'cache-control': 'public, max-age=86400' },
    });
  }
  const ip = request.headers.get('cf-connecting-ip');
  if (
    env.RATE_LIMITER &&
    ip &&
    !SAFE_METHODS.has(request.method) &&
    pathname.startsWith('/api/')
  ) {
    const { success } = await env.RATE_LIMITER.limit({ key: ip });
    if (!success) {
      return new Response('Too many requests', {
        status: 429,
        headers: { 'retry-after': '60', 'cache-control': 'no-store' },
      });
    }
  }
  return null;
}

/**
 * GET publicos e iguales para todos que se piden en cada ficha (contadores de
 * la serie). La respuesta de un Worker no pasa por la cache del CDN sola: se
 * guarda a mano con la Cache API, que respeta su s-maxage. Incluida en el
 * plan, sin costo por uso; es por datacenter.
 */
const EDGE_CACHED_GET = /^\/api\/series\/\d+\/activity$/;

interface EdgeCache {
  match(request: Request): Promise<Response | undefined>;
  put(request: Request, response: Response): Promise<void>;
}

function edgeCache(): EdgeCache | null {
  const storage = (globalThis as { caches?: { default?: EdgeCache } }).caches;
  return storage?.default ?? null;
}

async function fetchEdgeCached(
  request: Request,
  env: WorkerEnv,
  ctx: ExecutionContext
): Promise<Response> {
  const cache = edgeCache();
  // Sin query string: ?x=1 no puede saltar la cache.
  const url = new URL(request.url);
  url.search = '';
  const key = new Request(url.toString(), { method: 'GET' });
  const hit = cache ? await cache.match(key).catch(() => undefined) : undefined;
  if (hit) return hit;
  const response = await handler.fetch(request, withHyperdrive(env), ctx);
  if (cache && response.ok) {
    ctx.waitUntil(cache.put(key, response.clone()).catch(() => undefined));
  }
  return response;
}

export default {
  async fetch(request: Request, env: WorkerEnv, ctx: ExecutionContext) {
    const early = await answerEarly(request, env);
    if (early) return early;
    if (
      request.method === 'GET' &&
      EDGE_CACHED_GET.test(new URL(request.url).pathname)
    ) {
      return fetchEdgeCached(request, env, ctx);
    }
    return handler.fetch(request, withHyperdrive(env), ctx);
  },

  async scheduled(
    controller: ScheduledController,
    env: WorkerEnv,
    ctx: ExecutionContext
  ): Promise<void> {
    const path = CRON_ROUTES[controller.cron];
    if (!path) {
      console.error(`[cron] sin ruta para "${controller.cron}"`);
      return;
    }
    // Llamada interna al mismo Worker: no sale a internet ni pasa por DNS.
    const request = new Request(new URL(path, SITE_ORIGIN), {
      headers: { authorization: `Bearer ${env.CRON_SECRET ?? ''}` },
    });
    const response = await handler.fetch(request, withHyperdrive(env), ctx);
    const body = await response.text();
    if (!response.ok) {
      // Tirar marca la ejecucion como fallida en el dashboard de Cloudflare.
      throw new Error(`[cron] ${path} -> ${response.status}: ${body}`);
    }
    console.log(`[cron] ${path} -> ${response.status}`);
  },
};

// Durable Objects de la cache (ver open-next.config.ts), tambien generados.
export { DOQueueHandler, DOShardedTagCache } from '../.open-next/worker.js';
