import { prisma } from './database';
import { groupIntoChapters } from './episode-chapters';
import { COMMUNITY, PUBLIC_STATS_SERIES } from './statistics-scope';

/** One completion per account/chapter, after all parts; shared by cards, chart and ranking. */
export async function getCommunityChapterCompletions(since: Date, now: Date) {
  const series = await prisma.series.findMany({
    where: {
      ...PUBLIC_STATS_SERIES,
      seasons: {
        some: {
          episodes: {
            some: {
              viewStatus: {
                some: {
                  status: 'VISTA',
                  ...COMMUNITY,
                  OR: [
                    { watchedDate: { gte: since, lte: now } },
                    { watchedDate: null, updatedAt: { gte: since, lte: now } },
                  ],
                },
              },
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
              viewStatus: {
                where: { status: 'VISTA', ...COMMUNITY },
                select: { userId: true, watchedDate: true, updatedAt: true },
              },
            },
          },
        },
      },
    },
  });
  const completions: Array<{ userId: string; date: Date }> = [];
  for (const item of series) {
    const rows = item.seasons.flatMap((season) =>
      season.episodes.map((episode) => ({
        ...episode,
        seasonNumber: season.seasonNumber,
      }))
    );
    for (const chapter of groupIntoChapters(rows).chapters) {
      const users = new Map<string, Date[]>();
      for (const episode of chapter.episodes) {
        for (const status of episode.viewStatus) {
          if (!status.userId) continue;
          const dates = users.get(status.userId) ?? [];
          dates.push(status.watchedDate ?? status.updatedAt);
          users.set(status.userId, dates);
        }
      }
      for (const [userId, dates] of users) {
        if (dates.length !== chapter.episodes.length) continue;
        const date = new Date(
          Math.max(...dates.map((value) => value.getTime()))
        );
        if (date >= since && date <= now) completions.push({ userId, date });
      }
    }
  }
  return completions;
}
