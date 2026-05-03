import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/database';

/**
 * Devuelve el timestamp del item más reciente de "novedades" (serie o
 * temporada). Lo usa el sidebar para decidir si mostrar el badge "nuevo".
 * Cacheado 5 minutos: el badge no es información crítica.
 */
const getLatestNovedadTimestamp = unstable_cache(
  async () => {
    const [latestSerie, latestSeason] = await Promise.all([
      prisma.series.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),
      prisma.season.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),
    ]);

    const stamps = [latestSerie?.createdAt, latestSeason?.createdAt]
      .filter((d): d is Date => Boolean(d))
      .map((d) => d.getTime());

    return stamps.length > 0 ? Math.max(...stamps) : null;
  },
  ['novedades-latest-v1'],
  { revalidate: 300 }
);

export async function GET() {
  const ts = await getLatestNovedadTimestamp();
  return NextResponse.json({ timestamp: ts });
}
