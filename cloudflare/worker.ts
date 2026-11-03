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

interface WorkerEnv {
  CRON_SECRET?: string;
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

export default {
  fetch: handler.fetch,

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
    const response = await handler.fetch(request, env, ctx);
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
