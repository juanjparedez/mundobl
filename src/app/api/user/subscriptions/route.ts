import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requireAuth } from '@/lib/auth-helpers';

/**
 * Ids de las series a las que el usuario esta suscripto.
 *
 * Existe para que una vista con muchas series (la parrilla de /estrenos) resuelva
 * el estado de todas las campanitas en UN fetch, en vez de N llamadas a
 * `GET /api/series/[id]/subscribe`. El alta/baja sigue yendo por ese endpoint.
 *
 * Devuelve solo ids propios: no expone a quien mas sigue una serie.
 */
export async function GET() {
  const auth = await requireAuth();
  if (!auth.authorized) return auth.response;

  const subscriptions = await prisma.seriesSubscription.findMany({
    where: { userId: auth.userId },
    select: { seriesId: true },
  });

  return NextResponse.json({
    seriesIds: subscriptions.map((s) => s.seriesId),
  });
}
