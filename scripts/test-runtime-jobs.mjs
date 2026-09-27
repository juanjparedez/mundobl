import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
const require = createRequire(import.meta.url);
require('./assert-local-test-database.ts').assertLocalTestDatabase();
const db = require('../src/lib/database.ts');
let calls = [];
let failNews = false;
let blockNews = null;
let allowed = false;
let invalidated = 0;
const mocks = {
  './database': db,
  './playability-audit': {
    runPlayabilityJob: async (trigger) => {
      calls.push(['playability', trigger]);
      return { probed: 2, scanned: 2 };
    },
  },
  './news-ingest': {
    runNewsIngestJob: async (trigger) => {
      calls.push(['news', trigger]);
      if (blockNews) await blockNews;
      if (failNews) throw new Error('source unavailable');
      return { created: 1 };
    },
  },
  './access-log': {
    runLogRetentionJob: async (deadline, trigger) => {
      assert(deadline > Date.now());
      calls.push(['logs', trigger]);
      return { deleted: 0 };
    },
  },
  '@/lib/auth-helpers': {
    requireRole: async (roles) => {
      assert.deepEqual(roles, ['ADMIN']);
      return allowed
        ? { authorized: true }
        : { authorized: false, response: Response.json({}, { status: 403 }) };
    },
  },
  '@/lib/revalidate-series': { revalidateSeriesListings: () => invalidated++ },
};
function load(path) {
  const code = ts.transpileModule(readFileSync(path, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const exports = {};
  new Function('require', 'exports', code)(
    (name) => mocks[name] ?? require(name),
    exports
  );
  return exports;
}
const jobs = load('src/lib/runtime-jobs.ts');
mocks['@/lib/runtime-jobs'] = jobs;
const route = load('src/app/api/admin/runtime/run/route.ts');
const cron = load('src/app/api/cron/daily/route.ts');
const req = (body) =>
  new Request('http://localhost/run', {
    method: 'POST',
    body: JSON.stringify(body),
  });
try {
  assert.equal((await route.POST(req({ job: 'news' }))).status, 403);
  assert.equal(calls.length, 0);
  allowed = true;
  assert.equal((await route.POST(req({ job: 'bogus' }))).status, 400);
  assert.equal(
    (
      await route.POST(
        new Request('http://localhost/run', { method: 'POST', body: '{' })
      )
    ).status,
    400
  );
  assert.equal((await route.POST(req({ job: 'news' }))).status, 200);
  assert.deepEqual(calls, [['news', 'manual']]);
  assert.equal(invalidated, 0);
  calls = [];
  const daily = await jobs.runRuntimeJob('daily', 'schedule');
  assert.equal(daily.ok, true);
  assert.deepEqual(calls, [
    ['playability', 'schedule'],
    ['news', 'schedule'],
    ['logs', 'schedule'],
  ]);
  calls = [];
  failNews = true;
  const partial = await jobs.runRuntimeJob('daily', 'manual');
  assert.equal(partial.ok, false);
  assert.deepEqual(partial.failed, ['news']);
  assert.deepEqual(partial.completed, ['playability', 'logs']);
  failNews = false;
  let release;
  blockNews = new Promise((r) => (release = r));
  calls = [];
  const running = jobs.runRuntimeJob('news', 'manual');
  for (let i = 0; i < 100 && !calls.length; i++)
    await new Promise((r) => setTimeout(r, 10));
  assert.equal(calls.length, 1);
  assert.equal((await route.POST(req({ job: 'news' }))).status, 409);
  release();
  await running;
  blockNews = null;
  assert.equal((await route.POST(req({ job: 'playability' }))).status, 200);
  assert.equal(invalidated, 1);
  const saved = process.env.CRON_SECRET;
  delete process.env.CRON_SECRET;
  assert.equal((await cron.GET(new Request('http://localhost'))).status, 503);
  process.env.CRON_SECRET = 'test-only-secret';
  assert.equal((await cron.GET(new Request('http://localhost'))).status, 401);
  calls = [];
  assert.equal(
    (
      await cron.GET(
        new Request('http://localhost', {
          headers: { authorization: 'Bearer test-only-secret' },
        })
      )
    ).status,
    200
  );
  assert(calls.every((c) => c[1] === 'schedule'));
  if (saved === undefined) delete process.env.CRON_SECRET;
  else process.env.CRON_SECRET = saved;
  console.log(
    'PASS: auth, validation, selected jobs, daily orchestration, partial failure, real PostgreSQL concurrent lock and release, cache invalidation.'
  );
} finally {
  await db.prisma.$disconnect();
}
