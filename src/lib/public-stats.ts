import {
  prisma,
  PUBLIC_REVIEW_SERIES,
  getCommunityMetrics,
  getActiveCommunityUsersWhere,
} from '@/lib/database';
import type { CommunityMetrics } from '@/types/community';

/**
 * Metricas globales anonimas para /estadisticas.
 *
 * Extraido de `/api/stats/public` (unico consumidor ademas de la pagina:
 * `PublicStatsClient`) para que la pagina calcule esto del lado del
 * SERVIDOR y se renderice como contenido estatico con ISR — antes era un
 * shell client-side que recien pedia los datos en un `useEffect` tras el
 * mount, asi que el primer render siempre era un loader vacio en la pagina
 * de estadisticas publicas. La ruta de API se mantiene (mismo calculo) por
 * si algo cliente-side necesita refrescar sin recargar la pagina.
 */

interface RawNamedCountRow {
  name: string;
  count: bigint;
}

interface RawCompanyCountRow {
  id: number;
  name: string;
  count: bigint;
}

interface RawActorCountRow {
  id: number;
  name: string;
  count: bigint;
}

interface RawDirectorCountRow {
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

interface RawRatingDistRow {
  score: number;
  count: bigint;
}

interface RawDayCountRow {
  day: Date;
  count: bigint;
}

export interface RecentCommunityActivity {
  /** Ventana de "recientes" para los contadores cortos (dias). */
  shortWindowDays: number;
  /** Ventana larga: miembros activos y grafico diario (dias). */
  longWindowDays: number;
  /** Cuentas de la comunidad (sin ADMIN ni baneadas). */
  totalMembers: number;
  /** Cuentas que siguen su progreso (al menos una serie/episodio marcado). */
  trackingMembers: number;
  activeMembers: number;
  newMembers: number;
  /** Episodios marcados como vistos en la ventana corta. */
  episodesSeenRecently: number;
  /** Series terminadas en la ventana larga (en 7 dias casi siempre es 0). */
  completedRecently: number;
  publicCommentsRecently: number;
  ratingsRecently: number;
  watchingNow: Array<{ seriesId: number; title: string; count: number }>;
  /** Episodios vistos por dia: es donde esta la actividad real de la
   *  comunidad (se marcan muchos mas episodios que series terminadas). */
  episodesByDay: Array<{ day: string; count: number }>;
}

export interface PublicStats {
  community: CommunityMetrics;
  recent: RecentCommunityActivity;
  generatedAt: string;
  summary: {
    totalSeries: number;
    totalPublicComments: number;
    totalPublishedReviews: number;
    totalCompletedViews: number;
    totalCurrentlyWatching: number;
    totalFavorites: number;
    totalActors: number;
    totalDirectors: number;
    averageCommunityRating: number | null;
    totalUserRatings: number;
    /** Series del catalogo que vio el equipo. Va aparte: ver COMMUNITY. */
    teamCompletedSeries: number;
  };
  rankings: {
    topSeries: Array<{ seriesId: number; title: string; count: number }>;
    topFavorited: Array<{ seriesId: number; title: string; count: number }>;
    topActors: Array<{ actorId: number; name: string; count: number }>;
    topDirectors: Array<{ directorId: number; name: string; count: number }>;
    topProductionCompanies: Array<{
      id: number;
      name: string;
      count: number;
    }>;
    topCountries: Array<{ name: string; count: number }>;
    byType: Array<{ type: string; count: number }>;
  };
  catalog: {
    byCountry: Array<{ name: string; count: number }>;
    byType: Array<{ type: string; count: number }>;
    byGenre: Array<{ name: string; count: number }>;
    byYear: Array<{ year: number; count: number }>;
  };
  ratings: {
    averageCommunity: number | null;
    total: number;
    distribution: Array<{ score: number; count: number }>;
  };
}

/**
 * Toda metrica de actividad de esta pagina es SOLO de la comunidad: excluye
 * a los usuarios ADMIN. El catalogo curado nacio como el registro personal
 * de lo que fue viendo Flor, asi que al 2026-09-24 el equipo era el 96% de
 * las "series vistas" (527 de 548). Mostrar eso como actividad de la
 * comunidad es inflar, que es justo lo que la pagina promete no hacer. Lo
 * del equipo no se esconde: sale aparte, en `teamCompletedSeries`.
 *
 * Los comentarios de una cuenta borrada quedan con userId null
 * (anonimizados): son de la comunidad y se cuentan.
 */
const COMMUNITY = { user: { role: { not: 'ADMIN' as const } } };
const COMMUNITY_MEMBER = { banned: false, role: { not: 'ADMIN' as const } };
const COMMUNITY_COMMENTS = {
  OR: [{ userId: null }, { user: { role: { not: 'ADMIN' as const } } }],
};

const SHORT_WINDOW_DAYS = 7;
const LONG_WINDOW_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Actividad RECIENTE de la comunidad (mismas fuentes que /admin/stats, pero
 * solo agregados anonimos y sin cuentas ADMIN, igual que el resto de la
 * pagina). Sin esto /estadisticas solo mostraba totales historicos que casi
 * no se mueven de un dia a otro y parecia una pagina congelada, mientras
 * admin mostraba bien la actividad de la semana y del mes.
 */
async function getRecentCommunityActivity(
  now: Date
): Promise<RecentCommunityActivity> {
  const shortSince = new Date(now.getTime() - SHORT_WINDOW_DAYS * DAY_MS);
  const longSince = new Date(now.getTime() - LONG_WINDOW_DAYS * DAY_MS);

  const [
    totalMembers,
    trackingMembers,
    activeMembers,
    newMembers,
    episodesSeenRecently,
    completedRecently,
    publicCommentsRecently,
    ratingsRecently,
    watchingRows,
    episodesByDayRows,
  ] = await Promise.all([
    prisma.user.count({ where: COMMUNITY_MEMBER }),
    prisma.user.count({
      where: {
        ...COMMUNITY_MEMBER,
        viewStatuses: { some: { status: { not: 'SIN_VER' } } },
      },
    }),
    prisma.user.count({
      where: {
        AND: [
          getActiveCommunityUsersWhere(longSince),
          { role: { not: 'ADMIN' } },
        ],
      },
    }),
    prisma.user.count({
      where: { ...COMMUNITY_MEMBER, createdAt: { gte: longSince } },
    }),
    prisma.viewStatus.count({
      where: {
        status: 'VISTA',
        episodeId: { not: null },
        updatedAt: { gte: shortSince },
        ...COMMUNITY,
      },
    }),
    prisma.viewStatus.count({
      where: {
        status: 'VISTA',
        seriesId: { not: null },
        updatedAt: { gte: longSince },
        ...COMMUNITY,
      },
    }),
    prisma.comment.count({
      where: {
        isPrivate: false,
        createdAt: { gte: shortSince },
        ...COMMUNITY_COMMENTS,
      },
    }),
    prisma.userRating.count({
      where: { updatedAt: { gte: shortSince }, ...COMMUNITY },
    }),
    prisma.viewStatus.groupBy({
      by: ['seriesId'],
      where: {
        status: 'VIENDO',
        seriesId: { not: null },
        series: { origin: 'CURATED' },
        ...COMMUNITY,
      },
      _count: { seriesId: true },
      orderBy: { _count: { seriesId: 'desc' } },
      take: 10,
    }),
    prisma.$queryRaw<RawDayCountRow[]>`
      SELECT date_trunc('day', vs."updatedAt") AS day, COUNT(*) AS count
      FROM "ViewStatus" vs
      JOIN "User" u ON u.id = vs."userId"
      WHERE vs.status = 'VISTA'
        AND vs."episodeId" IS NOT NULL
        AND vs."updatedAt" >= ${longSince}
        AND u.role <> 'ADMIN'
      GROUP BY day
      ORDER BY day ASC
    `,
  ]);

  const watchingIds = watchingRows
    .map((r) => r.seriesId)
    .filter((id): id is number => id !== null);
  const titles = await prisma.series.findMany({
    where: { id: { in: watchingIds } },
    select: { id: true, title: true },
  });
  const titleById = new Map(titles.map((item) => [item.id, item.title]));

  // Dias sin actividad van en 0: un grafico con huecos sugiere datos rotos.
  const countByDay = new Map(
    episodesByDayRows.map((r) => [
      r.day.toISOString().slice(0, 10),
      Number(r.count),
    ])
  );
  const episodesByDay = Array.from({ length: LONG_WINDOW_DAYS }, (_, i) => {
    const day = new Date(now.getTime() - (LONG_WINDOW_DAYS - 1 - i) * DAY_MS)
      .toISOString()
      .slice(0, 10);
    return { day, count: countByDay.get(day) ?? 0 };
  });

  return {
    shortWindowDays: SHORT_WINDOW_DAYS,
    longWindowDays: LONG_WINDOW_DAYS,
    totalMembers,
    trackingMembers,
    activeMembers,
    newMembers,
    episodesSeenRecently,
    completedRecently,
    publicCommentsRecently,
    ratingsRecently,
    watchingNow: watchingRows
      .filter((row) => row.seriesId !== null)
      .map((row) => ({
        seriesId: row.seriesId as number,
        title: titleById.get(row.seriesId as number) ?? 'Sin titulo',
        count: row._count.seriesId,
      })),
    episodesByDay,
  };
}

export async function getPublicStats(): Promise<PublicStats> {
  const now = new Date();
  const [
    totalSeries,
    totalPublicComments,
    totalPublishedReviews,
    totalCompletedViews,
    totalCurrentlyWatching,
    totalFavorites,
    totalActors,
    totalDirectors,
    topSeriesRows,
    topActorsRows,
    topDirectorsRows,
    topProductionCompaniesRows,
    topCountriesRows,
    topTypesRows,
    topFavoritedRows,
    ratingDistRows,
    ratingStats,
    // Catalog fixed stats (series count, not view count)
    catalogByCountryRows,
    catalogByTypeRows,
    catalogByGenreRows,
    catalogByYearRows,
    teamSeriesRows,
  ] = await Promise.all([
    // Solo contamos series del catalogo curado (excluye USER_EMBED).
    prisma.series.count({ where: { origin: 'CURATED' } }),
    prisma.comment.count({
      where: { isPrivate: false, ...COMMUNITY_COMMENTS },
    }),
    prisma.review.count({
      where: {
        status: 'PUBLISHED',
        series: PUBLIC_REVIEW_SERIES,
        ...COMMUNITY,
      },
    }),
    prisma.viewStatus.count({
      where: {
        status: 'VISTA',
        seriesId: { not: null },
        series: { origin: 'CURATED' },
        ...COMMUNITY,
      },
    }),
    prisma.viewStatus.count({
      where: {
        status: 'VIENDO',
        seriesId: { not: null },
        series: { origin: 'CURATED' },
        ...COMMUNITY,
      },
    }),
    prisma.userFavorite.count({
      where: {
        series: { origin: 'CURATED' },
        ...COMMUNITY,
      },
    }),
    prisma.actor.count(),
    prisma.director.count(),
    prisma.viewStatus.groupBy({
      by: ['seriesId'],
      where: {
        status: 'VISTA',
        seriesId: { not: null },
        series: { origin: 'CURATED' },
        ...COMMUNITY,
      },
      _count: { seriesId: true },
      orderBy: { _count: { seriesId: 'desc' } },
      take: 15,
    }),
    prisma.$queryRaw<RawActorCountRow[]>`
      SELECT a.id, a.name, COUNT(*) as count
      FROM "ViewStatus" vs
      JOIN "User" u ON u.id = vs."userId"
      JOIN "SeriesActor" sa ON sa."seriesId" = vs."seriesId"
      JOIN "Actor" a ON a.id = sa."actorId"
      JOIN "Series" s ON s.id = vs."seriesId"
      WHERE vs.status = 'VISTA'
        AND vs."seriesId" IS NOT NULL
        AND s."origin" = 'CURATED'
        AND u.role <> 'ADMIN'
      GROUP BY a.id, a.name
      ORDER BY count DESC
      LIMIT 15
    `,
    prisma.$queryRaw<RawDirectorCountRow[]>`
      SELECT d.id, d.name, COUNT(*) as count
      FROM "ViewStatus" vs
      JOIN "User" u ON u.id = vs."userId"
      JOIN "SeriesDirector" sd ON sd."seriesId" = vs."seriesId"
      JOIN "Director" d ON d.id = sd."directorId"
      JOIN "Series" s ON s.id = vs."seriesId"
      WHERE vs.status = 'VISTA'
        AND vs."seriesId" IS NOT NULL
        AND s."origin" = 'CURATED'
        AND u.role <> 'ADMIN'
      GROUP BY d.id, d.name
      ORDER BY count DESC
      LIMIT 15
    `,
    // Cuenta por SeriesProductionCompany (co-producciones), no por la
    // relacion legacy 1-a-N: asi una serie con 3 productoras suma para las 3.
    // Devuelve el id para poder linkear a /productoras/[id].
    prisma.$queryRaw<RawCompanyCountRow[]>`
      SELECT pc.id, pc.name, COUNT(*) as count
      FROM "ViewStatus" vs
      JOIN "User" u ON u.id = vs."userId"
      JOIN "Series" s ON s.id = vs."seriesId"
      JOIN "SeriesProductionCompany" spc ON spc."seriesId" = s.id
      JOIN "ProductionCompany" pc ON pc.id = spc."productionCompanyId"
      WHERE vs.status = 'VISTA'
        AND vs."seriesId" IS NOT NULL
        AND s."origin" = 'CURATED'
        AND u.role <> 'ADMIN'
      GROUP BY pc.id, pc.name
      ORDER BY count DESC
      LIMIT 15
    `,
    prisma.$queryRaw<RawNamedCountRow[]>`
      SELECT c.name, COUNT(*) as count
      FROM "ViewStatus" vs
      JOIN "User" u ON u.id = vs."userId"
      JOIN "Series" s ON s.id = vs."seriesId"
      JOIN "Country" c ON c.id = s."countryId"
      WHERE vs.status = 'VISTA'
        AND vs."seriesId" IS NOT NULL
        AND s."countryId" IS NOT NULL
        AND s."origin" = 'CURATED'
        AND u.role <> 'ADMIN'
      GROUP BY c.name
      ORDER BY count DESC
    `,
    prisma.$queryRaw<RawTypeCountRow[]>`
      SELECT s.type, COUNT(*) as count
      FROM "ViewStatus" vs
      JOIN "User" u ON u.id = vs."userId"
      JOIN "Series" s ON s.id = vs."seriesId"
      WHERE vs.status = 'VISTA'
        AND vs."seriesId" IS NOT NULL
        AND s."origin" = 'CURATED'
        AND u.role <> 'ADMIN'
      GROUP BY s.type
      ORDER BY count DESC
    `,
    prisma.userFavorite.groupBy({
      by: ['seriesId'],
      where: {
        series: { origin: 'CURATED' },
        ...COMMUNITY,
      },
      _count: { seriesId: true },
      orderBy: { _count: { seriesId: 'desc' } },
      take: 15,
    }),
    prisma.$queryRaw<RawRatingDistRow[]>`
      SELECT score, COUNT(*) as count
      FROM "UserRating" ur
      JOIN "User" u ON u.id = ur."userId"
      JOIN "Series" s ON s.id = ur."seriesId"
      WHERE s."origin" = 'CURATED'
        AND u.role <> 'ADMIN'
      GROUP BY score
      ORDER BY score ASC
    `,
    prisma.userRating.aggregate({
      where: {
        series: { origin: 'CURATED' },
        ...COMMUNITY,
      },
      _avg: { score: true },
      _count: { id: true },
    }),
    // Catalog: series per country (solo CURATED)
    prisma.$queryRaw<RawNamedCountRow[]>`
      SELECT c.name, COUNT(*) as count
      FROM "Series" s
      JOIN "Country" c ON c.id = s."countryId"
      WHERE s."countryId" IS NOT NULL
        AND s."origin" = 'CURATED'
      GROUP BY c.name
      ORDER BY count DESC
    `,
    // Catalog: series per type (solo CURATED)
    prisma.$queryRaw<RawTypeCountRow[]>`
      SELECT type, COUNT(*) as count
      FROM "Series"
      WHERE "origin" = 'CURATED'
      GROUP BY type
      ORDER BY count DESC
    `,
    // Catalog: series per genre (solo CURATED)
    prisma.$queryRaw<RawNamedCountRow[]>`
      SELECT g.name, COUNT(*) as count
      FROM "SeriesGenre" sg
      JOIN "Genre" g ON g.id = sg."genreId"
      JOIN "Series" s ON s.id = sg."seriesId"
      WHERE s."origin" = 'CURATED'
      GROUP BY g.name
      ORDER BY count DESC
      LIMIT 20
    `,
    // Catalog: series per release year (solo CURATED)
    prisma.$queryRaw<RawYearCountRow[]>`
      SELECT year, COUNT(*) as count
      FROM "Series"
      WHERE year IS NOT NULL
        AND "origin" = 'CURATED'
      GROUP BY year
      ORDER BY year DESC
      LIMIT 20
    `,
    // Lo del equipo, aparte y a la vista (ver COMMUNITY).
    prisma.viewStatus.groupBy({
      by: ['seriesId'],
      where: {
        status: 'VISTA',
        seriesId: { not: null },
        series: { origin: 'CURATED' },
        user: { role: 'ADMIN' },
      },
    }),
  ]);

  const allSeriesIdsToFetch = Array.from(
    new Set([
      ...topSeriesRows
        .map((r) => r.seriesId)
        .filter((id): id is number => id !== null),
      ...topFavoritedRows.map((r) => r.seriesId),
    ])
  );

  const series = await prisma.series.findMany({
    where: { id: { in: allSeriesIdsToFetch } },
    select: { id: true, title: true },
  });

  const seriesById = new Map(series.map((item) => [item.id, item.title]));

  const [community, recent] = await Promise.all([
    getCommunityMetrics(),
    getRecentCommunityActivity(now),
  ]);

  return {
    generatedAt: now.toISOString(),
    community,
    recent,
    summary: {
      totalSeries,
      totalPublicComments,
      totalPublishedReviews,
      totalCompletedViews,
      totalCurrentlyWatching,
      totalFavorites,
      totalActors,
      totalDirectors,
      averageCommunityRating: ratingStats._avg.score
        ? Math.round(ratingStats._avg.score * 10) / 10
        : null,
      totalUserRatings: ratingStats._count.id,
      teamCompletedSeries: teamSeriesRows.length,
    },
    rankings: {
      topSeries: topSeriesRows
        .filter((row) => row.seriesId !== null)
        .map((row) => ({
          seriesId: row.seriesId as number,
          title: seriesById.get(row.seriesId as number) ?? 'Sin titulo',
          count: row._count.seriesId,
        })),
      topFavorited: topFavoritedRows.map((row) => ({
        seriesId: row.seriesId,
        title: seriesById.get(row.seriesId) ?? 'Sin titulo',
        count: row._count.seriesId,
      })),
      topActors: topActorsRows.map((row) => ({
        actorId: row.id,
        name: row.name,
        count: Number(row.count),
      })),
      topDirectors: topDirectorsRows.map((row) => ({
        directorId: row.id,
        name: row.name,
        count: Number(row.count),
      })),
      topProductionCompanies: topProductionCompaniesRows.map((row) => ({
        id: row.id,
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
    ratings: {
      averageCommunity: ratingStats._avg.score
        ? Math.round(ratingStats._avg.score * 10) / 10
        : null,
      total: ratingStats._count.id,
      distribution: ratingDistRows.map((r) => ({
        score: Number(r.score),
        count: Number(r.count),
      })),
    },
  };
}
