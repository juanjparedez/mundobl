import { NextResponse } from 'next/server';
import { runPlayabilityJob } from '@/lib/playability-audit';

export const runtime = 'nodejs';
export const maxDuration = 60;

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

  try {
    // Registra la corrida (ok o error) para /admin/runtime.
    const result = await runPlayabilityJob('schedule');

    // La corrida que quedo corta es la unica que pide accion: quedo backlog
    // sin sondear, que va en la proxima.
    if (result.budgetExhausted) {
      console.warn(
        `[cron/playability] presupuesto agotado en ${result.elapsedMs}ms: ` +
          `sondeados ${result.probed} de ${result.scanned}. El resto va en la proxima corrida.`
      );
    }

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error('[cron/playability]', error);
    return NextResponse.json(
      { error: 'No se pudo completar el audit de reproducibilidad.' },
      { status: 500 }
    );
  }
}
