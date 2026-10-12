import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
const require = createRequire(import.meta.url);
require('./assert-local-test-database.ts').assertLocalTestDatabase();
const database = require('../src/lib/database.ts');
const { prisma } = database;
const { NextRequest } = require('next/server');
let identity = null,
  consent;
const invalidated = [];
const cache = new Map();
const auth = { auth: async () => (identity ? { user: identity } : null) };
const deps = {
  '@/lib/database': database,
  './database': database,
  './slug': require('../src/lib/slug.ts'),
  './auth': auth,
  '@/lib/auth': auth,
  'next/headers': {
    cookies: async () => ({
      get: () => (consent ? { value: consent } : undefined),
    }),
  },
  'next/cache': {
    revalidatePath: (...args) => invalidated.push(args),
    revalidateTag: (...args) => invalidated.push(args),
  },
  '@/lib/auth-helpers': {
    requireRole: async (roles) =>
      identity && !identity.banned && roles.includes(identity.role)
        ? { authorized: true, userId: identity.id, role: identity.role }
        : {
            authorized: false,
            response: new Response(null, { status: identity ? 403 : 401 }),
          },
  },
};
const sourceModules = {
  './content-consent': 'src/lib/content-consent.ts',
  '@/lib/content-consent': 'src/lib/content-consent.ts',
  '@/lib/content-access': 'src/lib/content-access.ts',
  '@/lib/revalidate-series': 'src/lib/revalidate-series.ts',
};
function load(path) {
  if (cache.has(path)) return cache.get(path);
  const output = ts.transpileModule(readFileSync(path, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const exports = {};
  new Function('require', 'exports', output)(
    (name) =>
      deps[name] ??
      (sourceModules[name] ? load(sourceModules[name]) : require(name)),
    exports
  );
  cache.set(path, exports);
  return exports;
}
const clicks = load('src/app/api/pilot-clicks/route.ts');
const consentRoute = load('src/app/api/content-consent/route.ts');
const classification = load(
  'src/app/api/admin/series/[id]/classification/route.ts'
);
const access = load('src/lib/content-access.ts');
const cookie = load('src/lib/content-consent.ts');
const episodes = load('src/app/api/episodes/route.ts');
const episode = load('src/app/api/episodes/[id]/route.ts');
const season = load('src/app/api/seasons/[id]/route.ts');
const content = load('src/app/api/contenido/route.ts');
const origin = 'http://localhost:3018';
const request = (path, body, headers = {}) =>
  new NextRequest(
    origin + path,
    body === undefined
      ? undefined
      : {
          method: 'POST',
          headers: {
            Origin: origin,
            'Content-Type': 'application/json',
            ...headers,
          },
          body: JSON.stringify(body),
        }
  );
const ctx = (id) => ({ params: Promise.resolve({ id: String(id) }) });
const key = 'editorial-routes-' + Date.now();
const day = new Date(new Date().toISOString().slice(0, 10));
const before = await prisma.pilotClickDaily.findMany({ where: { day } });
process.env.AUTH_SECRET = 'local-route-tests-only';
let s;
try {
  await prisma.user.create({
    data: { id: key, email: key + '@example.test', role: 'ADMIN' },
  });
  s = await prisma.series.create({
    data: {
      title: key,
      type: 'serie',
      contentRating: 'ADULT18',
      seasons: {
        create: {
          seasonNumber: 1,
          episodes: {
            create: {
              episodeNumber: 1,
              embedUrl: 'https://example.test/media',
            },
          },
        },
      },
      watchLinks: {
        create: {
          platform: 'GagaOOLala',
          url: 'https://www.gagaoolala.com/en/videos/123',
        },
      },
    },
    include: { seasons: { include: { episodes: true } }, watchLinks: true },
  });
  const sn = s.seasons[0],
    ep = sn.episodes[0];
  assert.equal((await access.checkSeriesContentAccess(s.id)).status, 403);
  for (const [route, path, context] of [
    [episode, '/episode', ctx(ep.id)],
    [episodes, '/episodes?seasonId=' + sn.id],
    [season, '/season', ctx(sn.id)],
  ]) {
    assert.equal((await route.GET(request(path), context)).status, 403);
  }
  assert.equal(
    (
      await consentRoute.POST(
        request('/consent', { allow: true }, { Origin: 'https://evil.test' })
      )
    ).status,
    403
  );
  assert.equal(
    (await consentRoute.POST(request('/consent', { allow: 'true' }))).status,
    400
  );
  const response = await consentRoute.POST(
    request('/consent', { allow: true })
  );
  assert.equal(response.status, 200);
  const header = response.headers.get('set-cookie');
  assert.match(header, /HttpOnly/i);
  assert.match(header, /SameSite=lax/i);
  assert.match(header, /Max-Age=2592000/i);
  consent = cookie.signContentConsent(
    Date.now() + 10000,
    process.env.AUTH_SECRET
  );
  assert.equal(await access.checkSeriesContentAccess(s.id), null);
  assert.equal(
    (await episode.GET(request('/episode'), ctx(ep.id))).status,
    200
  );
  consent = undefined;
  assert.equal((await access.checkSeriesContentAccess(s.id)).status, 403);
  assert.match(
    (
      await consentRoute.POST(request('/consent', { allow: false }))
    ).headers.get('set-cookie'),
    /Max-Age=0/i
  );
  await prisma.series.update({
    where: { id: s.id },
    data: { visibility: 'HIDDEN' },
  });
  assert.equal((await access.checkSeriesContentAccess(s.id)).status, 404);
  await prisma.series.update({
    where: { id: s.id },
    data: { visibility: 'VISIBLE' },
  });
  assert.deepEqual(
    await (await content.GET(request('/content?seriesId=' + s.id))).json(),
    []
  );
  const count = async () =>
    (await prisma.pilotClickDaily.findMany({ where: { day } })).reduce(
      (n, r) => n + r.clicks,
      0
    );
  const start = await count();
  assert.equal(
    (
      await clicks.POST(
        request(
          '/clicks',
          { placement: 'platforms' },
          { Origin: 'https://evil.test' }
        )
      )
    ).status,
    403
  );
  assert.equal(
    (
      await clicks.POST(
        request('/clicks', { placement: 'series', watchLinkId: -1 })
      )
    ).status,
    400
  );
  for (const role of ['ADMIN', 'MODERATOR', 'COLLABORATOR']) {
    identity = { id: key, role };
    assert.equal(
      (await clicks.POST(request('/clicks', { placement: 'platforms' })))
        .status,
      204
    );
  }
  assert.equal(await count(), start);
  identity = null;
  await Promise.all(
    Array.from({ length: 8 }, () =>
      clicks.POST(
        request('/clicks', {
          placement: 'series',
          watchLinkId: s.watchLinks[0].id,
        })
      )
    )
  );
  assert.equal(await count(), start + 8);
  assert.equal(
    (await classification.PATCH(request('/classification', {}), ctx(s.id)))
      .status,
    401
  );
  identity = { id: key, role: 'ADMIN' };
  const input = {
    rating: 'GENERAL',
    warnings: [],
    source: 'Human decision',
    editVersion: 0,
  };
  assert.equal(
    (await classification.PATCH(request('/classification', input), ctx(s.id)))
      .status,
    200
  );
  assert.equal(
    (await classification.PATCH(request('/classification', input), ctx(s.id)))
      .status,
    409
  );
  assert.ok(
    invalidated.some((args) => args[0] === '/' && args[1] === 'layout')
  );
  console.log(
    'PASS: real route handlers + PostgreSQL: consent/revoke/CSRF, media boundaries, hidden content, roles, atomic clicks and invalidation calls. Request auth/cookies/cache APIs simulated; no HTTP server.'
  );
} finally {
  if (s) {
    await prisma.series.delete({ where: { id: s.id } });
    await prisma.seriesRevision.deleteMany({ where: { seriesId: s.id } });
  }
  await prisma.user.deleteMany({ where: { id: key } });
  await prisma.pilotClickDaily.deleteMany({ where: { day } });
  if (before.length) await prisma.pilotClickDaily.createMany({ data: before });
  await prisma.$disconnect();
}
