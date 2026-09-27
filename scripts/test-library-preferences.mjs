import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
const require = createRequire(import.meta.url);
const database = require('../src/lib/database.ts');
require('./assert-local-test-database.ts').assertLocalTestDatabase();
let identity = null;
const auth = {
  requireAuth: async () =>
    identity
      ? { authorized: true, userId: identity }
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
    if (name === '@/lib/auth-helpers') return auth;
    if (name.startsWith('@/lib/'))
      return require('../src/lib/' + name.slice(6) + '.ts');
    return require(name);
  }, exports);
  return exports;
}
const preferences = loadRoute('src/app/api/user/watching-preferences/route.ts');
const library = loadRoute('src/app/api/user/library/route.ts');
const active = loadRoute('src/app/api/currently-watching/route.ts');
const { prisma } = database;
const id = 'library-test-' + Date.now();
const other = id + '-other';
const created = [];
const request = (body) =>
  new Request('http://localhost/api/user/watching-preferences', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
try {
  assert.equal((await library.GET()).status, 401);
  assert.equal((await preferences.GET()).status, 401);
  assert.equal(
    (await preferences.PATCH(request({ view: 'grid' }))).status,
    401
  );
  await prisma.user.createMany({
    data: [id, other].map((id) => ({ id, email: id + '@example.invalid' })),
  });
  identity = id;
  assert.deepEqual(await (await preferences.GET()).json(), {
    preferences: null,
  });
  for (const status of [
    'SIN_VER',
    'VIENDO',
    'VISTA',
    'ABANDONADA',
    'RETOMAR',
  ]) {
    const series = await prisma.series.create({
      data: {
        title: id + status,
        type: 'serie',
        observations: 'PRIVATE EDITORIAL',
        seasons: {
          create: {
            seasonNumber: 1,
            episodes: { create: { episodeNumber: 1, title: 'EP.1' } },
          },
        },
      },
      include: { seasons: { include: { episodes: true } } },
    });
    created.push(series.id);
    await prisma.viewStatus.create({
      data: {
        userId: id,
        seriesId: series.id,
        status,
        watchedDate: status === 'VISTA' ? new Date('2020-01-01') : null,
      },
    });
    await prisma.viewStatus.create({
      data: {
        userId: other,
        episodeId: series.seasons[0].episodes[0].id,
        status: 'VISTA',
      },
    });
  }
  const response = await library.GET();
  assert.equal(response.headers.get('cache-control'), 'no-store');
  const items = await response.json();
  assert.equal(items.length, 5);
  assert.ok(
    items.every(
      (item) => item.series.seasons[0].episodes[0].viewStatus.length === 0
    )
  );
  assert.ok(!JSON.stringify(items).includes('PRIVATE EDITORIAL'));
  assert.equal((await (await active.GET()).json()).length, 2);
  let saved = await (
    await preferences.POST(
      request({ view: 'grid', sort: 'name', pinned: [created[0]] })
    )
  ).json();
  assert.equal(saved.preferences.view, 'grid');
  saved = await (
    await preferences.POST(
      request({ view: 'list', sort: 'recent', pinned: [] })
    )
  ).json();
  assert.equal(
    saved.preferences.view,
    'grid',
    'second device must not overwrite initial preferences'
  );
  assert.equal(
    (await preferences.POST(request({ view: 'bogus' }))).status,
    400
  );
  assert.equal(
    (await preferences.PATCH(request({ view: 'list', userId: other }))).status,
    400
  );
  const changes = await Promise.all([
    preferences.PATCH(request({ pin: { id: created[1], pinned: true } })),
    preferences.PATCH(request({ pin: { id: created[2], pinned: true } })),
    preferences.PATCH(request({ sort: 'remaining' })),
  ]);
  assert.ok(changes.every((r) => r.status === 200));
  const result = await database.getWatchingPreferences(id);
  assert.deepEqual([...result.pinned].sort(), created.slice(0, 3).sort());
  assert.equal(result.sort, 'remaining');
  identity = other;
  assert.equal(
    (await (await library.GET()).json()).length,
    0,
    'episode marks alone do not create a series library entry'
  );
  assert.deepEqual(await (await preferences.GET()).json(), {
    preferences: null,
  });
  saved = await (
    await preferences.PATCH(request({ pin: { id: created[0], pinned: true } }))
  ).json();
  assert.deepEqual(
    saved.preferences.pinned,
    [],
    'cannot pin another account library'
  );
  assert.equal(
    (
      await prisma.viewStatus.findUnique({
        where: { userId_seriesId: { userId: id, seriesId: created[2] } },
      })
    ).watchedDate.toISOString(),
    '2020-01-01T00:00:00.000Z'
  );

  const { Prisma } = require('../src/generated/prisma');
  await prisma.user.update({
    where: { id: other },
    data: { watchingPreferences: Prisma.DbNull },
  });
  identity = id;
  const exportRoute = loadRoute('src/app/api/user/account/export/route.ts');
  const exported = await (await exportRoute.GET()).json();
  assert.deepEqual(
    exported.watchingPreferences,
    await database.getWatchingPreferences(id)
  );
  const preview = await database.restoreTrackingBackup(other, exported, true);
  assert.equal(preview.imported.watchingPreferences, 1);
  assert.equal(await database.getWatchingPreferences(other), null);
  const restored = await database.restoreTrackingBackup(other, exported, false);
  assert.equal(restored.imported.watchingPreferences, 1);
  assert.deepEqual(
    await database.getWatchingPreferences(other),
    exported.watchingPreferences
  );
  const repeated = await database.restoreTrackingBackup(
    other,
    { watchingPreferences: { view: 'list', sort: 'recent', pinned: [] } },
    false
  );
  assert.equal(repeated.skipped.watchingPreferences, 1);
  assert.deepEqual(
    await database.getWatchingPreferences(other),
    exported.watchingPreferences
  );
  const invalid = await database.restoreTrackingBackup(
    other,
    { watchingPreferences: { view: 'invalid', userId: id } },
    true
  );
  assert.equal(invalid.imported.watchingPreferences, 0);
  assert.ok(
    invalid.errors.includes('watchingPreferences: invalid preferences')
  );
  console.log(
    'PASS: personal export, preview without writes, restoration with series marks, idempotence and invalid preference rejection.'
  );
  console.log(
    'PASS: all five statuses, legacy active API, private DTO, per-account preferences, bootstrap once, malformed/forged inputs, concurrent device changes and preserved watch dates. SQL real; session mocked.'
  );
} finally {
  await prisma.series.deleteMany({ where: { id: { in: created } } });
  await prisma.user.deleteMany({ where: { id: { in: [id, other] } } });
  await prisma.$disconnect();
}
