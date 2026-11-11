import { NextResponse } from 'next/server';
import { getPublicSeriesPageStats } from '@/lib/series-activity-stats';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// La ficha y /ver son ISR por una semana: los contadores no pueden ir
// horneados ahi. Este GET es publico e igual para todos. cloudflare/worker.ts
// lo guarda en la cache del edge por s-maxage: como mucho una consulta por
// serie cada 5 minutos por datacenter. Corto para que una reaccion nueva se
// vea pronto; el navegador suma la propia mientras tanto.
const cacheHeaders = {
  'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
};

/** GET /api/series/[id]/activity — { chapters, views, reactions } */
export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  const seriesId = Number.parseInt(id, 10);
  if (!Number.isSafeInteger(seriesId) || seriesId < 1)
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  try {
    const stats = await getPublicSeriesPageStats(seriesId);
    return NextResponse.json(stats, { headers: cacheHeaders });
  } catch {
    return NextResponse.json(
      { chapters: null, views: null, reactions: {} },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
