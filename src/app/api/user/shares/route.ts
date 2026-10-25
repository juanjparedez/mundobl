import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import {
  SHARE_CHANNELS,
  recordSeriesShare,
  type ShareChannel,
} from '@/lib/database';

/**
 * POST /api/user/shares
 * Body: { seriesId: number, channel: ShareChannel }
 *
 * Lo llama el boton Compartir de la ficha y de /ver cuando el share se
 * completo. Alimenta los logros de compartir; repetir la misma serie no suma.
 */
export async function POST(request: NextRequest) {
  const authResult = await requireAuth();
  if (!authResult.authorized) return authResult.response;

  let body: { seriesId?: unknown; channel?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 });
  }

  const seriesId = body.seriesId;
  const channel = body.channel;
  if (
    typeof seriesId !== 'number' ||
    !Number.isInteger(seriesId) ||
    seriesId <= 0 ||
    !SHARE_CHANNELS.includes(channel as ShareChannel)
  ) {
    return NextResponse.json({ error: 'Datos inválidos.' }, { status: 400 });
  }

  const recorded = await recordSeriesShare(
    authResult.userId,
    seriesId,
    channel as ShareChannel
  );
  if (!recorded) {
    return NextResponse.json({ error: 'Serie inexistente.' }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
