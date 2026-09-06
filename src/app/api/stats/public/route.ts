import { NextResponse } from 'next/server';
import { getPublicStats } from '@/lib/public-stats';

// GET /api/stats/public - metricas globales anonimas para todo publico.
// El calculo vive en getPublicStats() (src/lib/public-stats.ts), compartido
// con /estadisticas (server component) — esta ruta queda para quien necesite
// refrescar los datos client-side sin recargar la pagina.
export async function GET() {
  try {
    const stats = await getPublicStats();
    const response = NextResponse.json(stats);

    response.headers.set(
      'Cache-Control',
      'public, s-maxage=300, stale-while-revalidate=600'
    );

    return response;
  } catch (error) {
    console.error('Error fetching public stats:', error);
    return NextResponse.json(
      { error: 'Error al obtener estadisticas publicas' },
      { status: 500 }
    );
  }
}
