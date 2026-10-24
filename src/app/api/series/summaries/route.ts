import { NextRequest, NextResponse } from 'next/server';
import { getSeriesSummaries, MAX_SUMMARY_IDS } from '@/lib/series-summaries';

// Datos publicos e iguales para todos: la CDN los cachea unos minutos.
const cacheHeaders = {
  'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600',
};

/** GET /api/series/summaries?ids=1,2,3 — para las listas sin cuenta. */
export async function GET(request: NextRequest) {
  const ids = [
    ...new Set(
      (request.nextUrl.searchParams.get('ids') ?? '')
        .split(',')
        .map((value) => Number.parseInt(value, 10))
        .filter((id) => Number.isSafeInteger(id) && id > 0)
    ),
  ];
  if (ids.length === 0 || ids.length > MAX_SUMMARY_IDS)
    return NextResponse.json({ error: 'ids inválidos' }, { status: 400 });
  try {
    // El cliente manda los ids ordenados: misma lista, misma entrada de cache.
    const summaries = await getSeriesSummaries(ids);
    return NextResponse.json(summaries, { headers: cacheHeaders });
  } catch {
    return NextResponse.json(
      { error: 'No disponible' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
