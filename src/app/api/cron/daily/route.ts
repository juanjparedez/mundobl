import { NextResponse } from 'next/server';
import { runPlayabilityJob } from '@/lib/playability-audit';
import { runLogRetentionJob } from '@/lib/access-log';

export const runtime = 'nodejs';
export const maxDuration = 60;

// Hasta cuando puede seguir la limpieza de logs, contado desde el arranque.
// El sondeo se queda con hasta 45s (ver TIME_BUDGET_MS en playability-audit)
// y la limpieza usa lo que sobra, dejando margen para la respuesta.
const DAILY_DEADLINE_MS = 52_000;

/**
 * El unico cron de Vercel (vercel.json, una vez por dia). Corre los trabajos
 * en secuencia y cada uno deja su corrida en /admin/runtime. Si uno falla, el
 * siguiente corre igual: la limpieza no depende de que YouTube responda.
 */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json(
      { error: 'CRON_SECRET no configurado.' },
      { status: 503 }
    );
  }

  if (request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }

  const startedAt = Date.now();
  const failed: string[] = [];

  try {
    const result = await runPlayabilityJob('schedule');
    // La corrida que quedo corta es la unica que pide accion: quedo backlog
    // sin sondear, que va en la proxima.
    if (result.budgetExhausted) {
      console.warn(
        `[cron/daily] sondeo cortado en ${result.elapsedMs}ms: ` +
          `${result.probed} de ${result.scanned}. El resto va en la proxima corrida.`
      );
    }
  } catch (error) {
    console.error('[cron/daily] playability', error);
    failed.push('playability');
  }

  try {
    await runLogRetentionJob(startedAt + DAILY_DEADLINE_MS);
  } catch (error) {
    console.error('[cron/daily] logs', error);
    failed.push('logs');
  }

  return NextResponse.json(
    { ok: failed.length === 0, failed },
    { status: failed.length === 0 ? 200 : 500 }
  );
}
