import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helpers';
import { runPlayabilityJob } from '@/lib/playability-audit';

export const runtime = 'nodejs';
export const maxDuration = 60;

// POST /api/admin/runtime/cron/playability — corre ahora el mismo sondeo que
// el cron diario (disponibilidad por pais + estadisticas de YouTube), sin
// esperar a las 05:00 UTC. Queda en el historial como corrida manual.
export async function POST() {
  const authResult = await requireRole(['ADMIN']);
  if (!authResult.authorized) return authResult.response;

  try {
    const result = await runPlayabilityJob('manual');
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error('[admin/runtime/cron/playability]', error);
    return NextResponse.json(
      { error: 'No se pudo completar el sondeo.' },
      { status: 500 }
    );
  }
}
