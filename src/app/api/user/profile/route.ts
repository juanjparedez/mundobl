import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requireAuth } from '@/lib/auth-helpers';

interface RawCountRow {
  name: string;
  count: bigint;
}

interface RawCountryRow {
  name: string;
  code: string | null;
  count: bigint;
}

interface RawYearRow {
  year: number | null;
  count: bigint;
}

interface RawMinutesRow {
  total_minutes: bigint | null;
}

interface RawDayRow {
  day: Date;
}

interface RawAvgRatingRow {
  avg_rating: string | null;
}

interface RawTopRatedRow {
  series_id: number;
  title: string;
  rating: number;
  image_url: string | null;
}

interface RawTypeRow {
  type: string;
  count: bigint;
}

interface RawEpisodeCountRow {
  total: bigint;
}

// GET /api/user/profile — returns stats + recent activity for authenticated user
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (!authResult.authorized) return authResult.response;

    const userId = authResult.userId;
    const topNParam = parseInt(
      request.nextUrl.searchParams.get('topN') || '5',
      10
    );
    const topN = Math.min(
      Math.max(Number.isNaN(topNParam) ? 5 : topNParam, 1),
      200
    );

    const [
      user,
      statusCounts,
      favoritesCount,
      ratingsCount,
      commentsCount,
      recentlyCompleted,
      currentlyWatching,
      favorites,
      hoursResult,
      weeklyActivity,
      topGenresRaw,
      topCountriesRaw,
      topActorsRaw,
      topProductionCompaniesRaw,
      completedByYearRaw,
      avgRatingRaw,
      topRatedSeriesRaw,
      byTypeRaw,
      totalEpisodesRaw,
      heatmapRaw,
    ] = await Promise.all([
      // Basic user info
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          createdAt: true,
        },
      }),

      // Count by WatchStatus
      prisma.viewStatus.groupBy({
        by: ['status'],
        where: { userId, seriesId: { not: null } },
        _count: { status: true },
      }),

      // Total favorites
      prisma.userFavorite.count({ where: { userId } }),

      // Total ratings given
      prisma.userRating.count({ where: { userId } }),

      // Total comments
      prisma.comment.count({ where: { userId } }),

      // Last 8 series marked VISTA, most recent first
      prisma.viewStatus.findMany({
        where: { userId, status: 'VISTA', seriesId: { not: null } },
        orderBy: { updatedAt: 'desc' },
        take: 8,
        include: {
          series: {
            select: {
              id: true,
              title: true,
              imageUrl: true,
              year: true,
              type: true,
              country: { select: { name: true } },
            },
          },
        },
      }),

      // Current VIENDO series
      prisma.viewStatus.findMany({
        where: { userId, status: 'VIENDO', seriesId: { not: null } },
        orderBy: { lastWatchedAt: 'desc' },
        include: {
          series: {
            select: {
              id: true,
              title: true,
              imageUrl: true,
              year: true,
              type: true,
              country: { select: { name: true } },
              seasons: {
                include: {
                  episodes: {
                    include: { viewStatus: { where: { userId } } },
                    orderBy: { episodeNumber: 'asc' },
                  },
                },
                orderBy: { seasonNumber: 'asc' },
              },
            },
          },
        },
      }),

      // Last 8 favorites with series info
      prisma.userFavorite.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 8,
        include: {
          series: {
            select: {
              id: true,
              title: true,
              imageUrl: true,
              year: true,
              type: true,
              country: { select: { name: true } },
            },
          },
        },
      }),

      // Total minutes watched (sum episode durations for watched episodes)
      prisma.$queryRaw<RawMinutesRow[]>`
        SELECT COALESCE(SUM(e.duration), 0) as total_minutes
        FROM "ViewStatus" vs
        JOIN "Episode" e ON vs."episodeId" = e.id
        WHERE vs."userId" = ${userId}
          AND vs.status = 'VISTA'
          AND e.duration IS NOT NULL
      `,

      // Distinct days with episode watches in the last 7 days
      prisma.$queryRaw<RawDayRow[]>`
        SELECT DISTINCT DATE(vs."updatedAt") as day
        FROM "ViewStatus" vs
        WHERE vs."userId" = ${userId}
          AND vs.status = 'VISTA'
          AND vs."episodeId" IS NOT NULL
          AND vs."updatedAt" >= NOW() - INTERVAL '7 days'
        ORDER BY day
      `,

      // Top genres from watched series
      prisma.$queryRaw<RawCountRow[]>`
        SELECT g.name, COUNT(*) as count
        FROM "ViewStatus" vs
        JOIN "Series" s ON vs."seriesId" = s.id
        JOIN "SeriesGenre" sg ON sg."seriesId" = s.id
        JOIN "Genre" g ON sg."genreId" = g.id
        WHERE vs."userId" = ${userId}
          AND vs.status = 'VISTA'
          AND vs."seriesId" IS NOT NULL
        GROUP BY g.name
        ORDER BY count DESC
      `,

      // Top countries from watched series
      prisma.$queryRaw<RawCountryRow[]>`
        SELECT c.name, c.code, COUNT(*) as count
        FROM "ViewStatus" vs
        JOIN "Series" s ON vs."seriesId" = s.id
        JOIN "Country" c ON s."countryId" = c.id
        WHERE vs."userId" = ${userId}
          AND vs.status = 'VISTA'
          AND vs."seriesId" IS NOT NULL
        GROUP BY c.name, c.code
        ORDER BY count DESC
      `,

      // Top actors from watched series
      prisma.$queryRaw<RawCountRow[]>`
        SELECT a.name, COUNT(*) as count
        FROM "ViewStatus" vs
        JOIN "SeriesActor" sa ON sa."seriesId" = vs."seriesId"
        JOIN "Actor" a ON a.id = sa."actorId"
        WHERE vs."userId" = ${userId}
          AND vs.status = 'VISTA'
          AND vs."seriesId" IS NOT NULL
        GROUP BY a.name
        ORDER BY count DESC
      `,

      // Top production companies from watched series
      prisma.$queryRaw<RawCountRow[]>`
        SELECT pc.name, COUNT(*) as count
        FROM "ViewStatus" vs
        JOIN "Series" s ON s.id = vs."seriesId"
        JOIN "ProductionCompany" pc ON pc.id = s."productionCompanyId"
        WHERE vs."userId" = ${userId}
          AND vs.status = 'VISTA'
          AND vs."seriesId" IS NOT NULL
          AND s."productionCompanyId" IS NOT NULL
        GROUP BY pc.name
        ORDER BY count DESC
      `,

      // Series completed per year
      prisma.$queryRaw<RawYearRow[]>`
        SELECT s.year, COUNT(*) as count
        FROM "ViewStatus" vs
        JOIN "Series" s ON vs."seriesId" = s.id
        WHERE vs."userId" = ${userId}
          AND vs.status = 'VISTA'
          AND vs."seriesId" IS NOT NULL
          AND s.year IS NOT NULL
        GROUP BY s.year
        ORDER BY s.year DESC
        LIMIT 10
      `,

      // Average rating given by user
      prisma.$queryRaw<RawAvgRatingRow[]>`
        SELECT AVG(rating)::text as avg_rating
        FROM "UserRating"
        WHERE "userId" = ${userId}
      `,

      // Top-rated series (highest rating given by user)
      prisma.$queryRaw<RawTopRatedRow[]>`
        SELECT s.id as series_id, s.title, ur.rating, s."imageUrl" as image_url
        FROM "UserRating" ur
        JOIN "Series" s ON s.id = ur."seriesId"
        WHERE ur."userId" = ${userId}
        ORDER BY ur.rating DESC, s.title ASC
        LIMIT 5
      `,

      // Series count by type (watched)
      prisma.$queryRaw<RawTypeRow[]>`
        SELECT s.type, COUNT(*) as count
        FROM "ViewStatus" vs
        JOIN "Series" s ON vs."seriesId" = s.id
        WHERE vs."userId" = ${userId}
          AND vs.status = 'VISTA'
          AND vs."seriesId" IS NOT NULL
        GROUP BY s.type
        ORDER BY count DESC
      `,

      // Total episodes watched
      prisma.$queryRaw<RawEpisodeCountRow[]>`
        SELECT COUNT(*) as total
        FROM "ViewStatus"
        WHERE "userId" = ${userId}
          AND status = 'VISTA'
          AND "episodeId" IS NOT NULL
      `,

      // Daily activity last 84 days (12 weeks) for heatmap
      prisma.$queryRaw<RawDayRow[]>`
        SELECT DISTINCT DATE(vs."updatedAt") as day
        FROM "ViewStatus" vs
        WHERE vs."userId" = ${userId}
          AND vs.status = 'VISTA'
          AND vs."episodeId" IS NOT NULL
          AND vs."updatedAt" >= NOW() - INTERVAL '84 days'
        ORDER BY day
      `,
    ]);

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Build status map
    const statusMap: Record<string, number> = {};
    statusCounts.forEach((s) => {
      statusMap[s.status] = s._count.status;
    });

    // Compute longest streak from heatmap data
    const heatmapDates = heatmapRaw.map((r) =>
      new Date(r.day).toISOString().slice(0, 10)
    );
    const heatmapSet = new Set(heatmapDates);

    let longestStreak = 0;
    let currentStreak = 0;
    let streakCheck = new Date();
    streakCheck.setHours(0, 0, 0, 0);
    for (let i = 0; i < 84; i++) {
      const key = streakCheck.toISOString().slice(0, 10);
      if (heatmapSet.has(key)) {
        currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
      streakCheck = new Date(streakCheck.getTime() - 86400000);
    }

    // Compute next episode for VIENDO entries
    const watchingWithNext = currentlyWatching.map((item) => {
      let totalEpisodes = 0;
      let watchedEpisodes = 0;
      let nextEpisode: { seasonNumber: number; episodeNumber: number } | null =
        null;

      for (const season of item.series?.seasons ?? []) {
        for (const ep of season.episodes) {
          totalEpisodes++;
          if (ep.viewStatus?.[0]?.status === 'VISTA') {
            watchedEpisodes++;
          } else if (!nextEpisode) {
            nextEpisode = {
              seasonNumber: season.seasonNumber,
              episodeNumber: ep.episodeNumber,
            };
          }
        }
      }

      const { seasons: _seasons, ...seriesWithoutSeasons } = item.series ?? {
        seasons: [],
      };
      void _seasons;

      return {
        seriesId: item.seriesId,
        lastWatchedAt: item.lastWatchedAt,
        series: seriesWithoutSeasons,
        progress: { totalEpisodes, watchedEpisodes },
        nextEpisode,
      };
    });

    return NextResponse.json({
      user,
      stats: {
        watched: statusMap['VISTA'] ?? 0,
        watching: statusMap['VIENDO'] ?? 0,
        abandoned: statusMap['ABANDONADA'] ?? 0,
        toRewatch: statusMap['RETOMAR'] ?? 0,
        favorites: favoritesCount,
        ratings: ratingsCount,
        comments: commentsCount,
        hoursWatched:
          Math.round((Number(hoursResult[0]?.total_minutes ?? 0) / 60) * 10) /
          10,
        activeDaysThisWeek: weeklyActivity.length,
        topGenres: topGenresRaw.slice(0, topN).map((g) => ({
          name: g.name,
          count: Number(g.count),
        })),
        topCountries: topCountriesRaw.slice(0, topN).map((c) => ({
          name: c.name,
          code: c.code,
          count: Number(c.count),
        })),
        topActors: topActorsRaw.slice(0, topN).map((actor) => ({
          name: actor.name,
          count: Number(actor.count),
        })),
        topProductionCompanies: topProductionCompaniesRaw
          .slice(0, topN)
          .map((company) => ({
            name: company.name,
            count: Number(company.count),
          })),
        completedByYear: completedByYearRaw.map((y) => ({
          year: y.year,
          count: Number(y.count),
        })),
        avgRating:
          avgRatingRaw[0]?.avg_rating != null
            ? Math.round(parseFloat(avgRatingRaw[0].avg_rating) * 10) / 10
            : null,
        topRatedSeries: topRatedSeriesRaw.map((r) => ({
          seriesId: r.series_id,
          title: r.title,
          rating: r.rating,
          imageUrl: r.image_url,
        })),
        byType: byTypeRaw.map((r) => ({
          type: r.type,
          count: Number(r.count),
        })),
        totalEpisodes: Number(totalEpisodesRaw[0]?.total ?? 0),
        longestStreak,
        heatmap: heatmapDates,
      },
      recentlyCompleted: recentlyCompleted.map((r) => ({
        seriesId: r.seriesId,
        completedAt: r.updatedAt,
        series: r.series,
      })),
      currentlyWatching: watchingWithNext,
      favorites: favorites.map((f) => ({
        seriesId: f.seriesId,
        series: f.series,
      })),
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Error al obtener el perfil' },
      { status: 500 }
    );
  }
}
