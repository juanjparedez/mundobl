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

const SITE_ORIGIN = 'https://mundobl.com.ar';

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
 * - Scanners (/wp-login.php, /.env...): 404 sin renderizar nada. /admin
 *   queda afuera porque ahi el proxy registra la IP para poder banearla.
 * - Escrituras a /api (comentarios, feedback, seguimiento, contadores): tope
 *   por IP con el rate limiter de Cloudflare. Los GET y los crawlers no
 *   pasan por aca. Los crons llegan por scheduled(), sin IP, y no cuentan.
 */
async function rejectEarly(
  request: Request,
  env: WorkerEnv
): Promise<Response | null> {
  const { pathname } = new URL(request.url);
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

export default {
  async fetch(request: Request, env: WorkerEnv, ctx: ExecutionContext) {
    const rejected = await rejectEarly(request, env);
    if (rejected) return rejected;
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
