import 'dotenv/config';
import assert from 'node:assert/strict';
import { prisma } from '../src/lib/database';
import { setProgress, ProgressNotFoundError } from '../src/lib/tracking';

/**
 * Prueba de src/lib/tracking.ts -> setProgress (T05), contra una base local
 * descartable — mismo guardrail que scripts/test-flor-feedback.ts: nunca
 * corre contra la base compartida/produccion.
 *
 * Uso: npx tsx scripts/test-progress.ts
 */

async function main() {
  const url = new URL(process.env.DATABASE_URL ?? '');
  assert.equal(url.hostname, '127.0.0.1');
  assert.equal(url.port, '55433');
  assert.equal(url.pathname, '/mundobl_replay');

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

  // 2) Repetir la misma llamada no crea duplicados ni falla.
  const result2 = await prisma.$transaction((tx) =>
    setProgress(tx, user.id, series.id, { upToEpisodeId: ep3.id })
  );
  assert.equal(result2.watched, 3);
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

  console.log(
    JSON.stringify({
      result: 'PASS',
      checks: [
        'upToEpisodeId marca 1..3, serie VIENDO',
        'llamada repetida no duplica',
        'episodio de otra serie -> 404 (ProgressNotFoundError)',
        "direction: 'unmark' respeta 1..3 y limpia 4..8",
        'completeIfAll con el ultimo episodio -> serie VISTA',
      ],
      seriesId: series.id,
      userId: user.id,
    })
  );
}

main().finally(() => prisma.$disconnect());
