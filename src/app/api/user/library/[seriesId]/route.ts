import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { getWatchingSeasons } from '@/lib/database';

interface RouteParams {
  params: Promise<{ seriesId: string }>;
}

/** Capitulos de una serie de "Mi seguimiento": se piden al abrir su cajon. */
export async function GET(_request: Request, { params }: RouteParams) {
  const auth = await requireAuth();
  if (!auth.authorized) return auth.response;
  const seriesId = Number((await params).seriesId);
  if (!Number.isSafeInteger(seriesId) || seriesId <= 0) {
    return NextResponse.json({ error: 'Invalid series' }, { status: 400 });
  }
  try {
    return NextResponse.json(await getWatchingSeasons(seriesId), {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch {
    return NextResponse.json(
      { error: 'Unable to load episodes' },
      { status: 500 }
    );
  }
}
