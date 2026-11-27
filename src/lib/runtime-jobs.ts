import { LeaseBusyError, withLease } from './lease';
import { runPlayabilityJob } from './playability-audit';
import { runNewsIngestJob } from './news-ingest';
import { runLogRetentionJob } from './access-log';

export type RuntimeJob = 'daily' | 'playability' | 'news';
export type RuntimeTrigger = 'manual' | 'schedule';
export class RuntimeJobBusyError extends Error {}

// Workers Logs guarda un Error pasado como segundo argumento solo como su
// stack, sin el mensaje: "GEMINI_API_KEY no esta configurado" quedaba oculto.
function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** One shared entry point for the scheduler and the authenticated admin UI. */
export async function runRuntimeJob(job: RuntimeJob, trigger: RuntimeTrigger) {
  const started = Date.now();
  // One job at a time across every Worker isolate; the lease expires on its
  // own if an isolate dies mid-run.
  return withLease(
    'runtime-job',
    async () => {
      const tasks =
        job === 'daily' ? (['playability', 'news'] as const) : [job];
      const results = await Promise.allSettled(
        tasks.map((task) =>
          task === 'news'
            ? runNewsIngestJob(trigger)
            : runPlayabilityJob(trigger)
        )
      );
      const failed: string[] = [];
      const completed: string[] = [];
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          failed.push(tasks[index]);
          console.error(
            `[runtime-job] ${tasks[index]}: ${errorText(result.reason)}`
          );
        } else completed.push(tasks[index]);
      });
      if (job === 'daily') {
        try {
          await runLogRetentionJob(started + 52_000, trigger);
          completed.push('logs');
        } catch (error) {
          failed.push('logs');
          console.error(`[runtime-job] logs: ${errorText(error)}`);
        }
      }
      const details = Object.fromEntries(
        results.flatMap((result, index) =>
          result.status === 'fulfilled' ? [[tasks[index], result.value]] : []
        )
      );
      return { ok: failed.length === 0, completed, failed, details };
    },
    { ttlMs: 120_000, waitMs: 0 }
  ).catch((error: unknown) => {
    if (error instanceof LeaseBusyError)
      throw new RuntimeJobBusyError('A maintenance job is already running.');
    throw error;
  });
}
