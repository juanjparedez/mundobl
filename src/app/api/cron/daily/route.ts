import { NextResponse } from 'next/server';
import { runRuntimeJob, RuntimeJobBusyError } from '@/lib/runtime-jobs';
import { revalidateSeriesListings } from '@/lib/revalidate-series';
export const runtime = 'nodejs';
export const maxDuration = 60;
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret)
    return NextResponse.json(
      { error: 'CRON_SECRET no configurado.' },
      { status: 503 }
    );
  if (request.headers.get('authorization') !== `Bearer ${secret}`)
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  try {
    const result = await runRuntimeJob('daily', 'schedule');
    if (result.completed.includes('playability')) revalidateSeriesListings();
    return NextResponse.json(result, { status: result.ok ? 200 : 500 });
  } catch (error) {
    if (error instanceof RuntimeJobBusyError)
      return NextResponse.json({ ok: false, error: 'busy' }, { status: 409 });
    console.error('[cron/daily]', error);
    return NextResponse.json(
      { ok: false, error: 'Daily job failed' },
      { status: 500 }
    );
  }
}
