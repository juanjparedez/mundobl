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
const reactions = loadRoute('src/app/api/series/[id]/reactions/route.ts');
const pageStats = loadRoute('src/app/api/series/[id]/activity/route.ts');
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

  // Visitas: la ficha y /ver suman; debajo de 5 no se muestran.
  session = null;
  const visit = (kind) =>
    post({ seriesId: series.id, kind }, { 'cf-connecting-ip': `${key}-v` });
  for (let i = 0; i < 2; i += 1)
    assert.equal((await visit('open_ver')).status, 204);
  for (let i = 0; i < 2; i += 1)
    assert.equal((await visit('series_view')).status, 204);
  const stats = async () =>
    (
      await pageStats.GET(new Request('http://localhost'), {
        params: Promise.resolve({ id: String(series.id) }),
      })
    ).json();
  assert.equal((await stats()).views, null, 'Under the minimum stays hidden');
  assert.equal((await visit('series_view')).status, 204);
  assert.equal((await stats()).views, 5, 'series_view + open_ver = visits');

  // Reacciones: suman, restan, nunca bajan de cero, solo claves conocidas.
  const react = (body, { id = series.id, headers = {} } = {}) =>
    reactions.POST(
      new NextRequest(`http://localhost/api/series/${id}/reactions`, {
        method: 'POST',
        headers: {
          origin: 'http://localhost',
          'content-type': 'application/json',
          ...headers,
        },
        body: JSON.stringify(body),
      }),
      { params: Promise.resolve({ id: String(id) }) }
    );
  assert.equal((await react({ reaction: 'fire', active: true })).status, 204);
  assert.equal((await react({ reaction: 'fire', active: true })).status, 204);
  assert.equal((await react({ reaction: 'hot', active: true })).status, 204);
  assert.equal((await react({ reaction: 'hot', active: false })).status, 204);
  assert.equal((await react({ reaction: 'hot', active: false })).status, 204);
  assert.equal(
    (await react({ reaction: 'laugh', active: false })).status,
    204,
    'Removing a reaction nobody made is a no-op'
  );
  assert.deepEqual((await stats()).reactions, { fire: 2 });
  const hotRow = await prisma.seriesReactionCount.findUnique({
    where: { seriesId_reaction: { seriesId: series.id, reaction: 'hot' } },
  });
  assert.equal(hotRow.count, 0, 'Never below zero');
  assert.equal((await react({ reaction: 'poop', active: true })).status, 400);
  assert.equal((await react({ reaction: 'fire', active: 'yes' })).status, 400);
  assert.equal(
    (await react({ reaction: 'fire', active: true }, { id: hidden.id })).status,
    400
  );
  assert.equal(
    (
      await react(
        { reaction: 'fire', active: true },
        { headers: { origin: 'https://evil.example' } }
      )
    ).status,
    403
  );
  session = { user: { id: key, role: 'USER', banned: true } };
  assert.equal((await react({ reaction: 'fire', active: true })).status, 403);
  session = { user: { id: key, role: 'ADMIN' } };
  assert.equal(
    (await react({ reaction: 'fire', active: true })).status,
    204,
    'Staff can react too'
  );
  assert.deepEqual((await stats()).reactions, { fire: 3 });

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
  await prisma.seriesReactionCount.deleteMany({
    where: { seriesId: { in: [series.id, hidden.id] } },
  });
  await prisma.series.deleteMany({
    where: { id: { in: [series.id, hidden.id] } },
  });
  await prisma.user.delete({ where: { id: key } });
  await prisma.$disconnect();
}
