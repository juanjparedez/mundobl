import { prisma } from '@/lib/database';

/**
 * Registro de las corridas de los crons, en AccessLog (action CRON_RUN) para
 * no sumar una tabla: /admin/runtime ya lee los errores de ahi mismo. Antes
 * la unica huella de una corrida era el log de invocacion de Vercel, asi que
 * un cron que dejaba de correr pasaba desapercibido.
 */
export const CRON_RUN_ACTION = 'CRON_RUN';

export type CronSummary = Record<string, string | number | boolean | null>;

export interface CronRun {
  job: string;
  at: string;
  ok: boolean;
  durationMs: number;
  summary: CronSummary;
  error: string | null;
}

/** Con await: en una funcion serverless un fire-and-forget se pierde al terminar. */
export async function recordCronRun(run: {
  job: string;
  ok: boolean;
  durationMs: number;
  summary?: CronSummary;
  error?: string;
}): Promise<void> {
  try {
    await prisma.accessLog.create({
      data: {
        action: CRON_RUN_ACTION,
        path: `/api/cron/${run.job}`,
        method: 'CRON',
        metadata: JSON.stringify({
          ok: run.ok,
          durationMs: run.durationMs,
          summary: run.summary ?? {},
          error: run.error ?? null,
        }),
      },
    });
  } catch {
    // Registrar nunca puede romper el cron.
  }
}

interface StoredRun {
  ok?: boolean;
  durationMs?: number;
  summary?: CronSummary;
  error?: string | null;
}

export async function getRecentCronRuns(limit = 10): Promise<CronRun[]> {
  const rows = await prisma.accessLog.findMany({
    where: { action: CRON_RUN_ACTION },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: { path: true, createdAt: true, metadata: true },
  });

  return rows.map((row) => {
    let stored: StoredRun = {};
    try {
      stored = JSON.parse(row.metadata ?? '{}') as StoredRun;
    } catch {
      // Fila ilegible: se muestra como corrida fallida sin detalle.
    }
    return {
      job: row.path.replace('/api/cron/', ''),
      at: row.createdAt.toISOString(),
      ok: stored.ok === true,
      durationMs: typeof stored.durationMs === 'number' ? stored.durationMs : 0,
      summary: stored.summary ?? {},
      error: stored.error ?? null,
    };
  });
}
