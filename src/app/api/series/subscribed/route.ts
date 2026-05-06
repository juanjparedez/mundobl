import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requireAuth } from '@/lib/auth-helpers';

/**
 * GET /api/series/subscribed
 * Devuelve las series a las que el usuario actual esta suscrito,
 * con metadata para mostrar (poster, pais, anio) y la fecha de la
 * ultima notificacion recibida sobre esa serie (sirve como "ultima
 * actividad" para ordenar y dar contexto).
 */
export async function GET() {
  const auth = await requireAuth();
  if (!auth.authorized) return auth.response;

  const subscriptions = await prisma.seriesSubscription.findMany({
    where: { userId: auth.userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      createdAt: true,
      series: {
        select: {
          id: true,
          title: true,
          imageUrl: true,
          imagePosition: true,
          year: true,
          type: true,
          country: { select: { name: true, code: true } },
        },
      },
    },
  });

  // Buscamos en una segunda query la ultima notificacion del usuario
  // para CADA serie suscrita. Lo hacemos asi porque Notification no
  // tiene FK directa a Series — el seriesId vive en linkPath /series/X.
  const seriesIds = subscriptions.map((s) => s.series.id);
  const lastActivityBySeries = new Map<number, Date>();
  if (seriesIds.length > 0) {
    const linkPaths = seriesIds.map((id) => `/series/${id}`);
    const lastNotifs = await prisma.notification.groupBy({
      by: ['linkPath'],
      where: {
        userId: auth.userId,
        linkPath: { in: linkPaths },
      },
      _max: { createdAt: true },
    });
    for (const n of lastNotifs) {
      if (!n.linkPath || !n._max.createdAt) continue;
      const m = /^\/series\/(\d+)$/.exec(n.linkPath);
      if (m) {
        lastActivityBySeries.set(parseInt(m[1], 10), n._max.createdAt);
      }
    }
  }

  const items = subscriptions.map((s) => ({
    subscriptionId: s.id,
    subscribedAt: s.createdAt,
    series: s.series,
    lastActivityAt:
      lastActivityBySeries.get(s.series.id)?.toISOString() ?? null,
  }));

  // Re-ordenar: las series con actividad reciente suben.
  items.sort((a, b) => {
    const aT = a.lastActivityAt
      ? new Date(a.lastActivityAt).getTime()
      : new Date(a.subscribedAt).getTime();
    const bT = b.lastActivityAt
      ? new Date(b.lastActivityAt).getTime()
      : new Date(b.subscribedAt).getTime();
    return bT - aT;
  });

  return NextResponse.json({ items });
}
