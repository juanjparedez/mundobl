import assert from 'node:assert/strict';
import { prisma } from '../src/lib/database';
import { setEpisodesWatched } from '../src/lib/tracking';
import {
  importLocalProgress,
  parseLocalImport,
} from '../src/lib/local-progress-import';
import {
  getPublicSeriesActivity,
  getSiteChapterActivity,
} from '../src/lib/series-activity-stats';
import { utcDay } from '../src/lib/series-activity';
import { getProducerReport } from '../src/lib/producer-report';
import { getSeriesSummaries } from '../src/lib/series-summaries';
import { buildLocalLibraryItem } from '../src/lib/local-library';
import {
  ALIAS_WORD_COUNT,
  aliasParts,
  aliasSeedFor,
  distinctAliasParts,
  formatAlias,
  nextAliasSeed,
} from '../src/lib/community-alias';
import { getMonthlyRanking } from '../src/lib/community-ranking';
import { loadLocaleMessages } from '../src/i18n/messages';
import { SUPPORTED_LOCALES } from '../src/i18n/config';
import { assertLocalTestDatabase } from './assert-local-test-database';

// local-progress usa localStorage: un navegador minimo alcanza.
function installFakeWindow() {
  const store = new Map<string, string>();
  const target = new EventTarget();
  Object.assign(globalThis, {
    window: Object.assign(target, {
      localStorage: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => store.set(key, value),
        removeItem: (key: string) => store.delete(key),
      },
    }),
    StorageEvent: class extends Event {
      key: string | null;
      constructor(type: string, init: { key?: string } = {}) {
        super(type);
        this.key = init.key ?? null;
      }
    },
  });
  return store;
}

async function testLocalProgressStore() {
  const store = installFakeWindow();
  const local = await import('../src/lib/local-progress');
  // v1 se sigue leyendo.
  store.set(
    'mundobl.localProgress',
    JSON.stringify({ v: 1, series: { '7': { episodeIds: [3, 1] } } })
  );
  assert.deepEqual(local.getLocalSeriesProgress(7).episodeIds, [3, 1]);
  assert.equal(
    local.localSeriesStatus(local.getLocalSeriesProgress(7)),
    'VIENDO'
  );

  local.setLocalSeriesIntent(8, 'QUIERO_VER');
  assert.equal(
    local.localSeriesStatus(local.getLocalSeriesProgress(8)),
    'QUIERO_VER'
  );
  // Ver un capitulo saca de "Quiero verla", como en la cuenta.
  local.setLocalEpisodesWatched(8, [11], true);
  assert.equal(
    local.localSeriesStatus(local.getLocalSeriesProgress(8)),
    'VIENDO'
  );
  // Vista y Abandonada se mantienen.
  local.setLocalSeriesIntent(8, 'VISTA');
  local.setLocalEpisodesWatched(8, [12], true);
  assert.equal(local.getLocalSeriesProgress(8).intent, 'VISTA');
  assert.equal(JSON.parse(store.get('mundobl.localProgress') ?? '').v, 2);
  // Sin capitulos ni intencion la entrada desaparece.
  local.setLocalSeriesIntent(9, 'QUIERO_VER');
  local.setLocalSeriesIntent(9, null);
  assert.equal(
    local.listLocalProgress().some(({ seriesId }) => seriesId === 9),
    false
  );
}

async function testAliases() {
  const seed = aliasSeedFor('user-a');
  assert.equal(seed, aliasSeedFor('user-a'), 'Alias is stable');
  assert.equal(aliasSeedFor('user-a', 5), 5, 'Stored seed wins');
  const parts = aliasParts(seed);
  assert.ok(parts.first < ALIAS_WORD_COUNT && parts.second < ALIAS_WORD_COUNT);
  assert.notDeepEqual(aliasParts(nextAliasSeed(seed, () => 0)), parts);
  const distinct = distinctAliasParts([3, 3, 3 + ALIAS_WORD_COUNT ** 2]);
  assert.equal(
    new Set(distinct.map((p) => `${p.first}:${p.second}`)).size,
    3,
    'No two people share an alias in one list'
  );
  for (const locale of SUPPORTED_LOCALES) {
    const { communityAlias } = await loadLocaleMessages(locale);
    for (const list of [communityAlias.firstWords, communityAlias.secondWords])
      assert.equal(list.split('|').length, ALIAS_WORD_COUNT, locale);
    assert.ok(communityAlias.template.includes('{first}'), locale);
    assert.ok(communityAlias.template.includes('{second}'), locale);
  }
  const es = (await loadLocaleMessages('es')).communityAlias;
  assert.equal(
    formatAlias(
      { first: 0, second: 2 },
      { first: es.firstWords, second: es.secondWords, template: es.template }
    ),
    'Luna de Medianoche'
  );
}

async function main() {
  assertLocalTestDatabase();
  await testLocalProgressStore();
  await testAliases();

  const key = `redesign-${Date.now()}`;
  const user = await prisma.user.create({
    data: { id: key, email: `${key}@example.invalid` },
  });
  const series = await prisma.series.create({
    data: {
      title: `${key} serie`,
      type: 'serie',
      seasons: {
        create: {
          seasonNumber: 1,
          episodes: {
            create: [1, 2, 3].map((episodeNumber) => ({
              episodeNumber,
              embedUrl: `https://www.youtube.com/embed/${key}${episodeNumber}`,
              embedChannelName: `${key} channel`,
            })),
          },
        },
      },
    },
    include: { seasons: { include: { episodes: true } } },
  });
  const other = await prisma.series.create({
    data: { title: `${key} otra`, type: 'serie' },
  });
  const episodes = series.seasons[0].episodes.sort(
    (a, b) => a.episodeNumber - b.episodeNumber
  );
  const status = async (seriesId: number) =>
    (
      await prisma.viewStatus.findUnique({
        where: { userId_seriesId: { userId: user.id, seriesId } },
      })
    )?.status;

  try {
    // Quiero verla pasa a Viendo al marcar un capitulo.
    await prisma.viewStatus.create({
      data: { userId: user.id, seriesId: series.id, status: 'QUIERO_VER' },
    });
    await prisma.$transaction((tx) =>
      setEpisodesWatched(tx, user.id, series.id, [episodes[0].id], true)
    );
    assert.equal(await status(series.id), 'VIENDO');

    // Importar lo del navegador: union de capitulos, nunca pisa el estado.
    assert.equal(parseLocalImport({ items: [] }), null);
    assert.equal(
      parseLocalImport({ items: [{ seriesId: 1, episodeIds: ['x'] }] }),
      null
    );
    const result = await importLocalProgress(user.id, [
      { seriesId: series.id, episodeIds: [episodes[1].id], intent: 'VISTA' },
      { seriesId: other.id, episodeIds: [], intent: 'QUIERO_VER' },
      { seriesId: 999_999_999, episodeIds: [1] },
    ]);
    assert.deepEqual(result.failed, []);
    assert.equal(await status(series.id), 'VIENDO', 'Account status wins');
    assert.equal(
      await prisma.viewStatus.count({
        where: {
          userId: user.id,
          episodeId: { in: [episodes[0].id, episodes[1].id] },
          status: 'VISTA',
        },
      }),
      2,
      'Episodes are merged'
    );
    assert.equal(await status(other.id), 'QUIERO_VER', 'Intent fills a gap');

    // Contador publico: con menos de 5 no se muestra.
    const today = utcDay();
    const bump = (count: number, source: string, kind = 'chapter') =>
      prisma.seriesActivityDaily.upsert({
        where: {
          day_seriesId_kind_source_country: {
            day: today,
            seriesId: series.id,
            kind,
            source,
            country: 'AR',
          },
        },
        create: {
          day: today,
          seriesId: series.id,
          kind,
          source,
          country: 'AR',
          count,
        },
        update: { count },
      });
    await bump(3, 'browser');
    assert.equal(await getPublicSeriesActivity(series.id), null);
    await bump(4, 'account');
    assert.equal(await getPublicSeriesActivity(series.id), 7);
    const site = await getSiteChapterActivity(7);
    assert.ok(site.browser >= 3 && site.total >= 7);

    const report = await getProducerReport(30);
    const row = report.series.find((item) => item.seriesId === series.id);
    assert.equal(row?.chapters, 7);
    assert.equal(row?.channel, `${key} channel`);
    assert.equal(row?.trackers, 1);
    assert.ok(
      report.channels.some((item) => item.channel === `${key} channel`)
    );

    // Lista sin cuenta: proximo capitulo y link a /ver en ese capitulo.
    const [summary] = await getSeriesSummaries([series.id]);
    const item = buildLocalLibraryItem(summary, {
      episodeIds: [episodes[0].id],
      updatedAt: 1,
    });
    assert.equal(item.watched, 1);
    assert.equal(item.total, 3);
    assert.equal(item.next?.episodeNumber, 2);
    assert.match(item.nextHref, /^\/ver\/\d+-.+\?e=1x2$/);

    // Ranking: quien no publico su perfil aparece con alias, no con nombre.
    const ranking = await getMonthlyRanking();
    assert.ok(ranking.length > 0);
    assert.ok(
      ranking.every((entry) => (entry.name ? !entry.alias : entry.alias))
    );
  } finally {
    await prisma.seriesActivityDaily.deleteMany({
      where: { seriesId: { in: [series.id, other.id] } },
    });
    await prisma.series.deleteMany({
      where: { id: { in: [series.id, other.id] } },
    });
    await prisma.user.delete({ where: { id: user.id } });
  }
  console.log('tracking redesign ok');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
