import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
const require = createRequire(import.meta.url);
require('./assert-local-test-database.ts').assertLocalTestDatabase();
const db = require('../src/lib/database.ts');
const input = require('../src/lib/support-input.ts');
let actor = null;
const invalidations = [];
const compiled = ts.transpileModule(
  readFileSync('src/app/api/admin/patrocinio/route.ts', 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } }
).outputText;
const route = {};
new Function('require', 'exports', compiled)((name) => {
  if (name === '@/lib/auth-helpers')
    return {
      requireRole: async () =>
        actor
          ? { authorized: true, userId: actor, role: 'ADMIN' }
          : { authorized: false, response: Response.json({}, { status: 401 }) },
    };
  if (name === '@/lib/database') return db;
  if (name === '@/lib/support-input') return input;
  if (name === '@/lib/support-public') return { SUPPORT_TAG: 'support-public' };
  if (name === 'next/cache')
    return {
      revalidateTag: (...args) => invalidations.push(args),
      revalidatePath: (...args) => invalidations.push(args),
    };
  return require(name);
}, route);
const owner = 'support-route-' + Date.now(),
  other = owner + '-other';
process.env.ADMIN_EMAILS = owner + '@example.test';
const request = (body, origin = 'http://localhost') =>
  new Request('http://localhost/api/admin/patrocinio', {
    method: 'PATCH',
    headers: { origin },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
try {
  assert.equal(await db.prisma.supportSettings.count(), 0);
  await db.prisma.user.createMany({
    data: [owner, other].map((id) => ({
      id,
      email: id + '@example.test',
      role: 'ADMIN',
    })),
  });
  assert.equal((await route.GET()).status, 401);
  actor = other;
  assert.equal((await route.GET()).status, 403);
  actor = owner;
  let response = await route.GET();
  assert.equal(response.status, 200);
  assert.match(response.headers.get('cache-control'), /no-store/);
  assert.equal(
    (await route.PATCH(request('{}', 'https://other.test'))).status,
    403
  );
  assert.equal((await route.PATCH(request('{'))).status, 400);
  let state = await response.json();
  const content = {
    intro: 'Public',
    purpose: 'Infra',
    thanks: 'Gracias',
    methods: [
      {
        kind: 'link',
        enabled: true,
        label: 'Link',
        url: 'https://example.test',
        alias: 'private stale alias',
        holder: 'private stale holder',
        bank: '',
        currency: '',
      },
    ],
  };
  response = await route.PATCH(
    request({ action: 'save', version: state.version, content })
  );
  assert.equal(response.status, 200);
  state = await response.json();
  assert.equal(invalidations.length, 0);
  response = await route.PATCH(
    request({ action: 'publish', version: state.version })
  );
  assert.equal(response.status, 200);
  state = await response.json();
  assert.deepEqual(invalidations, [
    ['support-public', { expire: 0 }],
    ['/', 'layout'],
  ]);
  assert.equal((await db.getSupportPublic()).methods[0].holder, '');
  response = await route.PATCH(
    request({
      action: 'save',
      version: state.version,
      content: { ...content, intro: 'PRIVATE' },
    })
  );
  state = await response.json();
  assert.equal((await db.getSupportPublic()).intro, 'Public');
  assert.equal(
    (await route.PATCH(request({ action: 'publish', version: 0 }))).status,
    409
  );
  response = await route.PATCH(
    request({ action: 'hide', version: state.version })
  );
  assert.equal(response.status, 200);
  assert.equal(await db.getSupportPublic(), null);
  assert.equal(invalidations.length, 4);
  console.log(
    'PASS route + SQL: authentication seam, fresh owner permission, CSRF, validation, conflict, private response, snapshots, immediate invalidation calls. Next cache runtime is not simulated.'
  );
} finally {
  await db.prisma.supportSettings.deleteMany();
  await db.prisma.user.deleteMany({ where: { id: { in: [owner, other] } } });
  await db.prisma.$disconnect();
}
