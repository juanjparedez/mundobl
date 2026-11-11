import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/database';
import { isSameOriginRequest } from '@/lib/request-origin';
import {
  FACT_EDITOR_ROLES,
  isFactValue,
  isSeriesFactKey,
} from '@/lib/series-facts';
import {
  getSeriesFacts,
  setSeriesFactOverride,
  setSeriesFactVote,
} from '@/lib/series-facts-store';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const noStore = { 'Cache-Control': 'no-store' };

function parseId(id: string): number | null {
  const seriesId = Number.parseInt(id, 10);
  return Number.isSafeInteger(seriesId) && seriesId > 0 ? seriesId : null;
}

/** GET /api/series/[id]/facts — { facts, mine, canEdit } */
export async function GET(_request: Request, { params }: RouteParams) {
  const seriesId = parseId((await params).id);
  if (!seriesId) return NextResponse.json({}, { status: 400 });
  try {
    const session = await auth();
    const userId = session?.user?.id ?? null;
    const view = await getSeriesFacts(seriesId, userId);
    const role = session?.user?.role ?? '';
    return NextResponse.json(
      {
        ...view,
        canEdit:
          !session?.user?.banned &&
          (FACT_EDITOR_ROLES as readonly string[]).includes(role),
      },
      { headers: noStore }
    );
  } catch {
    return NextResponse.json({}, { status: 503, headers: noStore });
  }
}

/**
 * POST /api/series/[id]/facts — { fact, value, official? }
 * Voto de una cuenta (value null lo borra). Con official: true, el equipo
 * fija el valor publico (value null vuelve al consenso).
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  if (!isSameOriginRequest(request))
    return NextResponse.json({}, { status: 403 });
  const seriesId = parseId((await params).id);
  if (!seriesId) return NextResponse.json({}, { status: 400 });

  const authResult = await requireAuth();
  if (!authResult.authorized) return authResult.response;

  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== 'object')
    return NextResponse.json({}, { status: 400 });
  const { fact, value, official } = body as Record<string, unknown>;
  if (!isSeriesFactKey(fact)) return NextResponse.json({}, { status: 400 });
  if (value !== null && !isFactValue(fact, value))
    return NextResponse.json({}, { status: 400 });
  const nextValue = value as string | null;

  if (
    official === true &&
    !(FACT_EDITOR_ROLES as readonly string[]).includes(authResult.role)
  )
    return NextResponse.json({}, { status: 403 });

  try {
    const series = await prisma.series.findUnique({
      where: { id: seriesId },
      select: { visibility: true },
    });
    if (!series || series.visibility !== 'VISIBLE')
      return NextResponse.json({}, { status: 400 });

    if (official === true)
      await setSeriesFactOverride(seriesId, authResult.userId, fact, nextValue);
    else await setSeriesFactVote(seriesId, authResult.userId, fact, nextValue);

    const view = await getSeriesFacts(seriesId, authResult.userId);
    return NextResponse.json(view, { headers: noStore });
  } catch {
    return NextResponse.json({}, { status: 503, headers: noStore });
  }
}
