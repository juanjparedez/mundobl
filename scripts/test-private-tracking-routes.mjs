import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';

// Real route implementations + real SQL; only session resolution is simulated.
const require = createRequire(import.meta.url);
const database = require('../src/lib/database.ts');
const watchDate = require('../src/lib/watch-date.ts');
const backup = require('../src/lib/tracking-backup.ts');
const { assertLocalTestDatabase } = require('./assert-local-test-database.ts');
assertLocalTestDatabase();
let identity = null;
const auth = {
  requireAuth: async () =>
    identity
      ? { authorized: true, userId: identity }
      : { authorized: false, response: Response.json({}, { status: 401 }) },
};
function loadRoute(path) {
  const source = readFileSync(path, 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const exports = {};
  new Function('require', 'exports', compiled)((name) => {
    if (name === '@/lib/auth-helpers') return auth;
    if (name === '@/lib/database') return database;
    if (name === '@/lib/watch-date') return watchDate;
    if (name === '@/lib/tracking-backup') return backup;
    return require(name);
  }, exports);
  return exports;
}
const dates = loadRoute('src/app/api/user/watch-date/route.ts');
const history = loadRoute('src/app/api/user/tracking-history/route.ts');
const { NextRequest } = require('next/server');
const key = `route-owner-${Date.now()}`;
const other = `${key}-other`;
const { prisma } = database;
const request = (path, body) =>
  new NextRequest(
    `http://localhost${path}`,
    body === undefined
      ? undefined
      : {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
  );
try {
  await prisma.user.createMany({
    data: [key, other].map((id) => ({ id, email: `${id}@example.invalid` })),
  });
  const series = await prisma.series.create({
    data: { title: key, type: 'serie' },
  });
  try {
    const original = new Date('2020-01-01T00:00:00.000Z');
    await prisma.viewStatus.create({
      data: {
        userId: key,
        seriesId: series.id,
        status: 'VISTA',
        watchedDate: original,
      },
    });
    const edit = {
      seriesId: series.id,
      watchedDate: '2021-01-01',
      expectedDate: original.toISOString(),
      userId: other,
    };
    assert.equal(
      (await dates.GET(request(`/api/user/watch-date?seriesId=${series.id}`)))
        .status,
      401
    );
    assert.equal(
      (await dates.PATCH(request('/api/user/watch-date', edit))).status,
      401
    );
    assert.equal((await history.DELETE()).status, 401);
    identity = other;
    assert.equal(
      (
        await dates.GET(
          request(`/api/user/watch-date?seriesId=${series.id}&userId=${key}`)
        )
      ).status,
      404
    );
    assert.equal(
      (
        await dates.PATCH(
          request('/api/user/watch-date', { ...edit, userId: key })
        )
      ).status,
      409
    );
    assert.equal(
      (
        await (
          await history.GET(request(`/api/user/tracking-history?userId=${key}`))
        ).json()
      ).items.length,
      0
    );
    await history.DELETE();
    assert.equal(
      await prisma.trackingEvent.count({ where: { userId: key } }),
      1
    );
    identity = key;
    const saved = await dates.PATCH(request('/api/user/watch-date', edit));
    assert.equal(saved.status, 200);
    assert.match(saved.headers.get('Cache-Control'), /private, no-store/);
    assert.equal(
      (await dates.PATCH(request('/api/user/watch-date', edit))).status,
      409
    );
    assert.equal(
      (
        await dates.PATCH(
          request('/api/user/watch-date', {
            ...edit,
            watchedDate: '2021-02-29',
          })
        )
      ).status,
      400
    );
    const read = await dates.GET(
      request(`/api/user/watch-date?seriesId=${series.id}`)
    );
    assert.deepEqual(await read.json(), {
      watchedDate: '2021-01-01T00:00:00.000Z',
    });
    const events = await (
      await history.GET(request('/api/user/tracking-history'))
    ).json();
    assert.equal(events.items.length, 2);
    assert.ok(events.items.some((event) => event.kind === 'DATE_CHANGED'));
    await history.DELETE();
    assert.equal(
      await prisma.trackingEvent.count({ where: { userId: key } }),
      0
    );
    assert.equal(
      await prisma.viewStatus.count({
        where: { userId: key, status: 'VISTA' },
      }),
      1
    );
    console.log(
      'PASS: real date/history handlers with native SQL reject unauthenticated/cross-account access, ignore forged ownership, protect stale dates and preserve progress on history deletion. Session resolution simulated.'
    );
  } finally {
    await prisma.series.delete({ where: { id: series.id } });
  }
} finally {
  await prisma.user.deleteMany({ where: { id: { in: [key, other] } } });
  await prisma.$disconnect();
}
