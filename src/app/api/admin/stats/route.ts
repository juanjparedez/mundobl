import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requireRole } from '@/lib/auth-helpers';

// GET /api/admin/stats — admin only
export async function GET() {
  try {
    const authResult = await requireRole(['ADMIN', 'MODERATOR']);
    if (!authResult.authorized) return authResult.response;

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
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
    ] = await Promise.all([
      // Total users (not banned)
      prisma.user.count({ where: { banned: false } }),

      // Distinct series currently being watched
      prisma.viewStatus.groupBy({
        by: ['seriesId'],
        where: { status: 'VIENDO', seriesId: { not: null } },
        _count: { seriesId: true },
      }),

      // Series completed this week
      prisma.viewStatus.count({
        where: {
          status: 'VISTA',
          seriesId: { not: null },
          updatedAt: { gte: sevenDaysAgo },
        },
      }),

      // Comments this week
      prisma.comment.count({
        where: { createdAt: { gte: sevenDaysAgo } },
      }),

      // Top 10 series currently being watched
      prisma.viewStatus.groupBy({
        by: ['seriesId'],
        where: { status: 'VIENDO', seriesId: { not: null } },
        _count: { seriesId: true },
        orderBy: { _count: { seriesId: 'desc' } },
        take: 10,
      }),

      // Top 10 series most completed
      prisma.viewStatus.groupBy({
        by: ['seriesId'],
        where: { status: 'VISTA', seriesId: { not: null } },
        _count: { seriesId: true },
        orderBy: { _count: { seriesId: 'desc' } },
        take: 10,
      }),

      // Top 10 most favorited
      prisma.userFavorite.groupBy({
        by: ['seriesId'],
        _count: { seriesId: true },
        orderBy: { _count: { seriesId: 'desc' } },
        take: 10,
      }),

      // Top 10 most commented (series only)
      prisma.comment.groupBy({
        by: ['seriesId'],
        where: { seriesId: { not: null } },
        _count: { seriesId: true },
        orderBy: { _count: { seriesId: 'desc' } },
        take: 10,
      }),

      // Top 10 best rated by users (avg score)
      prisma.userRating.groupBy({
        by: ['seriesId'],
        _avg: { score: true },
        _count: { seriesId: true },
        having: { seriesId: { _count: { gte: 2 } } },
        orderBy: { _avg: { score: 'desc' } },
        take: 10,
      }),

      // Active users (at least one activity in last 30 days)
      prisma.user.findMany({
        where: {
          banned: false,
          viewStatuses: { some: { updatedAt: { gte: thirtyDaysAgo } } },
        },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          _count: {
            select: {
              viewStatuses: { where: { status: 'VISTA' } },
            },
          },
        },
        orderBy: { name: 'asc' },
        take: 20,
      }),
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

    return NextResponse.json({
      summary: {
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
            avgScore: Math.round((r._avg.score ?? 0) * 10) / 10,
            count: r._count.seriesId,
          })),
      },
      activeUsers,
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: 'Error al obtener estadísticas' },
      { status: 500 }
    );
  }
}
