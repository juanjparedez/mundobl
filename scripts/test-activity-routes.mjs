import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';

// Rutas reales + SQL real; solo se simula la sesion.
const require = createRequire(import.meta.url);
const database = require('../src/lib/database.ts');
const { assertLocalTestDatabase } = require('./assert-local-test-database.ts');
assertLocalTestDatabase();
let session = null;
const authModule = { auth: async () => session };
const authHelpers = {
  requireAuth: async () =>
    session?.user
      ? { authorized: true, userId: session.user.id, role: session.user.role }
      : { authorized: false, response: Response.json({}, { status: 401 }) },
};
function loadRoute(path) {
  const compiled = ts.transpileModule(readFileSync(path, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const exports = {};
  new Function('require', 'exports', compiled)((name) => {
    if (name === '@/lib/auth') return authModule;
    if (name === '@/lib/auth-helpers') return authHelpers;
    if (name === '@/lib/database') return database;
    if (name.startsWith('@/')) return require(`../src/${name.slice(2)}.ts`);
    return require(name);
  }, exports);
  return exports;
}
const activity = loadRoute('src/app/api/activity/route.ts');
const alias = loadRoute('src/app/api/community/alias/route.ts');
const { NextRequest } = require('next/server');
const { prisma } = database;
const key = `activity-route-${Date.now()}`;

const post = (body, headers = {}) =>
  activity.POST(
    new NextRequest('http://localhost/api/activity', {
      method: 'POST',
      headers: {
        origin: 'http://localhost',
        'content-type': 'application/json',
        'x-vercel-ip-country': 'AR',
        'cf-connecting-ip': key,
        ...headers,
      },
      body: JSON.stringify(body),
    })
  );
const total = async (seriesId, source) =>
  (
    await prisma.seriesActivityDaily.aggregate({
      where: { seriesId, ...(source ? { source } : {}) },
      _sum: { count: true },
    })
  )._sum.count ?? 0;

await prisma.user.create({
  data: { id: key, email: `${key}@example.invalid` },
});
const series = await prisma.series.create({
  data: { title: key, type: 'serie' },
});
const hidden = await prisma.series.create({
  data: { title: `${key} hidden`, type: 'serie', visibility: 'HIDDEN' },
});
try {
  const body = { seriesId: series.id, kind: 'chapter' };
  assert.equal((await post(body)).status, 204);
  assert.equal(
    await total(series.id, 'browser'),
    1,
    'No session counts as browser'
  );
  session = { user: { id: key, role: 'USER' } };
  assert.equal((await post(body)).status, 204);
  assert.equal(
    await total(series.id, 'account'),
    1,
    'The session decides the source'
  );
  // Nada de esto suma.
  assert.equal(
    (await post(body, { origin: 'https://evil.example' })).status,
    403
  );
  assert.equal((await post(body, { 'sec-gpc': '1' })).status, 204);
  assert.equal(
    (await post({ seriesId: series.id, kind: 'rating' })).status,
    400
  );
  assert.equal(
    (await post({ seriesId: hidden.id, kind: 'chapter' })).status,
    400
  );
  session = { user: { id: key, role: 'ADMIN' } };
  assert.equal((await post(body)).status, 204);
  assert.equal(
    await total(series.id),
    2,
    'GPC, staff and bad input are not counted'
  );
  const row = await prisma.seriesActivityDaily.findFirst({
    where: { seriesId: series.id },
  });
  assert.equal(row.country, 'AR');

  // Alias: uno nuevo, distinto, y no dos seguidos.
  session = null;
  assert.equal((await alias.POST()).status, 401);
  session = { user: { id: key, role: 'USER' } };
  const first = await alias.POST();
  assert.equal(first.status, 200);
  const { alias: parts } = await first.json();
  assert.equal(typeof parts.first, 'number');
  const profile = await prisma.communityProfile.findUnique({
    where: { userId: key },
  });
  assert.equal(profile.published, false, 'Changing the alias does not publish');
  assert.equal((await alias.POST()).status, 429);
  console.log('activity routes ok');
} finally {
  await prisma.seriesActivityDaily.deleteMany({
    where: { seriesId: { in: [series.id, hidden.id] } },
  });
  await prisma.series.deleteMany({
    where: { id: { in: [series.id, hidden.id] } },
  });
  await prisma.user.delete({ where: { id: key } });
  await prisma.$disconnect();
}
