import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/database';
import {
  WATCH_LINK_SURFACES,
  type WatchLinkSurface,
} from '@/lib/outbound-links';

export async function POST(request: NextRequest) {
  // No GET tracking: crawlers and prefetches must never count as clicks.
  if (request.headers.get('origin') !== request.nextUrl.origin)
    return new NextResponse(null, { status: 403 });
  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== 'object')
    return new NextResponse(null, { status: 400 });
  const { watchLinkId, surface } = body as Record<string, unknown>;
  if (!WATCH_LINK_SURFACES.includes(surface as WatchLinkSurface))
    return new NextResponse(null, { status: 400 });
  if (!Number.isSafeInteger(watchLinkId) || Number(watchLinkId) < 1)
    return new NextResponse(null, { status: 400 });
  try {
    const session = await auth();
    // El equipo prueba links todo el tiempo: no es audiencia.
    if (
      session?.user?.banned ||
      ['ADMIN', 'MODERATOR', 'COLLABORATOR'].includes(session?.user?.role ?? '')
    )
      return new NextResponse(null, { status: 204 });
    const link = await prisma.watchLink.findUnique({
      where: { id: Number(watchLinkId) },
      select: { series: { select: { visibility: true } } },
    });
    if (!link || link.series.visibility !== 'VISIBLE')
      return new NextResponse(null, { status: 400 });
    const day = new Date(new Date().toISOString().slice(0, 10));
    await prisma.watchLinkClickDaily.upsert({
      where: {
        day_watchLinkId_surface: {
          day,
          watchLinkId: Number(watchLinkId),
          surface: String(surface),
        },
      },
      create: {
        day,
        watchLinkId: Number(watchLinkId),
        surface: String(surface),
        clicks: 1,
      },
      update: { clicks: { increment: 1 } },
    });
    return new NextResponse(null, {
      status: 204,
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch {
    return new NextResponse(null, { status: 503 });
  }
}
