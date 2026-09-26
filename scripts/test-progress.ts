import 'dotenv/config';
import assert from 'node:assert/strict';
import { prisma } from '../src/lib/database';
import {
  setProgress,
  setEpisodesWatched,
  ProgressNotFoundError,
  markEpisode,
} from '../src/lib/tracking';
import { assertLocalTestDatabase } from './assert-local-test-database';

/**
 * Prueba de src/lib/tracking.ts -> setProgress (T05), contra una base local
 * descartable — mismo guardrail que scripts/test-flor-feedback.ts: nunca
 * corre contra la base compartida/produccion.
 *
 * Uso: npx tsx scripts/test-progress.ts
 */

async function main() {
  assertLocalTestDatabase();

  const runId = Date.now();
  const user = await prisma.user.create({
    data: {
      id: `progress-test-${runId}`,
      name: 'Progreso de prueba',
      email: `progress-test-${runId}@example.test`,
    },
  });

  const series = await prisma.series.create({
    data: {
      title: `Serie de progreso ${runId}`,
      type: 'serie',
      year: 2026,
      seasons: {
        create: [
          {
            seasonNumber: 1,
            episodes: {
              create: Array.from({ length: 8 }, (_, i) => ({
                episodeNumber: i + 1,
              })),
            },
          },
        ],
      },
    },
    include: { seasons: { include: { episodes: true } } },
  });

  const episodes = series.seasons[0].episodes.sort(
    (a, b) => a.episodeNumber - b.episodeNumber
  );
  const ep3 = episodes[2];
  const ep8 = episodes[7];

  // 1) Serie de 8 episodios, usuario limpio, upToEpisodeId = ep3.
  const result1 = await prisma.$transaction((tx) =>
    setProgress(tx, user.id, series.id, { upToEpisodeId: ep3.id })
  );
  assert.equal(result1.watched, 3);
  assert.equal(result1.total, 8);
  assert.equal(result1.seriesStatus, 'VIENDO');
  assert.equal(result1.allWatched, false);
  const vistaRows1 = await prisma.viewStatus.count({
    where: { userId: user.id, status: 'VISTA', episodeId: { not: null } },
  });
  assert.equal(vistaRows1, 3);

  // Imported dates (including unknown dates) must survive repeated progress commands.
  const historicalDate = new Date('2021-03-04T12:00:00.000Z');
  await prisma.viewStatus.update({
    where: { userId_episodeId: { userId: user.id, episodeId: ep3.id } },
    data: { watchedDate: historicalDate },
  });
  await prisma.viewStatus.update({
    where: { userId_episodeId: { userId: user.id, episodeId: episodes[0].id } },
    data: { watchedDate: null },
  });
  await prisma.viewStatus.update({
    where: { userId_seriesId: { userId: user.id, seriesId: series.id } },
    data: { lastWatchedAt: historicalDate, status: 'RETOMAR' },
  });
  // 2) Repetir no crea duplicados, no inventa fechas y no reanuda una serie pausada.
  const result2 = await prisma.$transaction((tx) =>
    setProgress(tx, user.id, series.id, { upToEpisodeId: ep3.id })
  );
  assert.equal(result2.watched, 3);
  assert.equal(result2.seriesStatus, 'RETOMAR');
  const preserved = await prisma.viewStatus.findUniqueOrThrow({
    where: { userId_episodeId: { userId: user.id, episodeId: ep3.id } },
  });
  assert.equal(
    preserved.watchedDate?.toISOString(),
    historicalDate.toISOString()
  );
  const unknownDate = await prisma.$transaction((tx) =>
    markEpisode(tx, user.id, episodes[0].id, 'VISTA')
  );
  assert.equal(unknownDate.episode.watchedDate, null);
  assert.equal(unknownDate.series?.status, 'RETOMAR');
  assert.equal(
    unknownDate.series?.lastWatchedAt?.toISOString(),
    historicalDate.toISOString()
  );
  const vistaRows2 = await prisma.viewStatus.count({
    where: { userId: user.id, status: 'VISTA', episodeId: { not: null } },
  });
  assert.equal(vistaRows2, 3);

  // 3) upToEpisodeId de otra serie -> ProgressNotFoundError.
  const otherSeries = await prisma.series.create({
    data: {
      title: `Otra serie ${runId}`,
      type: 'serie',
      year: 2026,
      seasons: {
        create: { seasonNumber: 1, episodes: { create: { episodeNumber: 1 } } },
      },
    },
  });
  await assert.rejects(
    prisma.$transaction((tx) =>
      setProgress(tx, user.id, otherSeries.id, { upToEpisodeId: ep3.id })
    ),
    ProgressNotFoundError
  );

  // 4) direction: 'unmark' sobre ep3 (tras marcar hasta ep8) deja 4..8 en
  // SIN_VER y no toca 1..3.
  await prisma.$transaction((tx) =>
    setProgress(tx, user.id, series.id, { upToEpisodeId: ep8.id })
  );
  const result4 = await prisma.$transaction((tx) =>
    setProgress(
      tx,
      user.id,
      series.id,
      { upToEpisodeId: ep3.id },
      { direction: 'unmark' }
    )
  );
  assert.equal(result4.watched, 3);
  assert.equal(
    episodes
      .slice(0, 3)
      .every((ep) => result4.episodeStatus[ep.id] === 'VISTA'),
    true
  );
  assert.equal(
    episodes.slice(3).every((ep) => result4.episodeStatus[ep.id] === 'SIN_VER'),
    true
  );

  // 5) completeIfAll: true con el ultimo episodio -> serie VISTA.
  const result5 = await prisma.$transaction((tx) =>
    setProgress(
      tx,
      user.id,
      series.id,
      { upToEpisodeId: ep8.id },
      { completeIfAll: true }
    )
  );
  assert.equal(result5.allWatched, true);
  assert.equal(result5.seriesStatus, 'VISTA');

  // setEpisodesWatched (1.7, las partes de un capitulo en /ver), con un
  // usuario limpio.
  const viewer = await prisma.user.create({
    data: {
      id: `progress-test-viewer-${runId}`,
      name: 'Espectador de prueba',
      email: `progress-test-viewer-${runId}@example.test`,
    },
  });
  const chapterIds = [episodes[4].id, episodes[5].id];

  // 6) Marca solo esas dos, pone la serie en VIENDO y suscribe.
  const result6 = await prisma.$transaction((tx) =>
    setEpisodesWatched(tx, viewer.id, series.id, chapterIds, true)
  );
  assert.equal(result6.watched, 2);
  assert.equal(result6.seriesStatus, 'VIENDO');
  assert.equal(result6.episodeStatus[episodes[3].id], 'SIN_VER');
  const subscription = await prisma.seriesSubscription.count({
    where: { userId: viewer.id, seriesId: series.id },
  });
  assert.equal(subscription, 1);

  // 7) Repetir no duplica.
  await prisma.viewStatus.updateMany({
    where: { userId: viewer.id, episodeId: { in: chapterIds } },
    data: { watchedDate: historicalDate },
  });
  await prisma.viewStatus.update({
    where: { userId_seriesId: { userId: viewer.id, seriesId: series.id } },
    data: { lastWatchedAt: historicalDate },
  });
  const result7 = await prisma.$transaction((tx) =>
    setEpisodesWatched(tx, viewer.id, series.id, chapterIds, true)
  );
  assert.equal(result7.watched, 2);
  const chapterDates = await prisma.viewStatus.findMany({
    where: { userId: viewer.id, episodeId: { in: chapterIds } },
  });
  assert.ok(
    chapterDates.every(
      (row) => row.watchedDate?.toISOString() === historicalDate.toISOString()
    )
  );
  const seriesDate = await prisma.viewStatus.findUniqueOrThrow({
    where: { userId_seriesId: { userId: viewer.id, seriesId: series.id } },
  });
  assert.equal(
    seriesDate.lastWatchedAt?.toISOString(),
    historicalDate.toISOString()
  );

  // 8) Desmarcar deja 0 vistos y no toca la fila de la serie.
  const result8 = await prisma.$transaction((tx) =>
    setEpisodesWatched(tx, viewer.id, series.id, chapterIds, false)
  );
  assert.equal(result8.watched, 0);
  assert.equal(result8.seriesStatus, 'VIENDO');
  const rewatched = await prisma.$transaction((tx) =>
    markEpisode(tx, viewer.id, chapterIds[0], 'VISTA')
  );
  assert.ok(
    rewatched.episode.watchedDate &&
      rewatched.episode.watchedDate > historicalDate
  );
  await prisma.$transaction((tx) =>
    markEpisode(tx, viewer.id, chapterIds[0], 'SIN_VER')
  );

  // 9) Ids de otra serie se ignoran; si no queda ninguno -> 404.
  const foreignEpisode = await prisma.episode.findFirstOrThrow({
    where: { season: { seriesId: otherSeries.id } },
  });
  const result9 = await prisma.$transaction((tx) =>
    setEpisodesWatched(
      tx,
      viewer.id,
      series.id,
      [episodes[0].id, foreignEpisode.id],
      true
    )
  );
  assert.equal(result9.watched, 1);
  await assert.rejects(
    prisma.$transaction((tx) =>
      setEpisodesWatched(tx, viewer.id, series.id, [foreignEpisode.id], true)
    ),
    ProgressNotFoundError
  );

  console.log(
    JSON.stringify({
      result: 'PASS',
      checks: [
        'upToEpisodeId marca 1..3, serie VIENDO',
        'llamada repetida no duplica',
        'repetir conserva fechas históricas/desconocidas y la pausa elegida',
        'marcado de partes conserva fechas; desmarcar y volver a marcar registra una fecha nueva',
        'episodio de otra serie -> 404 (ProgressNotFoundError)',
        "direction: 'unmark' respeta 1..3 y limpia 4..8",
        'completeIfAll con el ultimo episodio -> serie VISTA',
        'setEpisodesWatched marca solo esos, serie VIENDO y suscribe',
        'setEpisodesWatched repetido no duplica',
        'setEpisodesWatched desmarca sin tocar la serie',
        'setEpisodesWatched ignora ids de otra serie; sin ninguno -> 404',
      ],
      seriesId: series.id,
      userId: user.id,
    })
  );
}

main().finally(() => prisma.$disconnect());
