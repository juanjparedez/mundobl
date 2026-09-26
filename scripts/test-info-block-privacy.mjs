import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';

// Real GET handler and PostgreSQL; only session resolution is simulated.
const require = createRequire(import.meta.url);
const database = require('../src/lib/database.ts');
require('./assert-local-test-database.ts').assertLocalTestDatabase();
let viewer;
const compiled = ts.transpileModule(
  readFileSync('src/app/api/series/[id]/info-blocks/route.ts', 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } }
).outputText;
const route = {};
new Function('require', 'exports', compiled)((name) => {
  if (name === '@/lib/database') return database;
  if (name === '@/lib/auth-helpers') return {
    requireAuth: async () => viewer
      ? { authorized: true, ...viewer }
      : { authorized: false },
  };
  if (name === '@/lib/collaborator-guard') return {};
  return require(name);
}, route);
const { prisma } = database;
const key = `blocks-${Date.now()}`;
const ids = [];
async function read(id, identity) {
  viewer = identity;
  const response = await route.GET(new Request('http://localhost'), {
    params: Promise.resolve({ id: String(id) }),
  });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  return response.json();
}
try {
  await prisma.user.create({ data: { id: key, email: `${key}@example.invalid` } });
  for (const origin of ['CURATED', 'USER_EMBED']) {
    const series = await prisma.series.create({ data: {
      title: key, type: 'serie', origin, visibility: 'HIDDEN',
      catalogScope: origin === 'CURATED' ? 'PERSONAL' : 'WATCHABLE_ONLY',
      submittedById: key,
      infoBlocks: { create: [
        { label: 'Second', body: 'Hidden editorial text', sortOrder: 2 },
        { label: 'First', body: 'Hidden editorial text', sortOrder: 1 },
      ] },
    } });
    ids.push(series.id);
    for (const identity of [undefined, { userId: key, role: 'USER' },
      { userId: 'another', role: 'COLLABORATOR' }]) {
      assert.deepEqual(await read(series.id, identity), []);
    }
    const owner = { userId: key, role: 'COLLABORATOR' };
    assert.equal((await read(series.id, owner)).length, origin === 'USER_EMBED' ? 2 : 0);
    for (const role of ['ADMIN', 'MODERATOR']) {
      assert.deepEqual((await read(series.id, { userId: key, role })).map(b => b.label), ['First', 'Second']);
    }
    if (origin === 'USER_EMBED') {
      await prisma.series.update({ where: { id: series.id }, data: { catalogScope: 'PERSONAL' } });
      assert.deepEqual(await read(series.id, owner), []);
    }
    await prisma.series.update({ where: { id: series.id }, data: { visibility: 'VISIBLE' } });
    assert.equal((await read(series.id)).length, 2);
    await prisma.series.update({ where: { id: series.id }, data: { visibility: 'HIDDEN' } });
    assert.deepEqual(await read(series.id), []);
  }
  assert.deepEqual(await read(2147483647), []);
  for (const id of ['0', '-1', '1junk', '1.5']) {
    assert.equal((await route.GET(new Request('http://localhost'), {
      params: Promise.resolve({ id }),
    })).status, 400);
  }
  console.log('Info-block privacy: real handler + SQL passed. Session resolution simulated.');
} finally {
  await prisma.series.deleteMany({ where: { id: { in: ids } } });
  await prisma.user.deleteMany({ where: { id: key } });
  await prisma.$disconnect();
}
