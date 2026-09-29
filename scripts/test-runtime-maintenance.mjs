import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const originalFetch = globalThis.fetch;
const originalEnv = { ...process.env };
const now = Date.now();
const old = now - 100 * 86_400_000;
const deployment = (uid, overrides = {}) => ({
  uid,
  url: `${uid.toLowerCase().replace('_', '-')}.vercel.app`,
  created: old,
  state: 'READY',
  target: 'preview',
  ...overrides,
});
const mocks = {};
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
const service = load('src/lib/vercel-maintenance.ts');
let requests;
let aliases;
let rows;
let current;
let details;
let rejectAliases;
let badProject;
let next;
function reset() {
  requests = [];
  aliases = new Set();
  rows = [deployment('dpl_old')];
  current = 'dpl_current';
  details = { ...deployment('dpl_old'), projectId: 'prj_test' };
  rejectAliases = false;
  badProject = false;
  next = null;
}

process.env.MAINTENANCE_VERCEL_TOKEN = 'test-only-token';
process.env.MAINTENANCE_VERCEL_PROJECT_ID = 'prj_test';
process.env.MAINTENANCE_VERCEL_TEAM_ID = 'team_test';
delete process.env.VERCEL_DEPLOYMENT_ID;
globalThis.fetch = async (input, options) => {
  const url = new URL(input);
  requests.push([url, options.method]);
  assert.equal(url.origin, 'https://api.vercel.com');
  assert.equal(url.searchParams.get('teamId'), 'team_test');
  assert.equal(options.headers.Authorization, 'Bearer test-only-token');
  assert.equal(options.cache, 'no-store');
  if (options.method === 'DELETE') return new Response('{}');
  if (url.pathname.startsWith('/v9/projects/'))
    return Response.json({
      id: badProject ? 'prj_other' : 'prj_test',
      targets: { production: { id: current } },
    });
  if (url.pathname === '/v7/deployments') {
    assert.equal(url.searchParams.get('projectId'), 'prj_test');
    const reserved =
      url.searchParams.get('state') === 'READY'
        ? ['dpl_stable1', 'dpl_stable2', 'dpl_stable3']
        : ['dpl_recent1', 'dpl_recent2', 'dpl_recent3'];
    return Response.json({
      deployments:
        url.searchParams.get('limit') === '3'
          ? reserved.map((value) => deployment(value))
          : rows,
      pagination: { next },
    });
  }
  if (url.pathname.endsWith('/aliases')) {
    if (rejectAliases) return new Response('{}', { status: 403 });
    return Response.json({
      aliases: aliases.has(url.pathname.split('/')[3])
        ? [{ alias: 'active.example.com' }]
        : [],
    });
  }
  if (url.pathname.startsWith('/v13/deployments/'))
    return Response.json(details);
  throw new Error(`Unexpected request ${url}`);
};
const noDeletion = () =>
  assert.equal(requests.filter(([, method]) => method === 'DELETE').length, 0);
try {
  reset();
  rows = [
    deployment('dpl_old'),
    deployment('dpl_young', { created: now }),
    deployment('dpl_current'),
    deployment('dpl_stable2'),
    deployment('dpl_recent3'),
    deployment('dpl_alias'),
    deployment('dpl_build', { state: 'BUILDING' }),
    deployment('dpl_custom', { customEnvironment: { slug: 'staging' } }),
    deployment('dpl_badtime', { created: 'bad' }),
  ];
  aliases.add('dpl_alias');
  assert.deepEqual(
    (await service.inspectDeployments('preview')).candidates.map(
      (row) => row.id
    ),
    ['dpl_old']
  );
  noDeletion();

  reset();
  next = now - 50 * 86_400_000;
  const report = await service.inspectDeployments('preview', now - 1);
  assert.equal(report.next, next);
  assert.equal(report.hasMore, true);
  assert(
    requests.some(([url]) => url.searchParams.get('until') === String(now - 1))
  );

  for (const override of [
    { uid: 'dpl_current' },
    { uid: 'dpl_stable1' },
    { uid: 'dpl_recent1' },
    { projectId: 'prj_other' },
    { created: now },
    { target: 'staging' },
    { state: 'BUILDING' },
    { state: 'QUEUED' },
    { state: 'INITIALIZING' },
    { customEnvironment: { slug: 'staging' } },
    { target: 'production', created: now - 40 * 86_400_000 },
  ]) {
    reset();
    details = { ...details, ...override };
    await assert.rejects(service.deleteOldDeployment(details.uid));
    noDeletion();
  }
  reset();
  aliases.add('dpl_old');
  await assert.rejects(service.deleteOldDeployment('dpl_old'));
  noDeletion();
  reset();
  rejectAliases = true;
  await assert.rejects(service.deleteOldDeployment('dpl_old'));
  noDeletion();
  reset();
  badProject = true;
  await assert.rejects(service.deleteOldDeployment('dpl_old'));
  noDeletion();
  reset();
  process.env.VERCEL_DEPLOYMENT_ID = 'dpl_old';
  await assert.rejects(service.deleteOldDeployment('dpl_old'));
  noDeletion();
  delete process.env.VERCEL_DEPLOYMENT_ID;
  reset();
  await service.inspectDeployments('preview');
  current = 'dpl_old'; // Promoted after review: deletion must recheck.
  await assert.rejects(service.deleteOldDeployment('dpl_old'));
  noDeletion();
  for (const target of ['production', null]) {
    reset();
    details.target = target;
    await service.deleteOldDeployment('dpl_old');
    assert.equal(
      requests.filter(([, method]) => method === 'DELETE').length,
      1
    );
    assert.equal(requests.at(-1)[0].pathname, '/v13/deployments/dpl_old');
  }
  reset();
  await assert.rejects(service.deleteOldDeployment('../projects/delete'));
  assert.equal(requests.length, 0);

  let allowed = false;
  let auditFails = false;
  let purgeCalls = 0;
  const audits = [];
  mocks['@/lib/auth-helpers'] = {
    requireRole: async (roles) => {
      assert.deepEqual(roles, ['ADMIN']);
      return allowed
        ? { authorized: true, userId: 'admin' }
        : { authorized: false, response: Response.json({}, { status: 403 }) };
    },
  };
  mocks['@/lib/r2'] = { isR2Configured: () => false };
  mocks['@/lib/access-log'] = {
    runLogRetentionJob: async (deadline, trigger) => {
      assert(deadline > Date.now());
      assert.equal(trigger, 'manual');
      purgeCalls++;
      return { deleted: 5, done: false };
    },
  };
  mocks['@/lib/database'] = {
    recordMaintenanceAction: async (...args) => {
      if (auditFails) throw new Error('Database unavailable');
      audits.push(args);
      return 1;
    },
  };
  mocks['@/lib/vercel-maintenance'] = service;
  const route = load('src/app/api/admin/runtime/maintenance/route.ts');
  const post = (body, origin = 'http://localhost') =>
    new Request('http://localhost/api/admin/runtime/maintenance', {
      method: 'POST',
      headers: { Origin: origin },
      body: JSON.stringify(body),
    });
  assert.equal(
    (await route.GET(new Request('http://localhost/?target=preview'))).status,
    403
  );
  assert.equal((await route.POST(post({ action: 'purgeLogs' }))).status, 403);
  assert.equal(purgeCalls, 0);
  allowed = true;
  assert.equal(
    (await route.POST(post({ action: 'purgeLogs' }, 'https://evil.example')))
      .status,
    403
  );
  assert.equal((await route.POST(post({ action: 'unknown' }))).status, 400);
  assert.equal(
    (await route.POST(post({ action: 'deleteDeployment', deploymentId: 'x' })))
      .status,
    400
  );
  assert.equal(
    (await route.GET(new Request('http://localhost/?target=preview&until=nan')))
      .status,
    400
  );
  assert.equal(
    (
      await route.POST(
        new Request('http://localhost/', {
          method: 'POST',
          headers: { origin: 'http://localhost' },
          body: '{',
        })
      )
    ).status,
    400
  );
  auditFails = true;
  assert.equal(
    (
      await route.POST(
        post({ action: 'deleteDeployment', deploymentId: 'dpl_old' })
      )
    ).status,
    500
  );
  noDeletion();
  auditFails = false;
  const cleanup = await route.POST(post({ action: 'purgeLogs' }));
  assert.equal(cleanup.status, 200);
  assert.deepEqual((await cleanup.json()).result, { deleted: 5, done: false });
  assert.equal(audits.at(-1)[4], 'completed');
  assert.equal(purgeCalls, 1);
  delete process.env.MAINTENANCE_VERCEL_TOKEN;
  const disabled = await route.GET(
    new Request('http://localhost/?target=production')
  );
  assert.equal(disabled.status, 200);
  assert.equal((await disabled.json()).configured, false);
  console.log(
    'Runtime maintenance: protection, pagination, authorization, origin, audit and partial cleanup passed.'
  );
} finally {
  globalThis.fetch = originalFetch;
  for (const key of Object.keys(process.env))
    if (!(key in originalEnv)) delete process.env[key];
  Object.assign(process.env, originalEnv);
}
