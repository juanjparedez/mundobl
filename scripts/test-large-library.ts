import assert from 'node:assert/strict';
import {
  prisma,
  countUserWatchedChapters,
  getCollaboratorStats,
  getRecommendationsForUser,
  getTrackingInsights,
  getWatchedTime,
  getWatchingLibrary,
  getWatchingNow,
  recordUserActiveDay,
  saveWatchingPreferences,
} from '../src/lib/database';
import {
  getAchievementCounts,
  syncAchievementUnlocks,
} from '../src/lib/achievement-store';
import { setEpisodesWatched, setProgress } from '../src/lib/tracking';
import { assertLocalTestDatabase } from './assert-local-test-database';

/**
 * Una curadora con una biblioteca grande (como la de Flor: cientos de
 * series) y una serie larga. D1 acepta ~100 parametros por consulta: toda
 * lista de ids que crece con los datos tiene que ir partida (d1-lists.ts).
 * La base local usa el mismo adapter de D1, asi que el limite es el mismo.
 */
const LIBRARY = 250;
const LONG_SERIES_EPISODES = 130;

async function main() {
  assertLocalTestDatabase();
  const runId = Date.now();
  const user = await prisma.user.create({
    data: { email: `large-library-${runId}@test.local` },
  });
  const tag = await prisma.tag.create({ data: { name: `Tag ${runId}` } });

  const seriesIds: number[] = [];
  for (let i = 0; i < LIBRARY; i++) {
    const series = await prisma.series.create({
      data: {
        title: `Biblioteca ${runId} ${i}`,
        type: 'serie',
        origin: 'USER_EMBED',
        submittedById: user.id,
        tags: { create: { tagId: tag.id } },
        seasons: {
          create: {
            seasonNumber: 1,
            episodeCount: 2,
            episodes: {
              create: [
                { episodeNumber: 1, durationSeconds: 1500 },
                { episodeNumber: 2, durationSeconds: 1500 },
              ],
            },
          },
        },
      },
      select: { id: true },
    });
    seriesIds.push(series.id);
  }
  await prisma.viewStatus.createMany({
    data: seriesIds.map((seriesId, i) => ({
      userId: user.id,
      seriesId,
      status: i % 2 ? 'VISTA' : 'VIENDO',
      lastWatchedAt: new Date(runId - i * 1000),
    })),
  });
  await prisma.userFavorite.createMany({
    data: seriesIds
      .slice(0, 120)
      .map((seriesId) => ({ userId: user.id, seriesId })),
  });

  // La serie larga: marcarla entera y desmarcarla pasa por listas de
  // capitulos mas largas que el limite.
  const long = await prisma.series.create({
    data: {
      title: `Serie larga ${runId}`,
      type: 'serie',
      seasons: {
        create: {
          seasonNumber: 1,
          episodeCount: LONG_SERIES_EPISODES,
          episodes: {
            create: Array.from({ length: LONG_SERIES_EPISODES }, (_, i) => ({
              episodeNumber: i + 1,
            })),
          },
        },
      },
    },
    select: { id: true, seasons: { select: { episodes: true } } },
  });
  const longEpisodes = long.seasons[0].episodes.map((episode) => episode.id);

  const library = await getWatchingLibrary(user.id, 'all');
  assert.equal(library.length, LIBRARY, 'library lists every series');
  const active = await getWatchingLibrary(user.id, 'active');
  assert.equal(active.length, LIBRARY / 2);

  const watchingNow = await getWatchingNow(user.id);
  assert.equal(watchingNow.length, LIBRARY / 2);
  await countUserWatchedChapters(user.id);
  await getWatchedTime(user.id);
  await getTrackingInsights(user.id, 30);

  const stats = await getCollaboratorStats(user.id);
  assert.equal(stats.totalWatching, LIBRARY / 2);
  assert.equal(stats.totalWatched, LIBRARY / 2);
  assert.equal(stats.totalFavorites, 120);

  const recommendations = await getRecommendationsForUser(user.id);
  for (const card of recommendations.series)
    assert.ok(!seriesIds.includes(card.id), 'recommendations skip the library');

  const counts = await getAchievementCounts(user.id);
  await syncAchievementUnlocks(user.id, counts);

  await saveWatchingPreferences(user.id, {
    initial: { view: 'grid', sort: 'recent', pinned: seriesIds.slice(0, 100) },
  });

  const marked = await setProgress(prisma, user.id, long.id, {
    upToEpisodeId: longEpisodes.at(-1),
  });
  assert.equal(marked.allWatched, true, 'a long series can be marked whole');
  await setEpisodesWatched(prisma, user.id, long.id, longEpisodes, false);
  assert.equal(
    await prisma.viewStatus.count({
      where: {
        userId: user.id,
        status: 'VISTA',
        episode: { season: { seriesId: long.id } },
      },
    }),
    0,
    'a long series can be unmarked whole'
  );

  // Dos requests en paralelo en el primer uso del dia: una sola lo anota.
  const firsts = await Promise.all([
    recordUserActiveDay(user.id),
    recordUserActiveDay(user.id),
  ]);
  assert.equal(firsts.filter(Boolean).length, 1);

  console.log('large library OK');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
