import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helpers';
import { runRuntimeJob, RuntimeJobBusyError } from '@/lib/runtime-jobs';
import { revalidateSeriesListings } from '@/lib/revalidate-series';

export const runtime = 'nodejs';
export const maxDuration = 60;

// POST /api/admin/runtime/cron/playability — corre ahora el mismo sondeo que
// el cron diario (disponibilidad por pais + estadisticas de YouTube), sin
// esperar a las 05:00 UTC. Queda en el historial como corrida manual.
export async function POST() {
  const authResult = await requireRole(['ADMIN']);
  if (!authResult.authorized) return authResult.response;

  try {
    const result = await runRuntimeJob('playability', 'manual');
    if (result.completed.includes('playability')) revalidateSeriesListings();
    return NextResponse.json(
      { ...result.details.playability, ok: result.ok },
      { status: result.ok ? 200 : 500 }
    );
  } catch (error) {
    if (error instanceof RuntimeJobBusyError)
      return NextResponse.json({ error: 'busy' }, { status: 409 });
    console.error('[admin/runtime/cron/playability]', error);
    return NextResponse.json(
      { error: 'No se pudo completar el sondeo.' },
      { status: 500 }
    );
  }
}
