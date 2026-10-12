import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/database';
import {
  isGagaUrl,
  PILOT_PLACEMENTS,
  type PilotPlacement,
} from '@/lib/pilot-clicks';

export async function POST(request: NextRequest) {
  // No GET tracking: crawlers and prefetches must never count as clicks.
  if (request.headers.get('origin') !== request.nextUrl.origin)
    return new NextResponse(null, { status: 403 });
  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== 'object')
    return new NextResponse(null, { status: 400 });
  const { placement, watchLinkId } = body as Record<string, unknown>;
  if (!PILOT_PLACEMENTS.includes(placement as PilotPlacement))
    return new NextResponse(null, { status: 400 });
  if (placement === 'platforms' && watchLinkId !== undefined)
    return new NextResponse(null, { status: 400 });
  try {
    const session = await auth();
    if (
      session?.user?.banned ||
      ['ADMIN', 'MODERATOR', 'COLLABORATOR'].includes(session?.user?.role ?? '')
    )
      return new NextResponse(null, { status: 204 });
    if (placement === 'series') {
      if (!Number.isSafeInteger(watchLinkId) || Number(watchLinkId) < 1)
        return new NextResponse(null, { status: 400 });
      const link = await prisma.watchLink.findUnique({
        where: { id: Number(watchLinkId) },
        select: {
          url: true,
          official: true,
          series: { select: { visibility: true } },
        },
      });
      if (
        !link?.official ||
        link.series.visibility !== 'VISIBLE' ||
        !isGagaUrl(link.url)
      )
        return new NextResponse(null, { status: 400 });
    }
    const day = new Date(new Date().toISOString().slice(0, 10));
    await prisma.pilotClickDaily.upsert({
      where: { day_placement: { day, placement: String(placement) } },
      create: { day, placement: String(placement), clicks: 1 },
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
