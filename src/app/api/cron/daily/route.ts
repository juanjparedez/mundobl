import { NextResponse } from 'next/server';
import { runPlayabilityJob } from '@/lib/playability-audit';
import { runLogRetentionJob } from '@/lib/access-log';
import { runNewsIngestJob } from '@/lib/news-ingest';

export const runtime = 'nodejs';
export const maxDuration = 60;

// Hasta cuando puede seguir la limpieza de logs, contado desde el arranque.
// El sondeo se queda con hasta 45s (ver TIME_BUDGET_MS en playability-audit)
// y la limpieza usa lo que sobra, dejando margen para la respuesta.
const DAILY_DEADLINE_MS = 52_000;

/**
 * El unico cron de Vercel (vercel.json, una vez por dia): sondeo de videos,
 * ingesta de noticias y limpieza de logs. Cada uno deja su corrida en
 * /admin/runtime, y si uno falla los demas corren igual.
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

  // Sondeo de videos y noticias van en paralelo: los dos esperan red, no se
  // pisan, y asi la limpieza de logs conserva su margen.
  const [playability, news] = await Promise.allSettled([
    runPlayabilityJob('schedule'),
    runNewsIngestJob(),
  ]);
  if (playability.status === 'rejected') {
    console.error('[cron/daily] playability', playability.reason);
    failed.push('playability');
  } else if (playability.value.budgetExhausted) {
    // La corrida que quedo corta es la unica que pide accion: quedo backlog
    // sin sondear, que va en la proxima.
    const result = playability.value;
    console.warn(
      `[cron/daily] sondeo cortado en ${result.elapsedMs}ms: ` +
        `${result.probed} de ${result.scanned}. El resto va en la proxima corrida.`
    );
  }
  if (news.status === 'rejected') {
    console.error('[cron/daily] news', news.reason);
    failed.push('news');
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
