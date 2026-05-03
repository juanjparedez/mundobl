import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requireAuth } from '@/lib/auth-helpers';

// GET /api/user/profile — returns stats + recent activity for authenticated user
export async function GET() {
  try {
    const authResult = await requireAuth();
    if (!authResult.authorized) return authResult.response;

    const userId = authResult.userId;

    const [
      user,
      statusCounts,
      favoritesCount,
      ratingsCount,
      commentsCount,
      recentlyCompleted,
      currentlyWatching,
      favorites,
    ] = await Promise.all([
      // Basic user info
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, image: true, role: true, createdAt: true },
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
    ]);

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Build status map
    const statusMap: Record<string, number> = {};
    statusCounts.forEach((s) => { statusMap[s.status] = s._count.status; });

    // Compute next episode for VIENDO entries
    const watchingWithNext = currentlyWatching.map((item) => {
      let totalEpisodes = 0;
      let watchedEpisodes = 0;
      let nextEpisode: { seasonNumber: number; episodeNumber: number } | null = null;

      for (const season of item.series?.seasons ?? []) {
        for (const ep of season.episodes) {
          totalEpisodes++;
          if (ep.viewStatus?.[0]?.status === 'VISTA') {
            watchedEpisodes++;
          } else if (!nextEpisode) {
            nextEpisode = { seasonNumber: season.seasonNumber, episodeNumber: ep.episodeNumber };
          }
        }
      }

      const { seasons: _seasons, ...seriesWithoutSeasons } = item.series ?? { seasons: [] };
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
