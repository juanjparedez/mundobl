import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { createRequire } from 'node:module';

// Execute real route handlers with an in-memory boundary. No network or database.
const require = createRequire(import.meta.url);
const calls = [];
const lookups = [];
let role = 'COLLABORATOR';
let ownershipChanged = false;
let series = {
  id: 7,
  title: 'Contribution',
  origin: 'USER_EMBED',
  catalogScope: 'WATCHABLE_ONLY',
  submittedById: 'owner',
};
const catalog = {
  countries: [{ id: 1, code: 'th' }],
  actors: [{ id: 2, name: 'Known Actor' }],
  tags: [{ id: 3, name: 'Friendship' }],
  genres: [{ id: 4, name: 'GL' }],
  productionCompanies: [{ id: 5, name: 'Known Studio' }],
  languages: [{ id: 6, name: 'Thai' }],
};
const auth = () =>
  role === 'SIGNED_OUT'
    ? { authorized: false, response: Response.json({}, { status: 401 }) }
    : { authorized: true, role, userId: 'owner' };
const write =
  (operation, result = {}) =>
  async (args) => {
    calls.push({ operation, args });
    return { ...result, ...args.data };
  };
const prisma = {
  series: {
    findUnique: async () => series,
    findUniqueOrThrow: async () => series,
    findFirst: async () => null,
    create: write('series.create', { id: 7 }),
    update: async (args) => {
      if (ownershipChanged) {
        calls.push({ operation: 'series.update.rejected', args });
        throw Object.assign(new Error('No row matches the write predicate'), {
          code: 'P2025',
        });
      }
      return write('series.update', { id: 7 })(args);
    },
  },
  episode: { findFirst: async () => null, create: write('episode.create') },
  season: { create: write('season.create', { id: 10 }) },
  viewStatus: { upsert: write('viewStatus.upsert') },
  seriesRevision: { create: write('seriesRevision.create') },
  $transaction: async (fn) => {
    calls.push({ operation: 'transaction' });
    return fn(prisma);
  },
};
for (const entity of [
  'seriesActor',
  'seriesTag',
  'seriesGenre',
  'seriesDubbing',
]) {
  prisma[entity] = {
    create: write(`${entity}.create`),
    deleteMany: write(`${entity}.deleteMany`),
  };
}
globalThis.__contributionHarness = {
  prisma,
  auth,
  catalog,
  search: async (kind, search) => {
    lookups.push({ kind, search });
    return ['Known Actor'];
  },
};
const stubs = {
  '@/lib/database': `export const prisma = globalThis.__contributionHarness.prisma;
    export const getContributionMetadata = async input => globalThis.__contributionHarness.resolve(input, globalThis.__contributionHarness.catalog);
    export const searchContributionMetadata = (...args) => globalThis.__contributionHarness.search(...args);
    export const prepareUniverseSlot = async () => {};
    export const resolveBasedOnValue = async value => value;`,
  '@/lib/auth-helpers': `import { NextResponse } from 'next/server';
    export const requireAuth = async () => globalThis.__contributionHarness.auth();
    export const requireRole = async roles => {
      const auth = await requireAuth();
      return roles.includes(auth.role) ? auth : { authorized: false, response: NextResponse.json({}, { status: 403 }) };
    };`,
  '@/lib/revalidate-series': 'export const revalidateSeriesDetail = () => {};',
  'next/cache': 'export const revalidatePath = () => {};',
  '@/lib/rate-limit':
    'export const checkUserEmbedRateLimit = async () => ({ ok: true });',
  '@/lib/official-content-guard': `export const ONLY_YOUTUBE_ERROR = 'YouTube only';
    export const checkOfficialYouTubeVideos = async ids => ({ ok: true, infos: new Map(ids.map(id => [id, { channelTitle: 'Verified', channelUrl: 'https://www.youtube.com/@official' }])) });`,
  '@/lib/user-embed-preview': `export const ALLOWED_COUNTRY_CODES = ['TH']; export const SUPPORTED_EMBED_PLATFORMS = ['YouTube'];`,
};
const built = await build({
  stdin: {
    contents: `
    export { PATCH } from './src/app/api/colaborador/series/[id]/route';
    export { POST } from './src/app/api/user/series/embed/confirm/route';
    export { GET as METADATA_GET } from './src/app/api/contribution-metadata/route';
    export { resolveContributionMetadata, unresolvedContributionNames } from './src/lib/contribution-metadata';
    export { canManageContribution } from './src/lib/contribution-permissions';`,
    resolveDir: process.cwd(),
    loader: 'ts',
  },
  bundle: true,
  platform: 'node',
  format: 'cjs',
  packages: 'external',
  write: false,
  plugins: [
    {
      name: 'test-boundaries',
      setup(builder) {
        builder.onResolve({ filter: /.*/ }, (args) => {
          // collaborator-guard uses a relative import of the same database module.
          const key = args.path === './database' ? '@/lib/database' : args.path;
          if (key in stubs) return { path: key, namespace: 'test-stub' };
        });
        builder.onLoad({ filter: /.*/, namespace: 'test-stub' }, (args) => ({
          contents: stubs[args.path],
          loader: 'js',
          resolveDir: process.cwd(),
        }));
      },
    },
  ],
});
const module = { exports: {} };
new Function('require', 'module', 'exports', built.outputFiles[0].text)(
  require,
  module,
  module.exports
);
const api = module.exports;
globalThis.__contributionHarness.resolve = api.resolveContributionMetadata;
const input = {
  countryCode: 'TH',
  actorNames: [' Known Actor ', 'known actor'],
  tagNames: ['friendship'],
  genreNames: ['gl'],
  productionCompanyName: 'known studio',
  originalLanguageName: 'Thai',
  dubbingLanguageNames: ['Thai', 'thai'],
};
assert.deepEqual(api.resolveContributionMetadata(input, catalog), {
  ok: true,
  data: {
    countryId: 1,
    actorIds: [2],
    tagIds: [3],
    genreIds: [4],
    productionCompanyId: 5,
    originalLanguageId: 6,
    dubbingLanguageIds: [6],
  },
});
assert.deepEqual(
  api.resolveContributionMetadata({ actorNames: ['Unknown'] }, catalog),
  { ok: false, unresolvedNames: ['Unknown'] }
);
assert.equal(
  api.resolveContributionMetadata(input, {
    ...catalog,
    actors: [...catalog.actors, { id: 99, name: 'known actor' }],
  }).ok,
  false
);
assert.equal(
  api.resolveContributionMetadata({ countryCode: 'XX' }, catalog).ok,
  false
);
assert.equal(api.resolveContributionMetadata({}, catalog).ok, true);
assert.equal(
  api.unresolvedContributionNames({
    code: 'EDITORIAL_METADATA_REQUIRED',
    unresolvedNames: [4],
  }),
  null
);
for (const testRole of ['VISITOR', 'COLLABORATOR', 'ADMIN', 'MODERATOR']) {
  assert.equal(
    api.canManageContribution({ role: testRole, userId: 'owner' }, series),
    testRole !== 'VISITOR'
  );
}
const request = (body) =>
  new Request('http://localhost/api/test', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
const patch = (body) =>
  api.PATCH(request(body), { params: Promise.resolve({ id: '7' }) });
const publicBody = {
  url: 'https://www.youtube.com/watch?v=abcdefghijk',
  series: { title: 'Test', type: 'serie', ...input },
  episode: { episodeNumber: 1 },
};

for (const changes of [
  { submittedById: 'someone-else' },
  { origin: 'CURATED' },
  { catalogScope: 'PERSONAL' },
]) {
  const original = series;
  series = { ...series, ...changes };
  assert.equal((await patch({ title: 'Forbidden' })).status, 403);
  assert.equal(calls.length, 0);
  series = original;
}
assert.equal(
  (await patch({ title: 'Keep original', actorNames: ['Unknown'] })).status,
  422
);
assert.equal(
  calls.length,
  0,
  'Unresolved metadata must reject before every mutation'
);
assert.equal(
  (
    await patch({
      title: 'Updated',
      ...input,
      origin: 'CURATED',
      catalogScope: 'PERSONAL',
      featured: true,
      review: 'Injected',
      submittedById: 'someone-else',
    })
  ).status,
  200
);
const update = calls.find((call) => call.operation === 'series.update').args;
assert.deepEqual(update.where, {
  id: 7,
  origin: 'USER_EMBED',
  catalogScope: 'WATCHABLE_ONLY',
  submittedById: 'owner',
});
for (const field of [
  'origin',
  'catalogScope',
  'featured',
  'review',
  'submittedById',
])
  assert.equal(field in update.data, false);
assert.equal(calls[0].operation, 'transaction');
// Cada guardado deja la foto previa y sube la version de la ficha.
const revision = calls.find(
  (call) => call.operation === 'seriesRevision.create'
);
assert.equal(revision.args.data.source, 'collaborator');
assert.equal(revision.args.data.userId, 'owner');
assert.deepEqual(update.data.editVersion, { increment: 1 });
assert.equal(
  calls.find((call) => call.operation === 'seriesActor.create').args.data
    .actorId,
  2
);
calls.length = 0;
assert.equal((await patch({ tagNames: [] })).status, 200);
assert.ok(
  calls.find((call) => call.operation === 'series.update').args.data
    .updatedAt instanceof Date
);
assert.equal(
  calls.findIndex((call) => call.operation === 'series.update') <
    calls.findIndex((call) => call.operation === 'seriesTag.deleteMany'),
  true
);
calls.length = 0;
ownershipChanged = true;
assert.equal((await patch({ tagNames: [] })).status, 403);
assert.deepEqual(
  calls.map((call) => call.operation),
  ['transaction', 'series.update.rejected']
);
ownershipChanged = false;
calls.length = 0;
role = 'VISITOR';
assert.equal((await patch({ title: 'Forbidden' })).status, 403);
assert.equal(calls.length, 0);
assert.equal(
  (
    await api.POST(
      request({
        ...publicBody,
        series: { ...publicBody.series, productionCompanyName: 'New Studio' },
      })
    )
  ).status,
  422
);
assert.equal(calls.length, 0);
assert.equal((await api.POST(request(publicBody))).status, 201);
assert.equal(calls[0].operation, 'transaction');
const created = calls.find((call) => call.operation === 'series.create').args
  .data;
assert.equal(created.origin, 'USER_EMBED');
assert.equal(created.catalogScope, 'WATCHABLE_ONLY');
assert.equal(created.visibility, 'PENDING_REVIEW');
assert.equal(created.submittedById, 'owner');
assert.equal(
  calls.filter((call) => call.operation === 'seriesActor.create').length,
  1
);
assert.equal(
  calls.find((call) => call.operation === 'episode.create').args.data
    .embedChannelName,
  'Verified'
);
assert.equal(
  calls.some((call) =>
    /^(actor|tag|genre|productionCompany|country|language)\./.test(
      call.operation
    )
  ),
  false
);
const { NextRequest } = require('next/server');
const lookup = (query) =>
  api.METADATA_GET(
    new NextRequest(`http://localhost/api/contribution-metadata?${query}`)
  );
assert.equal((await lookup('kind=users')).status, 400);
assert.equal((await lookup(`kind=actors&q=${'x'.repeat(101)}`)).status, 400);
assert.equal(lookups.length, 0);
const namesResponse = await lookup('kind=actors&q=%20Known%20');
assert.equal(namesResponse.status, 200);
assert.deepEqual(await namesResponse.json(), { names: ['Known Actor'] });
assert.equal(namesResponse.headers.get('cache-control'), 'private, no-store');
assert.deepEqual(lookups, [{ kind: 'actors', search: 'Known' }]);
role = 'SIGNED_OUT';
assert.equal((await lookup('kind=actors')).status, 401);
assert.equal(lookups.length, 1);
delete globalThis.__contributionHarness;
console.log(
  'PASS: existing references, ambiguous names, role/ownership/scope, ignored editorial fields, no mutations on rejected metadata, transactional contribution creation. Route dependencies simulated; no real PostgreSQL verification.'
);
