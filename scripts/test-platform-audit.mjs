import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const { parseEpisodeSource } = require('../src/lib/episode-platforms.ts');
const { isPlayableIn } = require('../src/lib/playability.ts');
const episode = (id, platform, url, videoId, playback) => ({
  id,
  embedPlatform: platform,
  embedUrl: url,
  embedVideoId: videoId,
  playback,
  playbackBlockedMarkets: [],
  durationSeconds: 733,
  season: { series: { id: id * 10, title: `Fixture ${id}` } },
});
const episodes = [
  episode(
    1,
    'Vimeo',
    'https://vimeo.com/129009162',
    '129009162',
    'NOT_EMBEDDABLE'
  ),
  episode(
    2,
    'Dailymotion',
    'https://www.dailymotion.com/video/xabc123',
    'xabc123',
    'OK'
  ),
  episode(3, 'Vimeo', 'https://evil.test/129009162', '129009162', 'OK'),
];
const writes = [];
const invalidated = [];
let listings = 0;
const mocks = {
  './database': {
    prisma: {
      episode: {
        findMany: async ({ where }) => {
          if (where.embedPlatform) {
            assert.ok(where.embedPlatform.in.includes('Vimeo'));
            assert.ok(where.embedPlatform.in.includes('Dailymotion'));
            return episodes;
          }
          return episodes
            .filter((e) =>
              where.season.seriesId.in.includes(e.season.series.id)
            )
            .map((e) => ({
              ...e,
              ...writes.find((w) => w.where.id === e.id)?.data,
              season: { seriesId: e.season.series.id },
            }));
        },
        update: async (write) => {
          writes.push(write);
        },
      },
      series: { updateMany: async () => ({ count: 0 }) },
    },
  },
  './channel-fetcher': { CORE_MARKETS: ['AR', 'ES'] },
  './playability': { API_BATCH_SIZE: 50, isPlayableIn },
  './episode-platforms': { parseEpisodeSource },
  './watchable': { WATCHABLE_EPISODE_WHERE: {} },
  './external-episode-source': {
    probeExternalEpisode: async (source) => ({
      videoId: source.videoId,
      status: source.platform === 'Vimeo' ? 'OK' : 'UNKNOWN',
      blockedMarkets: [],
      durationSeconds: source.platform === 'Vimeo' ? 733 : null,
      detail: source.platform === 'Vimeo' ? null : 'unavailable',
    }),
  },
  './revalidate-series': {
    revalidateSeriesDetail: (series) => invalidated.push(series.id),
    revalidateSeriesListings: () => {
      listings++;
    },
  },
  './cron-runs': {},
};
const source = ts.transpileModule(
  readFileSync('src/lib/playability-audit.ts', 'utf8'),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }
).outputText;
const module = { exports: {} };
new Function('require', 'exports', 'module', source)(
  (name) => {
    assert.ok(name in mocks, `Unexpected dependency ${name}`);
    return mocks[name];
  },
  module.exports,
  module
);
const result = await module.exports.runPlayabilityAudit();
assert.equal(result.probed, 3);
assert.equal(result.changed, 2);
assert.equal(result.seriesRecalculated, 2);
assert.equal(writes.find((w) => w.where.id === 1).data.playback, 'OK');
assert.deepEqual(Object.keys(writes.find((w) => w.where.id === 2).data), [
  'playbackCheckedAt',
]);
assert.equal(
  writes.find((w) => w.where.id === 3).data.playback,
  'NOT_EMBEDDABLE'
);
assert.deepEqual(invalidated.sort(), [10, 30]);
assert.equal(listings, 1);
console.log(
  'PASS: external audit, transient failures preserve availability, hostile URL rejected, changed details/listings invalidated. Dependencies simulated.'
);
