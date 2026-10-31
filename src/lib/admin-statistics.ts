import { Prisma } from '@/generated/prisma';
import { prisma, getActiveCommunityUsersWhere } from '@/lib/database';
import {
  COMMUNITY,
  COMMUNITY_MEMBER,
  COMMUNITY_COMMENTS,
  PUBLIC_STATS_SERIES,
  PUBLIC_CATALOG_SERIES,
  COMMUNITY_SQL,
  PUBLIC_SERIES_SQL,
  COMMUNITY_RATINGS_SQL,
  statsWindowStart,
} from '@/lib/statistics-scope';

export async function getAdminStatistics(now: Date = new Date()) {
  const sevenDaysAgo = statsWindowStart(7, now);
  const thirtyDaysAgo = statsWindowStart(30, now);

  const [
    reviewStats,
    totalUsers,
    currentlyWatchingCount,
    completedThisWeek,
    commentsThisWeek,
    topWatching,
    topCompleted,
    topFavorited,
    topCommented,
    topRated,
    activeUsers,
    seriesByType,
    completedByDay,
  ] = await Promise.all([
    Promise.all([
      prisma.review.count({
        where: {
          status: 'PUBLISHED',
          series: PUBLIC_STATS_SERIES,
          ...COMMUNITY,
        },
      }),
      prisma.review.count({
        where: {
          status: 'PUBLISHED',
          series: PUBLIC_STATS_SERIES,
          ...COMMUNITY,
          publishedAt: { gte: sevenDaysAgo, lte: now },
        },
      }),
    ]).then(([total, recent]) => ({ total, recent })),
    // Total users (not banned)
    prisma.user.count({ where: COMMUNITY_MEMBER }),

    // Distinct series currently being watched
    prisma.viewStatus.groupBy({
      by: ['seriesId'],
      where: {
        status: 'VIENDO',
        seriesId: { not: null },
        series: PUBLIC_STATS_SERIES,
        ...COMMUNITY,
      },
      _count: { seriesId: true },
    }),

    // Series completed this week
    prisma.viewStatus.count({
      where: {
        status: 'VISTA',
        seriesId: { not: null },
        series: PUBLIC_STATS_SERIES,
        ...COMMUNITY,
        OR: [
          { watchedDate: { gte: sevenDaysAgo, lte: now } },
          { watchedDate: null, updatedAt: { gte: sevenDaysAgo, lte: now } },
        ],
      },
    }),

    // Comments this week
    prisma.comment.count({
      where: {
        isPrivate: false,
        ...COMMUNITY_COMMENTS,
        createdAt: { gte: sevenDaysAgo, lte: now },
      },
    }),

    // Top 10 series currently being watched
    prisma.viewStatus.groupBy({
      by: ['seriesId'],
      where: {
        status: 'VIENDO',
        seriesId: { not: null },
        series: PUBLIC_STATS_SERIES,
        ...COMMUNITY,
      },
      _count: { seriesId: true },
      orderBy: { _count: { seriesId: 'desc' } },
      take: 10,
    }),

    // Top 10 series most completed
    prisma.viewStatus.groupBy({
      by: ['seriesId'],
      where: {
        status: 'VISTA',
        seriesId: { not: null },
        series: PUBLIC_STATS_SERIES,
        ...COMMUNITY,
      },
      _count: { seriesId: true },
      orderBy: { _count: { seriesId: 'desc' } },
      take: 10,
    }),

    // Top 10 most favorited
    prisma.userFavorite.groupBy({
      by: ['seriesId'],
      where: { series: PUBLIC_STATS_SERIES, ...COMMUNITY },
      _count: { seriesId: true },
      orderBy: { _count: { seriesId: 'desc' } },
      take: 10,
    }),

    // Top 10 most commented (series only)
    prisma.comment.groupBy({
      by: ['seriesId'],
      where: {
        seriesId: { not: null },
        isPrivate: false,
        ...COMMUNITY_COMMENTS,
      },
      _count: { seriesId: true },
      orderBy: { _count: { seriesId: 'desc' } },
      take: 10,
    }),

    // Top 10 best rated by users (avg score)
    prisma.$queryRaw<
      Array<{ seriesId: number; avgScore: number; count: bigint }>
    >(Prisma.sql`
        WITH votes AS (${COMMUNITY_RATINGS_SQL})
        SELECT "seriesId", ROUND(AVG(score)::numeric, 1)::float8 AS "avgScore", COUNT(*) AS count
        FROM votes GROUP BY "seriesId" HAVING COUNT(*) >= 2
        ORDER BY "avgScore" DESC, count DESC, "seriesId" ASC LIMIT 10
      `),

    // Active users (at least one activity in last 30 days)
    prisma.user.findMany({
      where: {
        AND: [getActiveCommunityUsersWhere(thirtyDaysAgo), COMMUNITY_MEMBER],
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        _count: {
          select: {
            viewStatuses: {
              where: {
                status: 'VISTA',
                seriesId: { not: null },
                series: PUBLIC_STATS_SERIES,
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
      take: 20,
    }),

    // Distribucion de series por tipo (en el catalogo entero).
    prisma.series.groupBy({
      by: ['type'],
      where: PUBLIC_CATALOG_SERIES,
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    }),

    prisma.$queryRaw<Array<{ day: Date; count: bigint }>>(Prisma.sql`
        SELECT date_trunc('day', COALESCE(vs."watchedDate", vs."updatedAt")) AS day, COUNT(*) AS count
        FROM "ViewStatus" vs JOIN "User" u ON u.id = vs."userId"
        JOIN "Series" s ON s.id = vs."seriesId"
        WHERE vs.status = 'VISTA' AND ${COMMUNITY_SQL} AND ${PUBLIC_SERIES_SQL}
          AND COALESCE(vs."watchedDate", vs."updatedAt") >= ${thirtyDaysAgo}
          AND COALESCE(vs."watchedDate", vs."updatedAt") <= ${now}
        GROUP BY day ORDER BY day ASC
      `),
  ]);

  // Resolve series titles for each ranking
  const allSeriesIds = new Set<number>();
  [
    ...topWatching,
    ...topCompleted,
    ...topFavorited,
    ...topCommented,
    ...topRated,
  ].forEach((row) => {
    if (row.seriesId) allSeriesIds.add(row.seriesId);
  });

  const seriesTitles = await prisma.series.findMany({
    where: { id: { in: Array.from(allSeriesIds) } },
    select: { id: true, title: true, imageUrl: true },
  });
  const titlesMap = new Map(
    seriesTitles.map((s) => [s.id, { title: s.title, imageUrl: s.imageUrl }])
  );

  const resolveRanking = (
    rows: { seriesId: number | null; _count: { seriesId: number } }[]
  ) =>
    rows
      .filter((r) => r.seriesId !== null)
      .map((r) => ({
        seriesId: r.seriesId!,
        title: titlesMap.get(r.seriesId!)?.title ?? '(sin título)',
        imageUrl: titlesMap.get(r.seriesId!)?.imageUrl ?? null,
        count: r._count.seriesId,
      }));

  return {
    generatedAt: now.toISOString(),
    summary: {
      totalPublishedReviews: reviewStats.total,
      reviewsThisWeek: reviewStats.recent,
      totalUsers,
      currentlyWatchingDistinct: currentlyWatchingCount.length,
      completedThisWeek,
      commentsThisWeek,
    },
    rankings: {
      watching: resolveRanking(topWatching),
      completed: resolveRanking(topCompleted),
      favorited: resolveRanking(topFavorited),
      commented: resolveRanking(topCommented),
      rated: topRated
        .filter((r) => r.seriesId !== null)
        .map((r) => ({
          seriesId: r.seriesId!,
          title: titlesMap.get(r.seriesId!)?.title ?? '(sin título)',
          imageUrl: titlesMap.get(r.seriesId!)?.imageUrl ?? null,
          avgScore: r.avgScore,
          count: Number(r.count),
        })),
    },
    activeUsers,
    distribution: {
      byType: seriesByType.map((row) => ({
        type: row.type,
        count: row._count.id,
      })),
      completedByDay: Array.from({ length: 30 }, (_, index) => {
        const day = new Date(thirtyDaysAgo.getTime() + index * 86400000)
          .toISOString()
          .slice(0, 10);
        return {
          day,
          count: Number(
            completedByDay.find(
              (row) => row.day.toISOString().slice(0, 10) === day
            )?.count ?? 0
          ),
        };
      }),
    },
  };
}
