import { NextResponse } from 'next/server';
import { getPublicSeriesActivity } from '@/lib/series-activity-stats';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// La ficha y /ver son ISR por una semana: el contador semanal no puede ir
// horneado ahi. Este GET es publico e igual para todos, asi que lo cachea la
// CDN una hora: como mucho una funcion por serie por hora.
const cacheHeaders = {
  'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
};

/** GET /api/series/[id]/activity — { chapters: number | null } */
export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  const seriesId = Number.parseInt(id, 10);
  if (!Number.isSafeInteger(seriesId) || seriesId < 1)
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  try {
    const chapters = await getPublicSeriesActivity(seriesId);
    return NextResponse.json({ chapters }, { headers: cacheHeaders });
  } catch {
    return NextResponse.json(
      { chapters: null },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
