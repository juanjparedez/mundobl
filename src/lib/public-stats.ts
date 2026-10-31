// Build complete SQL objects before calling the shared client: Next bundles can
// contain different Sql constructors, so client tagged templates cannot flatten
// fragments created by another bundle. Prisma.sql here shares the fragment runtime.
import { Prisma } from '../generated/prisma';
import {
  COMMUNITY,
  COMMUNITY_COMMENTS,
  COMMUNITY_MEMBER,
  PUBLIC_STATS_SERIES,
  PUBLIC_CATALOG_SERIES,
  COMMUNITY_SQL,
  PUBLIC_SERIES_SQL,
  COMMUNITY_RATINGS_SQL,
  statsWindowStart,
} from './statistics-scope';
import { getCommunityChapterCompletions } from './community-chapter-statistics';
import {
  prisma,
  PUBLIC_REVIEW_SERIES,
  getCommunityMetrics,
  getActiveCommunityUsersWhere,
} from '@/lib/database';
import type { CommunityMetrics } from '@/types/community';
import { getMonthlyRanking, type RankingEntry } from '@/lib/community-ranking';
import {
  getSiteChapterActivity,
  getPublicWatchStats,
  type WatchSectionStats,
} from '@/lib/series-activity-stats';
import { getContentUrl } from '@/lib/slug';

export type { WatchSectionStats };

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

interface RawTopRatedRow {
  seriesId: number;
  avgScore: number;
  voterCount: bigint;
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
  reviewsRecently?: number;
  watchingNow: Array<{
    seriesId: number;
    title: string;
    href?: string;
    count: number;
  }>;
  /** Episodios vistos por dia: es donde esta la actividad real de la
   *  comunidad (se marcan muchos mas episodios que series terminadas). */
  episodesByDay: Array<{ day: string; count: number }>;
  /** Ranking anonimo de capitulos vistos en la ventana larga (community-ranking.ts). */
  topWatchers: RankingEntry[];
  /** Acciones de marcado sin cuenta en la ventana corta (SeriesActivityDaily).
   *  Opcional: una pagina o respuesta cacheada de antes no lo trae. */
  browserChaptersRecently?: number;
}

export interface PublicStats {
  community: CommunityMetrics;
  recent: RecentCommunityActivity;
  watch: WatchSectionStats;
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
    topSeries: Array<{
      seriesId: number;
      title: string;
      href?: string;
      count: number;
    }>;
    topFavorited: Array<{
      seriesId: number;
      title: string;
      href?: string;
      count: number;
    }>;
    topRated?: Array<{
      seriesId: number;
      title: string;
      href?: string;
      avgScore: number;
      voterCount: number;
    }>;
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
 * al equipo (ADMIN, MODERATOR, COLLABORATOR) y cuentas baneadas. El catalogo curado nacio como el registro personal
 * de lo que fue viendo Flor, asi que al 2026-09-24 el equipo era el 96% de
 * las "series vistas" (527 de 548). Mostrar eso como actividad de la
 * comunidad es inflar, que es justo lo que la pagina promete no hacer. Lo
 * del equipo no se esconde: sale aparte, en `teamCompletedSeries`.
 *
 * Los comentarios de una cuenta borrada quedan con userId null
 * (anonimizados): son de la comunidad y se cuentan.
 */

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
  const shortSince = statsWindowStart(SHORT_WINDOW_DAYS, now);
  const longSince = statsWindowStart(LONG_WINDOW_DAYS, now);
  const completionsPromise = getCommunityChapterCompletions(longSince, now);

  const [
    totalMembers,
    trackingMembers,
    activeMembers,
    newMembers,
    completedRecently,
    publicCommentsRecently,
    ratingsRecently,
    reviewsRecently,
    watchingRows,
    chapterCompletions,
    topWatchers,
    siteActivity,
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
        AND: [getActiveCommunityUsersWhere(longSince), COMMUNITY_MEMBER],
      },
    }),
    prisma.user.count({
      where: { ...COMMUNITY_MEMBER, createdAt: { gte: longSince } },
    }),
    prisma.viewStatus.count({
      where: {
        status: 'VISTA',
        seriesId: { not: null },
        series: PUBLIC_STATS_SERIES,
        OR: [
          { watchedDate: { gte: longSince, lte: now } },
          { watchedDate: null, updatedAt: { gte: longSince, lte: now } },
        ],
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
    prisma
      .$queryRaw<Array<{ count: bigint }>>(
        Prisma.sql`
      WITH votes AS (${COMMUNITY_RATINGS_SQL})
      SELECT COUNT(*) AS count FROM votes WHERE "updatedAt" >= ${shortSince} AND "updatedAt" <= ${now}
    `
      )
      .then((rows) => Number(rows[0].count)),
    prisma.review.count({
      where: {
        status: 'PUBLISHED',
        publishedAt: { gte: longSince, lte: now },
        series: PUBLIC_REVIEW_SERIES,
        ...COMMUNITY,
      },
    }),
    prisma.viewStatus.groupBy({
      by: ['seriesId'],
      where: {
        status: 'VIENDO',
        seriesId: { not: null },
        series: PUBLIC_STATS_SERIES,
        ...COMMUNITY,
      },
      _count: { seriesId: true },
      orderBy: [{ _count: { seriesId: 'desc' } }, { seriesId: 'asc' }],
      take: 10,
    }),
    completionsPromise,
    completionsPromise.then((rows) => getMonthlyRanking(now, rows)),
    getSiteChapterActivity(SHORT_WINDOW_DAYS, now),
  ]);

  const watchingIds = watchingRows
    .map((r) => r.seriesId)
    .filter((id): id is number => id !== null);
  const titles = await prisma.series.findMany({
    where: { id: { in: watchingIds } },
    select: { id: true, title: true, origin: true, catalogScope: true },
  });
  const seriesMetaById = new Map(titles.map((item) => [item.id, item]));

  // Dias sin actividad van en 0: un grafico con huecos sugiere datos rotos.
  const countByDay = new Map<string, number>();
  for (const { date } of chapterCompletions) {
    const day = date.toISOString().slice(0, 10);
    countByDay.set(day, (countByDay.get(day) ?? 0) + 1);
  }
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
    completedRecently,
    episodesSeenRecently: chapterCompletions.filter(
      ({ date }) => date >= shortSince
    ).length,
    publicCommentsRecently,
    ratingsRecently,
    reviewsRecently,
    watchingNow: watchingRows
      .filter((row) => row.seriesId !== null)
      .map((row) => {
        const meta = seriesMetaById.get(row.seriesId as number);
        return {
          seriesId: row.seriesId as number,
          title: meta?.title ?? 'Sin titulo',
          href: meta ? getContentUrl(meta) : undefined,
          count: row._count.seriesId,
        };
      }),
    episodesByDay,
    topWatchers,
    browserChaptersRecently: siteActivity.browser,
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
    topRatedRows,
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
    prisma.series.count({ where: PUBLIC_CATALOG_SERIES }),
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
        series: PUBLIC_STATS_SERIES,
        ...COMMUNITY,
      },
    }),
    prisma.viewStatus.count({
      where: {
        status: 'VIENDO',
        seriesId: { not: null },
        series: PUBLIC_STATS_SERIES,
        ...COMMUNITY,
      },
    }),
    prisma.userFavorite.count({
      where: {
        series: PUBLIC_STATS_SERIES,
        ...COMMUNITY,
      },
    }),
    prisma.actor.count({
      where: {
        isPlaceholder: false,
        OR: [
          { series: { some: { series: PUBLIC_CATALOG_SERIES } } },
          { seasons: { some: { season: { series: PUBLIC_CATALOG_SERIES } } } },
        ],
      },
    }),
    prisma.director.count({
      where: { series: { some: { series: PUBLIC_CATALOG_SERIES } } },
    }),
    prisma.viewStatus.groupBy({
      by: ['seriesId'],
      where: {
        status: 'VISTA',
        seriesId: { not: null },
        series: PUBLIC_STATS_SERIES,
        ...COMMUNITY,
      },
      _count: { seriesId: true },
      orderBy: [{ _count: { seriesId: 'desc' } }, { seriesId: 'asc' }],
      take: 15,
    }),
    prisma.$queryRaw<RawActorCountRow[]>(Prisma.sql`
      SELECT a.id, a.name, COUNT(*) as count
      FROM "ViewStatus" vs
      JOIN "User" u ON u.id = vs."userId"
      JOIN (
        SELECT "seriesId", "actorId" FROM "SeriesActor"
        UNION
        SELECT season."seriesId", sa."actorId" FROM "SeasonActor" sa
        JOIN "Season" season ON season.id = sa."seasonId"
      ) sa ON sa."seriesId" = vs."seriesId"
      JOIN "Actor" a ON a.id = sa."actorId"
      JOIN "Series" s ON s.id = vs."seriesId"
      WHERE vs.status = 'VISTA'
        AND vs."seriesId" IS NOT NULL
        AND ${PUBLIC_SERIES_SQL}
        AND ${COMMUNITY_SQL}
        AND a."isPlaceholder" = false
      GROUP BY a.id, a.name
      ORDER BY count DESC, name ASC
      LIMIT 15
    `),
    prisma.$queryRaw<RawDirectorCountRow[]>(Prisma.sql`
      SELECT d.id, d.name, COUNT(*) as count
      FROM "ViewStatus" vs
      JOIN "User" u ON u.id = vs."userId"
      JOIN "SeriesDirector" sd ON sd."seriesId" = vs."seriesId"
      JOIN "Director" d ON d.id = sd."directorId"
      JOIN "Series" s ON s.id = vs."seriesId"
      WHERE vs.status = 'VISTA'
        AND vs."seriesId" IS NOT NULL
        AND ${PUBLIC_SERIES_SQL}
        AND ${COMMUNITY_SQL}
      GROUP BY d.id, d.name
      ORDER BY count DESC, name ASC
      LIMIT 15
    `),
    // Cuenta por SeriesProductionCompany (co-producciones), no por la
    // relacion legacy 1-a-N: asi una serie con 3 productoras suma para las 3.
    // Devuelve el id para poder linkear a /productoras/[id].
    prisma.$queryRaw<RawCompanyCountRow[]>(Prisma.sql`
      SELECT pc.id, pc.name, COUNT(*) as count
      FROM "ViewStatus" vs
      JOIN "User" u ON u.id = vs."userId"
      JOIN "Series" s ON s.id = vs."seriesId"
      JOIN "SeriesProductionCompany" spc ON spc."seriesId" = s.id
      JOIN "ProductionCompany" pc ON pc.id = spc."productionCompanyId"
      WHERE vs.status = 'VISTA'
        AND vs."seriesId" IS NOT NULL
        AND ${PUBLIC_SERIES_SQL}
        AND ${COMMUNITY_SQL}
      GROUP BY pc.id, pc.name
      ORDER BY count DESC, name ASC
      LIMIT 15
    `),
    prisma.$queryRaw<RawNamedCountRow[]>(Prisma.sql`
      SELECT c.name, COUNT(*) as count
      FROM "ViewStatus" vs
      JOIN "User" u ON u.id = vs."userId"
      JOIN "Series" s ON s.id = vs."seriesId"
      JOIN "Country" c ON c.id = s."countryId"
      WHERE vs.status = 'VISTA'
        AND vs."seriesId" IS NOT NULL
        AND s."countryId" IS NOT NULL
        AND ${PUBLIC_SERIES_SQL}
        AND ${COMMUNITY_SQL}
      GROUP BY c.name
      ORDER BY count DESC
    `),
    prisma.$queryRaw<RawTypeCountRow[]>(Prisma.sql`
      SELECT s.type, COUNT(*) as count
      FROM "ViewStatus" vs
      JOIN "User" u ON u.id = vs."userId"
      JOIN "Series" s ON s.id = vs."seriesId"
      WHERE vs.status = 'VISTA'
        AND vs."seriesId" IS NOT NULL
        AND ${PUBLIC_SERIES_SQL}
        AND ${COMMUNITY_SQL}
      GROUP BY s.type
      ORDER BY count DESC
    `),
    prisma.userFavorite.groupBy({
      by: ['seriesId'],
      where: {
        series: PUBLIC_STATS_SERIES,
        ...COMMUNITY,
      },
      _count: { seriesId: true },
      orderBy: [{ _count: { seriesId: 'desc' } }, { seriesId: 'asc' }],
      take: 15,
    }),
    prisma.$queryRaw<RawTopRatedRow[]>(Prisma.sql`
      WITH votes AS (${COMMUNITY_RATINGS_SQL})
      SELECT "seriesId", ROUND(AVG(score)::numeric, 1)::float8 AS "avgScore", COUNT(*) AS "voterCount"
      FROM votes GROUP BY "seriesId"
      ORDER BY "avgScore" DESC, "voterCount" DESC, "seriesId" ASC LIMIT 15
    `),
    prisma.$queryRaw<RawRatingDistRow[]>(Prisma.sql`
      WITH votes AS (${COMMUNITY_RATINGS_SQL})
      SELECT ROUND(score)::int AS score, COUNT(*) AS count
      FROM votes GROUP BY ROUND(score) ORDER BY score ASC
    `),
    prisma.$queryRaw<
      Array<{ average: number | null; total: bigint }>
    >(Prisma.sql`
      WITH votes AS (${COMMUNITY_RATINGS_SQL})
      SELECT AVG(score)::float8 AS average, COUNT(*) AS total FROM votes
    `),
    // Catalog: series per country (solo CURATED)
    prisma.$queryRaw<RawNamedCountRow[]>(Prisma.sql`
      SELECT c.name, COUNT(*) as count
      FROM "Series" s
      JOIN "Country" c ON c.id = s."countryId"
      WHERE s."countryId" IS NOT NULL
        AND s.visibility = 'VISIBLE' AND s.origin = 'CURATED' AND s."catalogScope" = 'PERSONAL'
      GROUP BY c.name
      ORDER BY count DESC
    `),
    // Catalog: series per type (solo CURATED)
    prisma.$queryRaw<RawTypeCountRow[]>(Prisma.sql`
      SELECT type, COUNT(*) as count
      FROM "Series"
      WHERE visibility = 'VISIBLE' AND origin = 'CURATED' AND "catalogScope" = 'PERSONAL'
      GROUP BY type
      ORDER BY count DESC
    `),
    // Catalog: series per genre (solo CURATED)
    prisma.$queryRaw<RawNamedCountRow[]>(Prisma.sql`
      SELECT g.name, COUNT(*) as count
      FROM "SeriesGenre" sg
      JOIN "Genre" g ON g.id = sg."genreId"
      JOIN "Series" s ON s.id = sg."seriesId"
      WHERE s.visibility = 'VISIBLE' AND s.origin = 'CURATED' AND s."catalogScope" = 'PERSONAL'
      GROUP BY g.name
      ORDER BY count DESC
      LIMIT 20
    `),
    // Catalog: series per release year (solo CURATED)
    prisma.$queryRaw<RawYearCountRow[]>(Prisma.sql`
      SELECT year, COUNT(*) as count
      FROM "Series"
      WHERE year IS NOT NULL
        AND visibility = 'VISIBLE' AND origin = 'CURATED' AND "catalogScope" = 'PERSONAL'
      GROUP BY year
      ORDER BY year DESC
      LIMIT 20
    `),
    // Lo del equipo, aparte y a la vista (ver COMMUNITY).
    prisma.viewStatus.groupBy({
      by: ['seriesId'],
      where: {
        status: 'VISTA',
        seriesId: { not: null },
        series: PUBLIC_CATALOG_SERIES,
        user: {
          banned: false,
          role: { in: ['ADMIN', 'MODERATOR', 'COLLABORATOR'] },
        },
      },
    }),
  ]);

  const allSeriesIdsToFetch = Array.from(
    new Set([
      ...topSeriesRows
        .map((r) => r.seriesId)
        .filter((id): id is number => id !== null),
      ...topFavoritedRows.map((r) => r.seriesId),
      ...topRatedRows.map((r) => r.seriesId),
    ])
  );

  const series = await prisma.series.findMany({
    where: { id: { in: allSeriesIdsToFetch } },
    select: { id: true, title: true, origin: true, catalogScope: true },
  });

  const seriesById = new Map(series.map((item) => [item.id, item]));

  const [community, recent, watch] = await Promise.all([
    getCommunityMetrics(),
    getRecentCommunityActivity(now),
    getPublicWatchStats(LONG_WINDOW_DAYS, now),
  ]);

  return {
    generatedAt: now.toISOString(),
    community,
    recent,
    watch,
    summary: {
      totalSeries,
      totalPublicComments,
      totalPublishedReviews,
      totalCompletedViews,
      totalCurrentlyWatching,
      totalFavorites,
      totalActors,
      totalDirectors,
      averageCommunityRating: ratingStats[0].average
        ? Math.round(ratingStats[0].average * 10) / 10
        : null,
      totalUserRatings: Number(ratingStats[0].total),
      teamCompletedSeries: teamSeriesRows.length,
    },
    rankings: {
      topSeries: topSeriesRows
        .filter((row) => row.seriesId !== null)
        .map((row) => {
          const meta = seriesById.get(row.seriesId as number);
          return {
            seriesId: row.seriesId as number,
            title: meta?.title ?? 'Sin titulo',
            href: meta ? getContentUrl(meta) : undefined,
            count: row._count.seriesId,
          };
        }),
      topFavorited: topFavoritedRows.map((row) => {
        const meta = seriesById.get(row.seriesId);
        return {
          seriesId: row.seriesId,
          title: meta?.title ?? 'Sin titulo',
          href: meta ? getContentUrl(meta) : undefined,
          count: row._count.seriesId,
        };
      }),
      topRated: topRatedRows.map((row) => {
        const meta = seriesById.get(row.seriesId);
        return {
          seriesId: row.seriesId,
          title: meta?.title ?? 'Sin titulo',
          href: meta ? getContentUrl(meta) : undefined,
          avgScore: Number(row.avgScore),
          voterCount: Number(row.voterCount),
        };
      }),
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
      averageCommunity: ratingStats[0].average
        ? Math.round(ratingStats[0].average * 10) / 10
        : null,
      total: Number(ratingStats[0].total),
      distribution: ratingDistRows.map((r) => ({
        score: Number(r.score),
        count: Number(r.count),
      })),
    },
  };
}
