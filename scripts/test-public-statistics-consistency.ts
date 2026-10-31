import { getAdminStatistics } from '../src/lib/admin-statistics';
import { getProducerReport } from '../src/lib/producer-report';
import { getPilotReport } from '../src/lib/pilot-report';
import assert from 'node:assert/strict';
import { prisma, getPublicFavoriteCount } from '../src/lib/database';
import { getPublicStats } from '../src/lib/public-stats';
import { getPublicWatchStats } from '../src/lib/series-activity-stats';
import { getCommunityChapterCompletions } from '../src/lib/community-chapter-statistics';
import { getOwnRankingPosition } from '../src/lib/community-ranking';
import { statsWindowStart } from '../src/lib/statistics-scope';
import { utcDay } from '../src/lib/series-activity';
import { assertLocalTestDatabase } from './assert-local-test-database';

async function main() {
  assertLocalTestDatabase();
  const now = new Date();
  const key = `consistency-${Date.now()}`;
  const ids: number[] = [];
  const actorIds: number[] = [];
  const users = ['one', 'two', 'admin', 'moderator', 'collaborator', 'banned'];
  const before = await getPublicStats();
  const adminBefore = await getAdminStatistics(now);
  const producerBefore = await getProducerReport(30, now);
  const producer90Before = await getProducerReport(90, now);
  const watchBefore = await getPublicWatchStats(30, now);
  try {
    for (const name of users) {
      await prisma.user.create({
        data: {
          id: `${key}-${name}`,
          email: `${key}-${name}@example.invalid`,
          banned: name === 'banned',
          role:
            name === 'admin'
              ? 'ADMIN'
              : name === 'moderator'
                ? 'MODERATOR'
                : name === 'collaborator'
                  ? 'COLLABORATOR'
                  : 'VISITOR',
        },
      });
    }
    for (const name of ['catalog', 'embed', 'hidden', 'empty']) {
      const series = await prisma.series.create({
        data: {
          title: `${key}-${name}`,
          type: 'serie',
          origin:
            name === 'embed' || name === 'empty' ? 'USER_EMBED' : 'CURATED',
          catalogScope:
            name === 'embed' || name === 'empty'
              ? 'WATCHABLE_ONLY'
              : 'PERSONAL',
          visibility: name === 'hidden' ? 'HIDDEN' : 'VISIBLE',
          ...(name !== 'empty'
            ? {
                seasons: {
                  create: {
                    seasonNumber: 1,
                    episodes: {
                      create: [
                        {
                          episodeNumber: 1,
                          title: 'EP.1 [1/2]',
                          embedUrl: 'https://www.youtube.com/embed/synthetic',
                          durationSeconds: 1200,
                        },
                        {
                          episodeNumber: 2,
                          title: 'EP.1 [2/2]',
                          embedUrl: 'https://www.youtube.com/embed/synthetic2',
                          durationSeconds: 1200,
                        },
                        {
                          episodeNumber: 3,
                          title: 'Trailer EP.2',
                          embedUrl: 'https://www.youtube.com/embed/trailer',
                          durationSeconds: 60,
                        },
                      ],
                    },
                  },
                },
              }
            : {}),
        },
      });
      ids.push(series.id);
      for (const name of users) {
        await prisma.userFavorite.create({
          data: { userId: `${key}-${name}`, seriesId: series.id },
        });
        await prisma.viewStatus.create({
          data: {
            userId: `${key}-${name}`,
            seriesId: series.id,
            status: 'VISTA',
            watchedDate: now,
          },
        });
      }
    }
    const episodes = await prisma.episode.findMany({
      where: { season: { seriesId: ids[0] } },
      orderBy: { episodeNumber: 'asc' },
    });
    const seasonId = episodes[0].seasonId;
    for (const name of ['both', 'season-only', 'placeholder']) {
      const actor = await prisma.actor.create({
        data: { name: `${key}-${name}`, isPlaceholder: name === 'placeholder' },
      });
      actorIds.push(actor.id);
      await prisma.seasonActor.create({
        data: { seasonId, actorId: actor.id },
      });
      if (name === 'both')
        await prisma.seriesActor.create({
          data: { seriesId: ids[0], actorId: actor.id },
        });
    }
    for (const name of users) {
      for (const [index, episode] of episodes.entries()) {
        if (name === 'two' && index === 1) continue; // Partial chapter must not count.
        await prisma.viewStatus.create({
          data: {
            userId: `${key}-${name}`,
            episodeId: episode.id,
            status: 'VISTA',
            watchedDate: now,
          },
        });
      }
    }
    await prisma.userRating.createMany({
      data: [
        {
          userId: `${key}-one`,
          seriesId: ids[0],
          category: 'general',
          score: 10,
        },
        { userId: `${key}-one`, seriesId: ids[0], category: 'plot', score: 4 },
        {
          userId: `${key}-one`,
          seriesId: ids[0],
          category: 'acting',
          score: 6,
        },
        { userId: `${key}-two`, seriesId: ids[0], category: 'plot', score: 2 },
        {
          userId: `${key}-two`,
          seriesId: ids[0],
          category: 'acting',
          score: 2,
        },
        {
          userId: `${key}-admin`,
          seriesId: ids[0],
          category: 'general',
          score: 1,
        },
        {
          userId: `${key}-one`,
          seriesId: ids[2],
          category: 'general',
          score: 1,
        },
      ],
    });
    const today = utcDay(now);
    for (const seriesId of [ids[0], ids[2], ids[3]]) {
      for (const [kind, count] of [
        ['chapter', 79],
        ['play_start', 3],
        ['view', 1],
        ['open_ver', 2],
      ] as const) {
        await prisma.seriesActivityDaily.create({
          data: {
            seriesId,
            kind,
            count,
            day: today,
            source: 'browser',
            country: '',
          },
        });
      }
    }
    // Completion-only history is not a "most starts" entry and must never invent starts.
    await prisma.seriesActivityDaily.create({
      data: {
        seriesId: ids[1],
        kind: 'view',
        count: 2,
        day: today,
        source: 'browser',
        country: '',
      },
    });
    // Future and out-of-window events must not change any 30-day total.
    for (const offset of [-31, 1]) {
      const day = new Date(today.getTime() + offset * 86400000);
      await prisma.seriesActivityDaily.create({
        data: {
          seriesId: ids[0],
          kind: 'play_start',
          count: 999,
          day,
          source: 'browser',
          country: '',
        },
      });
    }
    const admin = await getAdminStatistics(now);
    assert.equal(admin.summary.totalUsers - adminBefore.summary.totalUsers, 2);
    assert.equal(
      admin.summary.completedThisWeek - adminBefore.summary.completedThisWeek,
      4
    );
    assert.equal(
      admin.rankings.favorited.find((row) => row.seriesId === ids[0])?.count,
      2
    );
    assert.equal(
      admin.rankings.rated.find((row) => row.seriesId === ids[0])?.count,
      2
    );
    assert.equal(
      admin.rankings.rated.find((row) => row.seriesId === ids[0])?.avgScore,
      6
    );
    assert.equal(
      admin.activeUsers.find((row) => row.id === `${key}-one`)?._count
        .viewStatuses,
      2
    );
    assert.equal(
      admin.activeUsers.filter((row) => row.id.startsWith(key)).length,
      2
    );
    assert.equal(admin.distribution.completedByDay.length, 30);
    assert.equal(
      admin.distribution.completedByDay.reduce((n, row) => n + row.count, 0) -
        adminBefore.distribution.completedByDay.reduce(
          (n, row) => n + row.count,
          0
        ),
      4
    );
    const producer = await getProducerReport(30, now);
    assert.equal(producer.accounts - producerBefore.accounts, 2);
    assert.equal(
      producer.totals.playStarts! - producerBefore.totals.playStarts!,
      3
    );
    assert.equal(producer.totals.views - producerBefore.totals.views, 3);
    assert.equal(producer.totals.chapters - producerBefore.totals.chapters, 79);
    assert.equal(
      producer.chaptersBySource.browser -
        producerBefore.chaptersBySource.browser,
      79
    );
    assert.equal(
      producer.series.find((row) => row.seriesId === ids[0])?.trackers,
      2
    );
    assert.ok(
      !producer.series.some((row) => [ids[2], ids[3]].includes(row.seriesId))
    );
    assert.equal(
      (await getProducerReport(90, now)).totals.playStarts! -
        producer90Before.totals.playStarts!,
      1002
    );
    // Editing an old completion must change the current read without inflating recent totals.
    await prisma.viewStatus.updateMany({
      where: { userId: `${key}-one`, seriesId: ids[0] },
      data: { watchedDate: new Date('2020-01-01') },
    });
    assert.equal(
      (await getAdminStatistics(now)).summary.completedThisWeek,
      admin.summary.completedThisWeek - 1
    );
    await prisma.viewStatus.updateMany({
      where: { userId: `${key}-one`, seriesId: ids[0] },
      data: { watchedDate: now },
    });
    const pilot = await getPilotReport(now);
    assert.ok(
      pilot.rows.every((row) => row.day <= today.toISOString().slice(0, 10))
    );
    const stats = await getPublicStats();
    assert.equal(stats.summary.totalSeries - before.summary.totalSeries, 1);
    assert.equal(
      stats.summary.totalCompletedViews - before.summary.totalCompletedViews,
      4
    );
    assert.equal(
      stats.summary.totalFavorites - before.summary.totalFavorites,
      4
    );
    assert.equal(await getPublicFavoriteCount(ids[0]), 2);
    assert.equal(
      stats.rankings.topActors.find((row) => row.actorId === actorIds[0])
        ?.count,
      2
    );
    assert.equal(
      stats.rankings.topActors.find((row) => row.actorId === actorIds[1])
        ?.count,
      2
    );
    assert.ok(
      !stats.rankings.topActors.some((row) => row.actorId === actorIds[2])
    );
    assert.equal(
      stats.rankings.topFavorited.find((row) => row.seriesId === ids[0])?.count,
      2
    );
    assert.equal(
      stats.summary.totalUserRatings - before.summary.totalUserRatings,
      2
    );
    assert.equal(
      stats.ratings.distribution.reduce((sum, row) => sum + row.count, 0),
      stats.ratings.total
    );
    assert.equal(
      stats.rankings.topRated?.find((row) => row.seriesId === ids[0])?.avgScore,
      6
    );
    assert.equal(
      stats.rankings.byType.reduce((sum, row) => sum + row.count, 0),
      stats.summary.totalCompletedViews
    );
    assert.equal(
      stats.catalog.byType.reduce((sum, row) => sum + row.count, 0),
      stats.summary.totalSeries
    );
    assert.equal(
      stats.recent.episodesSeenRecently - before.recent.episodesSeenRecently,
      1
    );
    const chapters = await getCommunityChapterCompletions(
      statsWindowStart(30, now),
      now
    );
    assert.equal(
      chapters.filter((row) => row.userId.startsWith(key)).length,
      1
    );
    assert.equal((await getOwnRankingPosition(`${key}-one`, now)).count, 1);
    assert.equal((await getOwnRankingPosition(`${key}-two`, now)).count, 0);
    await prisma.viewStatus.updateMany({
      where: {
        userId: `${key}-one`,
        episodeId: { in: episodes.map((row) => row.id) },
      },
      data: { watchedDate: new Date('2020-01-01') },
    });
    assert.equal(
      (await getOwnRankingPosition(`${key}-one`, now)).count,
      0,
      'Editing an old watch date must not create recent activity'
    );
    const watch = await getPublicWatchStats(30, now);
    assert.equal(watch.totals.playStarts - watchBefore.totals.playStarts, 3);
    assert.equal(
      watch.totals.completedPlays - watchBefore.totals.completedPlays,
      3
    );
    assert.equal(
      watch.totals.playerVisits - watchBefore.totals.playerVisits,
      2
    );
    assert.equal(
      watch.playsByDay.reduce((sum, row) => sum + row.starts, 0),
      watch.totals.playStarts
    );
    assert.equal(
      watch.playsByDay.reduce((sum, row) => sum + row.completions, 0),
      watch.totals.completedPlays
    );
    assert.ok(
      watch.topSeries.every(
        (row) =>
          row.starts > 0 && row.seriesId !== ids[1] && row.seriesId !== ids[2]
      )
    );
    await prisma.seriesActivityDaily.updateMany({
      where: { seriesId: ids[0], kind: 'view' },
      data: { count: 1000000 },
    });
    assert.equal(
      (await getPublicWatchStats(30, now)).totals.completionRate,
      null,
      'Never hide incompatible events by clamping to 100%'
    );
    console.log(
      'PASS: admin reports, 30/90-day producer windows, live reads, public totals, favorites, staff/visibility scope, votes, chapter parts, ranking and streaming use consistent sources'
    );
  } finally {
    await prisma.series.deleteMany({ where: { id: { in: ids } } });
    await prisma.actor.deleteMany({ where: { id: { in: actorIds } } });
    await prisma.user.deleteMany({
      where: { id: { in: users.map((name) => `${key}-${name}`) } },
    });
  }
}
main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
