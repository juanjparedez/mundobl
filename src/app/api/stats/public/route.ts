import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database';

interface RawNamedCountRow {
  name: string;
  count: bigint;
}

interface RawActorCountRow {
  id: number;
  name: string;
  count: bigint;
}

interface RawTypeCountRow {
  type: string;
  count: bigint;
}

interface RawYearCountRow {
  year: number | null;
  count: bigint;
}

// GET /api/stats/public - metricas globales anonimas para todo publico
export async function GET() {
  try {
    const [
      totalSeries,
      totalPublicComments,
      totalCompletedViews,
      totalActors,
      totalDirectors,
      topSeriesRows,
      topActorsRows,
      topProductionCompaniesRows,
      topCountriesRows,
      topTypesRows,
      // Catalog fixed stats (series count, not view count)
      catalogByCountryRows,
      catalogByTypeRows,
      catalogByGenreRows,
      catalogByYearRows,
    ] = await Promise.all([
      prisma.series.count(),
      prisma.comment.count({ where: { isPrivate: false } }),
      prisma.viewStatus.count({
        where: { status: 'VISTA', seriesId: { not: null } },
      }),
      prisma.actor.count(),
      prisma.director.count(),
      prisma.viewStatus.groupBy({
        by: ['seriesId'],
        where: { status: 'VISTA', seriesId: { not: null } },
        _count: { seriesId: true },
        orderBy: { _count: { seriesId: 'desc' } },
        take: 15,
      }),
      prisma.$queryRaw<RawActorCountRow[]>`
        SELECT a.id, a.name, COUNT(*) as count
        FROM "ViewStatus" vs
        JOIN "SeriesActor" sa ON sa."seriesId" = vs."seriesId"
        JOIN "Actor" a ON a.id = sa."actorId"
        WHERE vs.status = 'VISTA'
          AND vs."seriesId" IS NOT NULL
        GROUP BY a.id, a.name
        ORDER BY count DESC
        LIMIT 15
      `,
      prisma.$queryRaw<RawNamedCountRow[]>`
        SELECT pc.name, COUNT(*) as count
        FROM "ViewStatus" vs
        JOIN "Series" s ON s.id = vs."seriesId"
        JOIN "ProductionCompany" pc ON pc.id = s."productionCompanyId"
        WHERE vs.status = 'VISTA'
          AND vs."seriesId" IS NOT NULL
          AND s."productionCompanyId" IS NOT NULL
        GROUP BY pc.name
        ORDER BY count DESC
        LIMIT 15
      `,
      prisma.$queryRaw<RawNamedCountRow[]>`
        SELECT c.name, COUNT(*) as count
        FROM "ViewStatus" vs
        JOIN "Series" s ON s.id = vs."seriesId"
        JOIN "Country" c ON c.id = s."countryId"
        WHERE vs.status = 'VISTA'
          AND vs."seriesId" IS NOT NULL
          AND s."countryId" IS NOT NULL
        GROUP BY c.name
        ORDER BY count DESC
        LIMIT 15
      `,
      prisma.$queryRaw<RawTypeCountRow[]>`
        SELECT s.type, COUNT(*) as count
        FROM "ViewStatus" vs
        JOIN "Series" s ON s.id = vs."seriesId"
        WHERE vs.status = 'VISTA'
          AND vs."seriesId" IS NOT NULL
        GROUP BY s.type
        ORDER BY count DESC
      `,
      // Catalog: series per country
      prisma.$queryRaw<RawNamedCountRow[]>`
        SELECT c.name, COUNT(*) as count
        FROM "Series" s
        JOIN "Country" c ON c.id = s."countryId"
        WHERE s."countryId" IS NOT NULL
        GROUP BY c.name
        ORDER BY count DESC
        LIMIT 20
      `,
      // Catalog: series per type
      prisma.$queryRaw<RawTypeCountRow[]>`
        SELECT type, COUNT(*) as count
        FROM "Series"
        GROUP BY type
        ORDER BY count DESC
      `,
      // Catalog: series per genre
      prisma.$queryRaw<RawNamedCountRow[]>`
        SELECT g.name, COUNT(*) as count
        FROM "SeriesGenre" sg
        JOIN "Genre" g ON g.id = sg."genreId"
        GROUP BY g.name
        ORDER BY count DESC
        LIMIT 20
      `,
      // Catalog: series per release year
      prisma.$queryRaw<RawYearCountRow[]>`
        SELECT year, COUNT(*) as count
        FROM "Series"
        WHERE year IS NOT NULL
        GROUP BY year
        ORDER BY year DESC
        LIMIT 20
      `,
    ]);

    const seriesIds = topSeriesRows
      .map((row) => row.seriesId)
      .filter((id): id is number => id !== null);

    const series = await prisma.series.findMany({
      where: { id: { in: seriesIds } },
      select: { id: true, title: true },
    });

    const seriesById = new Map(series.map((item) => [item.id, item.title]));

    const response = NextResponse.json({
      generatedAt: new Date().toISOString(),
      summary: {
        totalSeries,
        totalPublicComments,
        totalCompletedViews,
        totalActors,
        totalDirectors,
      },
      rankings: {
        topSeries: topSeriesRows
          .filter((row) => row.seriesId !== null)
          .map((row) => ({
            seriesId: row.seriesId as number,
            title: seriesById.get(row.seriesId as number) ?? 'Sin titulo',
            count: row._count.seriesId,
          })),
        topActors: topActorsRows.map((row) => ({
          actorId: row.id,
          name: row.name,
          count: Number(row.count),
        })),
        topProductionCompanies: topProductionCompaniesRows.map((row) => ({
          name: row.name,
          count: Number(row.count),
        })),
        topCountries: topCountriesRows.map((row) => ({
          name: row.name,
          count: Number(row.count),
        })),
        byType: topTypesRows.map((row) => ({
          type: row.type,
          count: Number(row.count),
        })),
      },
      catalog: {
        byCountry: catalogByCountryRows.map((r) => ({
          name: r.name,
          count: Number(r.count),
        })),
        byType: catalogByTypeRows.map((r) => ({
          type: r.type,
          count: Number(r.count),
        })),
        byGenre: catalogByGenreRows.map((r) => ({
          name: r.name,
          count: Number(r.count),
        })),
        byYear: catalogByYearRows
          .filter((r) => r.year !== null)
          .map((r) => ({
            year: r.year as number,
            count: Number(r.count),
          })),
      },
    });

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
