import 'dotenv/config';
import assert from 'node:assert/strict';
import { prisma } from '../src/lib/database';
import {
  markEpisode,
  setEpisodesWatched,
  setProgress,
} from '../src/lib/tracking';
import { assertLocalTestDatabase } from './assert-local-test-database';

/**
 * Prueba del progreso compartido entre un aporte USER_EMBED y la ficha
 * curada a la que esta vinculado (src/lib/tracking.ts -> syncLinkedSeries),
 * contra una base local descartable. Ver docs/seguimiento-pruebas-locales.md.
 *
 * Uso: node --import ./scripts/prisma-test-runtime.mjs --import tsx scripts/test-linked-progress-database.ts
 */

async function main() {
  assertLocalTestDatabase();
  const runId = Date.now();

  const user = await prisma.user.create({
    data: {
      id: `linked-test-${runId}`,
      name: 'Vinculo de prueba',
      email: `linked-test-${runId}@example.test`,
    },
  });

  const curated = await prisma.series.create({
    data: {
      title: `Ficha ${runId}`,
      type: 'serie',
      seasons: {
        create: [
          {
            seasonNumber: 1,
            episodes: {
              create: [1, 2, 3].map((episodeNumber) => ({ episodeNumber })),
            },
          },
        ],
      },
    },
  });
  // 3 capitulos de 2 partes, con un avance entre el 1 y el 2.
  const aporteTitles = [
    'EP.1 [1/2]',
    'EP.1 [2/2]',
    'ตัวอย่าง EP.2',
    'EP.2 [1/2]',
    'EP.2 [2/2]',
    'EP.3 [1/2]',
    'EP.3 [2/2]',
  ];
  const aporte = await prisma.series.create({
    data: {
      title: `Aporte ${runId}`,
      type: 'serie',
      origin: 'USER_EMBED',
      linkedSeriesId: curated.id,
      seasons: {
        create: [
          {
            seasonNumber: 1,
            episodes: {
              create: aporteTitles.map((title, i) => ({
                episodeNumber: i + 1,
                title: `Serie | ${title}`,
              })),
            },
          },
        ],
      },
    },
  });
  // Vinculo que no calza: 4 videos sin titulo contra una ficha de 1 cap.
  const lonelyCurated = await prisma.series.create({
    data: {
      title: `Ficha corta ${runId}`,
      type: 'serie',
      seasons: {
        create: [
          { seasonNumber: 1, episodes: { create: [{ episodeNumber: 1 }] } },
        ],
      },
    },
  });
  const wrongAporte = await prisma.series.create({
    data: {
      title: `Aporte equivocado ${runId}`,
      type: 'serie',
      origin: 'USER_EMBED',
      linkedSeriesId: lonelyCurated.id,
      seasons: {
        create: [
          {
            seasonNumber: 1,
            episodes: {
              create: [1, 2, 3, 4].map((episodeNumber) => ({ episodeNumber })),
            },
          },
        ],
      },
    },
  });

  const episodesOf = async (seriesId: number) =>
    (
      await prisma.episode.findMany({
        where: { season: { seriesId } },
        orderBy: { episodeNumber: 'asc' },
        select: { id: true },
      })
    ).map((episode) => episode.id);
  const [c1, c2, c3] = await episodesOf(curated.id);
  const [p1a, p1b, trailer, p2a, p2b, p3a, p3b] = await episodesOf(aporte.id);
  const watchedIds = async () =>
    new Set(
      (
        await prisma.viewStatus.findMany({
          where: { userId: user.id, status: 'VISTA', episodeId: { not: null } },
          select: { episodeId: true },
        })
      ).map((row) => row.episodeId)
    );
  const seriesStatus = (seriesId: number) =>
    prisma.viewStatus.findUnique({
      where: { userId_seriesId: { userId: user.id, seriesId } },
      select: { status: true },
    });

  // 1) Una parte vista en /ver del aporte no marca el capitulo de la ficha.
  await prisma.$transaction((tx) =>
    setEpisodesWatched(tx, user.id, aporte.id, [p1a], true)
  );
  assert.equal((await watchedIds()).has(c1), false);
  assert.equal(await seriesStatus(curated.id), null);

  // 2) La segunda parte completa el capitulo: la ficha marca el 1 y pasa a VIENDO.
  await prisma.$transaction((tx) => markEpisode(tx, user.id, p1b, 'VISTA'));
  let watched = await watchedIds();
  assert.equal(watched.has(c1), true);
  assert.equal(watched.has(c2), false);
  assert.equal((await seriesStatus(curated.id))?.status, 'VIENDO');

  // 3) "Voy por" en el aporte hasta EP.2 [2/2]: la ficha llega al 2; el
  //    avance se marca en el aporte pero no es un capitulo.
  await prisma.$transaction((tx) =>
    setProgress(tx, user.id, aporte.id, { upToEpisodeId: p2b })
  );
  watched = await watchedIds();
  assert.equal(watched.has(trailer), true);
  assert.equal(watched.has(c2), true);
  assert.equal(watched.has(c3), false);

  // 4) Desmarcar una parte en el aporte desmarca el capitulo en la ficha.
  await prisma.$transaction((tx) =>
    setEpisodesWatched(tx, user.id, aporte.id, [p2a], false)
  );
  watched = await watchedIds();
  assert.equal(watched.has(c2), false);
  assert.equal(watched.has(p2b), true);

  // 5) Marcar en la ficha marca todas las partes del capitulo en el aporte,
  //    sin crearle al aporte otra fila de seguimiento.
  const aporteRowBefore = await seriesStatus(aporte.id);
  await prisma.$transaction((tx) =>
    setEpisodesWatched(tx, user.id, curated.id, [c3], true)
  );
  watched = await watchedIds();
  assert.equal(watched.has(p3a) && watched.has(p3b), true);
  assert.deepEqual(await seriesStatus(aporte.id), aporteRowBefore);

  // 6) Desmarcar desde la ficha ("volver a ninguno") limpia el aporte.
  await prisma.$transaction((tx) =>
    setProgress(
      tx,
      user.id,
      curated.id,
      { upToEpisodeId: c1 },
      { direction: 'unmark', inclusive: true }
    )
  );
  watched = await watchedIds();
  assert.equal(
    [p1a, p1b, p2b, p3a, p3b].some((id) => watched.has(id)),
    false
  );
  assert.equal(watched.has(trailer), true);

  // 7) Un vinculo que no calza no copia nada.
  const [w1] = await episodesOf(wrongAporte.id);
  const [l1] = await episodesOf(lonelyCurated.id);
  await prisma.$transaction((tx) =>
    setEpisodesWatched(tx, user.id, wrongAporte.id, [w1], true)
  );
  assert.equal((await watchedIds()).has(l1), false);
  assert.equal(await seriesStatus(lonelyCurated.id), null);

  // 8) Un aporte oculto por admin deja de copiar.
  await prisma.series.update({
    where: { id: aporte.id },
    data: { visibility: 'HIDDEN' },
  });
  await prisma.$transaction((tx) =>
    setEpisodesWatched(tx, user.id, aporte.id, [p1a, p1b], true)
  );
  assert.equal((await watchedIds()).has(c1), false);

  console.log(
    JSON.stringify({
      result: 'PASS',
      checks: [
        'una parte del aporte no marca el capitulo de la ficha',
        'el capitulo completo marca la ficha y la pone en VIENDO',
        'voy por en el aporte avanza la ficha por capitulo, no por video',
        'desmarcar una parte desmarca el capitulo en la ficha',
        'marcar en la ficha marca las partes del aporte sin fila de serie',
        'desmarcar desde la ficha limpia el aporte',
        'vinculo que no calza no copia nada',
        'aporte oculto no copia',
      ],
    })
  );
}

main().finally(() => prisma.$disconnect());
