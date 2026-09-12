import { NextResponse } from 'next/server';
import { runPlayabilityAudit } from '@/lib/playability-audit';

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
    const result = await runPlayabilityAudit();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error('[cron/playability]', error);
    return NextResponse.json(
      { error: 'No se pudo completar el audit de reproducibilidad.' },
      { status: 500 }
    );
  }
}
