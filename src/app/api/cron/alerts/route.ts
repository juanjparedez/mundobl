import { NextResponse } from 'next/server';
import { runAirDayAlerts, runWeeklyDigest } from '@/lib/airing-alerts';
export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * Avisos de estreno (todos los dias) y resumen semanal por mail (lunes). Va
 * aparte del cron diario de mantenimiento por la hora: ver airing-alerts.ts.
 * Las dos tareas son idempotentes, asi que reintentar no duplica nada.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret)
    return NextResponse.json(
      { error: 'CRON_SECRET no configurado.' },
      { status: 503 }
    );
  if (request.headers.get('authorization') !== `Bearer ${secret}`)
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });

  const now = new Date();
  const [airDay, digest] = await Promise.allSettled([
    runAirDayAlerts(now),
    runWeeklyDigest(now),
  ]);
  for (const [name, result] of [
    ['air_day', airDay],
    ['digest', digest],
  ] as const) {
    if (result.status === 'rejected')
      console.error('[cron/alerts]', name, result.reason);
  }
  const ok = airDay.status === 'fulfilled' && digest.status === 'fulfilled';
  return NextResponse.json(
    {
      ok,
      airDay: airDay.status === 'fulfilled' ? airDay.value : null,
      digest: digest.status === 'fulfilled' ? digest.value : null,
    },
    { status: ok ? 200 : 500 }
  );
}
