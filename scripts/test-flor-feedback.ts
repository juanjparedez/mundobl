import assert from 'node:assert/strict';
import {
  prisma,
  saveSeriesInUniverse,
  getPublicUniverseSeries,
  getUserSeriesStatuses,
} from '../src/lib/database';
import { assertSafePrismaCommand } from './prisma-safety';
import { groupIntoCatalogItems } from '../src/app/(app)/catalogo/catalogGrouping';

async function main() {
  const runId = Date.now();
  const url = new URL(process.env.DATABASE_URL ?? '');
  assert.equal(url.hostname, '127.0.0.1');
  assert.equal(url.port, '55433');
  assert.equal(url.pathname, '/mundobl_replay');
  for (const args of [
    ['migrate', 'dev'],
    ['migrate', 'reset'],
    ['db', 'push'],
  ]) {
    assert.throws(() =>
      assertSafePrismaCommand(args, 'postgresql://user:pass@remote.example/app')
    );
    assert.doesNotThrow(() => assertSafePrismaCommand(args, url.href));
  }
  assert.doesNotThrow(() =>
    assertSafePrismaCommand(
      ['migrate', 'deploy'],
      'postgresql://user:pass@remote.example/app'
    )
  );
  const universe = await prisma.universe.create({
    data: { name: 'Universo de prueba Flor ' + Date.now() },
  });
  const first = await prisma.series.create({
    data: {
      title: 'Historia original',
      type: 'serie',
      year: 2020,
      universeId: universe.id,
    },
  });
  const main = await saveSeriesInUniverse(universe.id, true, (tx) =>
    tx.series.create({
      data: {
        title: 'Historia principal',
        type: 'serie',
        year: 2024,
        universe: { connect: { id: universe.id } },
        isUniverseMain: true,
        soundtrack: 'BSO de prueba',
        country: { create: { name: 'Corea del Sur', code: 'KR' } },
        watchLinks: {
          create: [
            {
              platform: 'Spotify',
              url: 'https://open.spotify.com/',
              official: true,
            },
            {
              platform: 'Doramasflix',
              url: 'https://example.com/doramasflix',
              official: false,
            },
          ],
        },
        seasons: { create: { seasonNumber: 1, episodeCount: 8 } },
      },
    })
  );
  await prisma.series.create({
    data: {
      title: 'Película del universo',
      type: 'pelicula',
      year: 2025,
      universeId: universe.id,
    },
  });
  await prisma.series.create({
    data: {
      title: 'Aporte fuera del catálogo',
      type: 'serie',
      year: 2019,
      universeId: universe.id,
      origin: 'USER_EMBED',
      catalogScope: 'WATCHABLE_ONLY',
    },
  });
  const setMain = (id: number) =>
    saveSeriesInUniverse(universe.id, true, (tx) =>
      tx.series.update({ where: { id }, data: { isUniverseMain: true } })
    );
  await Promise.all([setMain(first.id), setMain(main.id)]);
  assert.equal(
    await prisma.series.count({
      where: { universeId: universe.id, isUniverseMain: true },
    }),
    1
  );
  await setMain(main.id);
  await assert.rejects(
    saveSeriesInUniverse(universe.id, true, (tx) =>
      tx.series.update({ where: { id: -1 }, data: { isUniverseMain: true } })
    )
  );
  assert.equal(
    (await prisma.series.findUniqueOrThrow({ where: { id: main.id } }))
      .isUniverseMain,
    true
  );
  const entries = await getPublicUniverseSeries(universe.id);
  assert.equal(entries.length, 3);
  assert.equal(entries[0].id, main.id);
  assert.equal(entries.filter((s) => s.type === 'serie').length, 2);
  const grouped = groupIntoCatalogItems(
    entries.map((s) => ({
      id: String(s.id),
      titulo: s.title,
      pais: '',
      tipo: s.type,
      temporadas: 1,
      episodios: 8,
      anio: s.year ?? 0,
      rating: null,
      universoId: universe.id,
      universoNombre: universe.name,
      isUniverseMain: s.isUniverseMain,
    }))
  );
  assert.equal(grouped[0].type, 'universe');
  if (grouped[0].type === 'universe')
    assert.equal(grouped[0].series[0].id, String(main.id));
  const user = await prisma.user.create({
    data: {
      id: `flor-local-review-${runId}`,
      name: 'Prueba local',
      email: `flor-review-${runId}@example.test`,
      role: 'ADMIN',
    },
  });
  const other = await prisma.user.create({
    data: { name: 'Otro usuario', email: `other-review-${runId}@example.test` },
  });
  for (let i = 1; i <= 25; i++) {
    const series = await prisma.series.create({
      data: {
        title: `Vista de prueba ${String(i).padStart(2, '0')}`,
        type: 'serie',
        year: 2026,
      },
    });
    await prisma.viewStatus.create({
      data: { userId: user.id, seriesId: series.id, status: 'VISTA' },
    });
  }
  await prisma.viewStatus.createMany({
    data: [
      { userId: user.id, seriesId: first.id, status: 'RETOMAR' },
      { userId: user.id, seriesId: main.id, status: 'ABANDONADA' },
      { userId: other.id, seriesId: main.id, status: 'VISTA' },
    ],
  });
  await prisma.seriesNote.create({
    data: {
      userId: user.id,
      seriesId: main.id,
      body: 'Nota privada de prueba local',
    },
  });
  const statuses = await getUserSeriesStatuses(user.id, true);
  assert.equal(statuses.length, 27);
  assert.equal(
    statuses.find((s) => s.seriesId === main.id)?.status,
    'ABANDONADA'
  );
  assert.equal((await getUserSeriesStatuses(user.id, false)).length, 25);
  console.log(
    JSON.stringify({
      result: 'PASS',
      checks: [
        'remote command guard',
        'one main story under concurrent writes',
        'transaction rollback',
        'public scope',
        'series-only count',
        'catalog cover',
        'user-scoped statuses',
        '25 watched fixtures',
      ],
      mainId: main.id,
      userId: user.id,
    })
  );
}
main().finally(() => prisma.$disconnect());
