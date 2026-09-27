import { completedInCurrentYear } from '@/lib/tracking-statistics';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requireAuth } from '@/lib/auth-helpers';
import { findNextEpisode } from '@/lib/episode-progress';
import {
  groupIntoChapters,
  countWatchedChapters,
} from '@/lib/episode-chapters';

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
  total_minutes: number | string | null;
  unknown_durations: bigint;
}

interface RawDayRow {
  day: Date;
}

interface RawAvgRatingRow {
  avg_rating: string | null;
}

interface RawTopRatedRow {
  series_id: number;
  origin: string;
  catalog_scope: string;
  title: string;
  avg_score: number;
  image_url: string | null;
  image_thumb_url: string | null;
}

interface RawTypeRow {
  type: string;
  count: bigint;
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
      seriesWithWatchedEpisodes,
      heatmapRaw,
      reviewsCount,
      recentReviews,
      approvedGlossaryTermsCount,
    ] = await Promise.all([
      // Basic user info
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          nickname: true,
          email: true,
          image: true,
          role: true,
          createdAt: true,
          socials: true,
          glossaryQuizBestScore: true,
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

      // Total distinct series rated by user
      prisma.userRating
        .groupBy({
          by: ['seriesId'],
          where: { userId },
        })
        .then((rows) => rows.length),

      // Total comments
      prisma.comment.count({ where: { userId } }),

      // Complete watched list; the dashboard previews it and paginates the modal.
      prisma.viewStatus.findMany({
        where: { userId, status: 'VISTA', seriesId: { not: null } },
        orderBy: [
          { watchedDate: { sort: 'desc', nulls: 'last' } },
          { id: 'desc' },
        ],
        include: {
          series: {
            select: {
              id: true,
              title: true,
              origin: true,
              catalogScope: true,
              imageUrl: true,
              imageThumbUrl: true,
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
              origin: true,
              catalogScope: true,
              imageUrl: true,
              imageThumbUrl: true,
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
              origin: true,
              catalogScope: true,
              imageUrl: true,
              imageThumbUrl: true,
              year: true,
              type: true,
              country: { select: { name: true } },
            },
          },
        },
      }),

      // Total minutes watched (sum episode durations for watched episodes)
      prisma.$queryRaw<RawMinutesRow[]>`
        SELECT COALESCE(SUM(CASE
          WHEN e."durationSeconds" > 0 THEN e."durationSeconds" / 60.0
          WHEN e.duration > 0 THEN e.duration
          ELSE 0 END), 0) as total_minutes,
          COUNT(*) FILTER (WHERE COALESCE(e."durationSeconds", 0) <= 0
            AND COALESCE(e.duration, 0) <= 0) as unknown_durations
        FROM "ViewStatus" vs
        JOIN "Episode" e ON vs."episodeId" = e.id
        WHERE vs."userId" = ${userId}
          AND vs.status = 'VISTA'
      `,

      // Distinct days with episode watches in the last 7 days
      prisma.$queryRaw<RawDayRow[]>`
        SELECT DISTINCT DATE(vs."watchedDate") as day
        FROM "ViewStatus" vs
        WHERE vs."userId" = ${userId}
          AND vs.status = 'VISTA'
          AND vs."episodeId" IS NOT NULL
          AND vs."watchedDate" <= NOW()
          AND vs."watchedDate" >= NOW() - INTERVAL '7 days'
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
        SELECT EXTRACT(YEAR FROM vs."watchedDate")::integer AS year, COUNT(*) as count
        FROM "ViewStatus" vs
        WHERE vs."userId" = ${userId}
          AND vs.status = 'VISTA'
          AND vs."seriesId" IS NOT NULL
          AND vs."watchedDate" IS NOT NULL
          AND vs."watchedDate" <= NOW()
        GROUP BY EXTRACT(YEAR FROM vs."watchedDate")
        ORDER BY year DESC
        LIMIT 10
      `,

      // Average rating given by user (across all scores)
      prisma.$queryRaw<RawAvgRatingRow[]>`
        SELECT AVG(score)::text as avg_rating
        FROM "UserRating"
        WHERE "userId" = ${userId}
      `,

      // Top-rated series (average score across categories given by user)
      // LIMIT parametrizado por topN (antes era 5 fijo, independiente del
      // resto de los "top N" — el widget nunca podia mostrar mas de 5 sin
      // importar cuanto pidiera el caller).
      prisma.$queryRaw<RawTopRatedRow[]>`
        SELECT s.id as series_id, s.title, s.origin, s."catalogScope" as catalog_scope, AVG(ur.score) as avg_score,
               s."imageUrl" as image_url, s."imageThumbUrl" as image_thumb_url
        FROM "UserRating" ur
        JOIN "Series" s ON s.id = ur."seriesId"
        WHERE ur."userId" = ${userId}
        GROUP BY s.id, s.title, s."imageUrl", s."imageThumbUrl"
        ORDER BY avg_score DESC, s.title ASC
        LIMIT ${topN}
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

      // Load every part of each tracked series, including unwatched siblings.
      // Filtering individual rows to VISTA would make partial chapters complete.
      prisma.series.findMany({
        where: {
          seasons: {
            some: {
              episodes: {
                some: {
                  viewStatus: { some: { userId, status: 'VISTA' } },
                },
              },
            },
          },
        },
        select: {
          seasons: {
            select: {
              seasonNumber: true,
              episodes: {
                select: {
                  id: true,
                  episodeNumber: true,
                  title: true,
                  viewStatus: { where: { userId }, select: { status: true } },
                },
              },
            },
          },
        },
      }),

      // Cover all 26 weeks displayed by HeatmapWidget.
      prisma.$queryRaw<RawDayRow[]>`
        SELECT DISTINCT DATE(vs."watchedDate") as day
        FROM "ViewStatus" vs
        WHERE vs."userId" = ${userId}
          AND vs.status = 'VISTA'
          AND vs."episodeId" IS NOT NULL
          AND vs."watchedDate" <= NOW()
          AND vs."watchedDate" >= NOW() - INTERVAL '182 days'
        ORDER BY day
      `,

      // Total de reseñas del usuario (cualquier estado)
      prisma.review.count({ where: { userId } }),

      // Ultimas 12 reseñas para mostrar en el perfil
      prisma.review.findMany({
        where: { userId },
        orderBy: [{ updatedAt: 'desc' }],
        take: 12,
        select: {
          id: true,
          title: true,
          body: true,
          verdict: true,
          language: true,
          status: true,
          isFeatured: true,
          helpfulCount: true,
          unhelpfulCount: true,
          hasSpoilers: true,
          publishedAt: true,
          updatedAt: true,
          series: {
            select: {
              id: true,
              title: true,
              origin: true,
              catalogScope: true,
              imageUrl: true,
              imageThumbUrl: true,
              year: true,
            },
          },
        },
      }),

      // Contribuciones al Glosario Cultural aprobadas — alimenta el logro
      // "colaborador cultural" (ver perfil/overview/sections/Achievements.tsx)
      prisma.glossarySuggestion.count({
        where: { userId, status: 'APPROVED' },
      }),
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
    streakCheck.setUTCHours(0, 0, 0, 0);
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

    // Progreso y siguiente de cada serie en VIENDO, por capitulos (ver
    // groupIntoChapters): lo mismo que muestran la ficha y /watching.
    const watchingWithNext = currentlyWatching.map((item) => {
      const { chapters } = groupIntoChapters(
        (item.series?.seasons ?? []).flatMap((season) =>
          season.episodes.map((ep) => ({
            id: ep.id,
            seasonNumber: season.seasonNumber,
            episodeNumber: ep.episodeNumber,
            title: ep.title,
            watched: ep.viewStatus?.[0]?.status === 'VISTA',
          }))
        )
      );
      const isWatched = (chapter: (typeof chapters)[number]) =>
        chapter.episodes.every((ep) => ep.watched);
      const totalEpisodes = chapters.length;
      const watchedEpisodes = chapters.filter(isWatched).length;
      const next = findNextEpisode(chapters, isWatched);
      const nextEpisode = next
        ? { seasonNumber: next.seasonNumber, episodeNumber: next.number }
        : null;

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
        ...completedInCurrentYear(recentlyCompleted),
        watched: statusMap['VISTA'] ?? 0,
        watching: statusMap['VIENDO'] ?? 0,
        abandoned: statusMap['ABANDONADA'] ?? 0,
        toRewatch: statusMap['RETOMAR'] ?? 0,
        favorites: favoritesCount,
        ratings: ratingsCount,
        comments: commentsCount,
        unknownDurationVideos: Number(hoursResult[0]?.unknown_durations ?? 0),
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
        reviews: reviewsCount,
        topRatedSeries: topRatedSeriesRaw.map((r) => ({
          seriesId: r.series_id,
          origin: r.origin,
          catalogScope: r.catalog_scope,
          title: r.title,
          rating: Math.round(Number(r.avg_score) * 10) / 10,
          imageUrl: r.image_url,
          imageThumbUrl: r.image_thumb_url,
        })),
        byType: byTypeRaw.map((r) => ({
          type: r.type,
          count: Number(r.count),
        })),
        totalEpisodes: seriesWithWatchedEpisodes.reduce(
          (total, series) =>
            total +
            countWatchedChapters(
              series.seasons.flatMap((season) =>
                season.episodes.map((episode) => ({
                  id: episode.id,
                  episodeNumber: episode.episodeNumber,
                  title: episode.title,
                  seasonNumber: season.seasonNumber,
                  watched: episode.viewStatus.some(
                    (status) => status.status === 'VISTA'
                  ),
                }))
              )
            ),
          0
        ),
        longestStreak,
        heatmap: heatmapDates,
        approvedGlossaryTerms: approvedGlossaryTermsCount,
        glossaryQuizBestScore: user?.glossaryQuizBestScore ?? null,
      },
      recentlyCompleted: recentlyCompleted.map((r) => ({
        seriesId: r.seriesId,
        completedAt: r.watchedDate,
        series: r.series,
      })),
      currentlyWatching: watchingWithNext,
      favorites: favorites.map((f) => ({
        seriesId: f.seriesId,
        series: f.series,
      })),
      recentReviews: recentReviews.map((r) => ({
        id: r.id,
        title: r.title,
        body: r.body,
        verdict: r.verdict,
        language: r.language,
        status: r.status,
        isFeatured: r.isFeatured,
        helpfulCount: r.helpfulCount,
        unhelpfulCount: r.unhelpfulCount,
        hasSpoilers: r.hasSpoilers,
        publishedAt: r.publishedAt,
        updatedAt: r.updatedAt,
        series: r.series,
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
