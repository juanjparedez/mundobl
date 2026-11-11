import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/database';
import { isSameOriginRequest } from '@/lib/request-origin';
import { isSeriesReactionKey } from '@/lib/series-reactions';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const noStore = { 'Cache-Control': 'no-store' };

/**
 * POST /api/series/[id]/reactions — { reaction, active }
 *
 * Suma (active: true) o resta (active: false) uno al total del emoji. Sin
 * cuenta tambien: quien reacciono lo recuerda el navegador. Solo POST desde
 * el propio sitio, asi crawlers y prefetch nunca cuentan; el Worker ya corta
 * por IP las escrituras a /api (cloudflare/worker.ts). El total nunca baja
 * de cero.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  if (!isSameOriginRequest(request))
    return new NextResponse(null, { status: 403 });

  const { id } = await params;
  const seriesId = Number.parseInt(id, 10);
  if (!Number.isSafeInteger(seriesId) || seriesId < 1)
    return new NextResponse(null, { status: 400 });

  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== 'object')
    return new NextResponse(null, { status: 400 });
  const { reaction, active } = body as Record<string, unknown>;
  if (!isSeriesReactionKey(reaction) || typeof active !== 'boolean')
    return new NextResponse(null, { status: 400 });

  try {
    const session = await auth();
    if (session?.user?.banned)
      return new NextResponse(null, { status: 403, headers: noStore });

    const series = await prisma.series.findUnique({
      where: { id: seriesId },
      select: { visibility: true },
    });
    if (!series || series.visibility !== 'VISIBLE')
      return new NextResponse(null, { status: 400 });

    if (active) {
      await prisma.seriesReactionCount.upsert({
        where: { seriesId_reaction: { seriesId, reaction } },
        create: { seriesId, reaction, count: 1 },
        update: { count: { increment: 1 } },
      });
    } else {
      await prisma.seriesReactionCount.updateMany({
        where: { seriesId, reaction, count: { gt: 0 } },
        data: { count: { decrement: 1 } },
      });
    }
    return new NextResponse(null, { status: 204, headers: noStore });
  } catch {
    return new NextResponse(null, { status: 503, headers: noStore });
  }
}
