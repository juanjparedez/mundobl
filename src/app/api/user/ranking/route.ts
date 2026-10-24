import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { getOwnRankingPosition } from '@/lib/community-ranking';

const headers = { 'Cache-Control': 'private, no-store' };

/** Posicion del usuario en el ranking mensual: /estadisticas es ISR y no la conoce. */
export async function GET() {
  const auth = await requireAuth();
  if (!auth.authorized) return auth.response;
  try {
    const position = await getOwnRankingPosition(auth.userId);
    // El equipo no compite: sin esto vería "no marcaste capítulos este mes".
    const staff = auth.role === 'ADMIN' || auth.role === 'MODERATOR';
    return NextResponse.json({ ...position, staff }, { headers });
  } catch {
    return NextResponse.json(
      { code: 'RANKING_UNAVAILABLE' },
      { status: 503, headers }
    );
  }
}
