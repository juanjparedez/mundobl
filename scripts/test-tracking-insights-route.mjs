import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const { assertLocalTestDatabase } = require('./assert-local-test-database.ts');
assertLocalTestDatabase();
const database = require('../src/lib/database.ts');
const { prisma } = database;
let owner = null;
const compiled = ts.transpileModule(
  readFileSync('src/app/api/user/tracking-stats/route.ts', 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } }
).outputText;
const route = {};
new Function('require', 'exports', compiled)((name) => {
  if (name === '@/lib/auth-helpers')
    return {
      requireAuth: async () =>
        owner
          ? { authorized: true, userId: owner }
          : { authorized: false, response: Response.json({}, { status: 401 }) },
    };
  if (name === '@/lib/database') return database;
  return require(name);
}, route);
const { NextRequest } = require('next/server');
const request = (query) =>
  new NextRequest(`http://localhost/api/user/tracking-stats?${query}`);
const key = `insights-${Date.now()}`;
const other = `${key}-other`;
let seriesId;
try {
  assert.equal((await route.GET(request('days=7'))).status, 401);
  await prisma.user.createMany({
    data: [key, other].map((id) => ({ id, email: `${id}@example.invalid` })),
  });
  const series = await prisma.series.create({
    data: {
      title: key,
      type: 'serie',
      seasons: {
        create: {
          seasonNumber: 1,
          episodes: {
            create: [
              { episodeNumber: 1, title: 'EP.1 [1/2]', duration: 10 },
              { episodeNumber: 2, title: 'EP.1 [2/2]', duration: 10 },
            ],
          },
        },
      },
    },
    include: { seasons: { include: { episodes: true } } },
  });
  seriesId = series.id;
  const [a, b] = series.seasons[0].episodes.sort(
    (a, b) => a.episodeNumber - b.episodeNumber
  );
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  await prisma.viewStatus.createMany({
    data: [
      { userId: key, episodeId: a.id, status: 'VISTA', watchedDate: today },
      { userId: other, episodeId: b.id, status: 'VISTA', watchedDate: today },
      { userId: other, seriesId, status: 'VISTA', watchedDate: today },
      { userId: key, seriesId, status: 'VISTA', watchedDate: null },
    ],
  });
  owner = key;
  assert.equal((await route.GET(request('days=10000'))).status, 400);
  const response = await route.GET(request(`days=7&userId=${other}`));
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  const first = await response.json();
  assert.equal(
    first.current.chapters,
    0,
    'Other account must not complete a missing sibling'
  );
  assert.equal(first.current.minutes, 10);
  assert.equal(first.current.series, 0);
  assert.equal(first.unknownDates, 1);
  assert.equal(
    'episodes' in first.rows[0],
    false,
    'Only aggregates leave the API'
  );
  await prisma.viewStatus.create({
    data: { userId: key, episodeId: b.id, status: 'VISTA', watchedDate: today },
  });
  assert.equal(
    (await (await route.GET(request('days=7'))).json()).current.chapters,
    1
  );
  owner = other;
  const second = await (await route.GET(request('days=7'))).json();
  assert.equal(second.current.chapters, 0);
  assert.equal(second.current.series, 1);
  console.log(
    'PASS: authenticated route, account isolation, full sibling query, query validation, private cache and aggregate-only response.'
  );
} finally {
  if (seriesId) await prisma.series.delete({ where: { id: seriesId } });
  await prisma.user.deleteMany({ where: { id: { in: [key, other] } } });
  await prisma.$disconnect();
}
