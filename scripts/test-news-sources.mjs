import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { XMLParser } from 'fast-xml-parser';
function load(path, mocks = {}) {
  const code = ts.transpileModule(readFileSync(path, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const exports = {};
  new Function('require', 'exports', code)((n) => {
    if (!(n in mocks)) throw Error(n);
    return mocks[n];
  }, exports);
  return exports;
}
const policy = load('src/lib/news-source-policy.ts');
assert(policy.newsSourcePauseReason('https://www.twitter.com/BLUPDATE2022'));
assert.equal(
  policy.newsSourcePauseReason('https://twitter.com.example.org/'),
  null
);
let sites = [];
let response = '<html>not a feed</html>';
let fetched = 0;
const realFetch = globalThis.fetch;
globalThis.fetch = async () => {
  fetched++;
  return new Response(response);
};
const { ingestNews } = load('src/lib/news-ingest.ts', {
  'fast-xml-parser': { XMLParser },
  './news-source-policy': policy,
  './database': {
    prisma: {
      recommendedSite: { findMany: async () => sites },
      series: { findMany: async () => [] },
      news: { findMany: async () => [] },
    },
  },
  './official-channels': { OFFICIAL_CHANNELS: [] },
  './channel-fetcher': {},
  './channel-sweep': { titleTokens: (s) => s.split(' ') },
  './cron-runs': {},
  './news-translation': {
    translateNewsToSpanish: () => {
      throw Error('must not translate in dry run');
    },
  },
  './news-topics': { isSeriesTrailer: () => true },
});
try {
  sites = [{ name: 'BLUPDATE', url: 'https://twitter.com/BLUPDATE2022' }];
  let r = await ingestNews({ dryRun: true });
  assert.equal(fetched, 0);
  assert.equal(r.skippedSources.length, 1);
  assert.equal(r.sources, 0);
  sites = [{ name: 'Broken', url: 'https://example.org' }];
  await assert.rejects(ingestNews({ dryRun: true }), /No news source/);
  response = '<rss><channel><title>Empty valid feed</title></channel></rss>';
  r = await ingestNews({ dryRun: true });
  assert.equal(r.failedSources, 0);
  assert.equal(r.candidates, 0);
  response =
    '<feed xmlns="http://www.w3.org/2005/Atom"><title>Empty Atom</title></feed>';
  r = await ingestNews({ dryRun: true });
  assert.equal(r.failedSources, 0);
  sites = [
    { name: 'Invalid URL', url: 'not a url' },
    { name: 'Good', url: 'https://example.org' },
  ];
  r = await ingestNews({ dryRun: true });
  assert.equal(r.failedSources, 1);
  assert.equal(r.sources, 2);
  console.log('News source policy and feed validation passed');
} finally {
  globalThis.fetch = realFetch;
}
