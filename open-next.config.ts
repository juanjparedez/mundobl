import { defineCloudflareConfig } from '@opennextjs/cloudflare';
import r2IncrementalCache from '@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache';
import doQueue from '@opennextjs/cloudflare/overrides/queue/do-queue';
import doShardedTagCache from '@opennextjs/cloudflare/overrides/tag-cache/do-sharded-tag-cache';

/**
 * Cache de Next en Cloudflare (https://opennext.js.org/cloudflare/caching):
 * - Paginas ISR en R2 (bucket mundobl-opennext-cache, ver wrangler.jsonc).
 * - Revalidacion por tiempo (`export const revalidate`) via la cola en un
 *   Durable Object: sin cola, una pagina vencida nunca se regenera.
 * - revalidatePath()/revalidateTag() (panel admin, crons) via el tag cache en
 *   Durable Objects. revalidatePath usa los tags "soft" de Next, asi que no se
 *   filtran.
 * Los Durable Objects los crea `wrangler deploy` solo: no hay nada que
 * provisionar a mano salvo el bucket de R2.
 */
export default defineCloudflareConfig({
  incrementalCache: r2IncrementalCache,
  queue: doQueue,
  tagCache: doShardedTagCache({ baseShardSize: 4 }),
});
