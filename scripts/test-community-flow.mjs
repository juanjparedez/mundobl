import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { createServer } from 'node:http';
import { chromium } from 'playwright';
import { mkdir, readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import ts from 'typescript';
const require = createRequire(import.meta.url);
const db = require('../src/lib/database.ts');
require('./assert-local-test-database.ts').assertLocalTestDatabase();
const { prisma } = db;
const key = `community-http-${Date.now()}`;
const notifications = [];
let identity = null;
const identities = {
  owner: { id: key, name: 'Lector', role: 'VISITOR' },
  other: { id: `${key}-other`, name: 'Otra persona', role: 'VISITOR' },
  admin: { id: `${key}-admin`, name: 'Moderación', role: 'ADMIN' },
};
const auth = {
  requireRole: async (roles) =>
    identity && roles.includes(identity.role)
      ? { authorized: true, userId: identity.id, role: identity.role }
      : { authorized: false, response: Response.json({}, { status: 403 }) },
  requireAuth: async () =>
    identity
      ? { authorized: true, userId: identity.id, role: identity.role }
      : { authorized: false, response: Response.json({}, { status: 401 }) },
};
async function loadRoute(file) {
  const source = await readFile(file, 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const exports = {};
  new Function('require', 'exports', compiled)((name) => {
    if (name === '@/lib/auth-helpers') return auth;
    if (name === '@/lib/notifications')
      return { notifyUser: async (value) => notifications.push(value) };
    return require(name.startsWith('@/') ? `../src/${name.slice(2)}.ts` : name);
  }, exports);
  return exports;
}
const routes = {
  topics: await loadRoute('src/app/api/community/topics/route.ts'),
  series: await loadRoute('src/app/api/community/series/route.ts'),
  topic: await loadRoute('src/app/api/community/topics/[id]/route.ts'),
  replies: await loadRoute(
    'src/app/api/community/topics/[id]/replies/route.ts'
  ),
  follow: await loadRoute('src/app/api/community/topics/[id]/follow/route.ts'),
  recommendations: await loadRoute(
    'src/app/api/community/recommendations/route.ts'
  ),
  reports: await loadRoute('src/app/api/community/reports/route.ts'),
  blocks: await loadRoute('src/app/api/community/blocks/route.ts'),
  moderation: await loadRoute('src/app/api/admin/community/route.ts'),
};
const bundle = await build({
  stdin: {
    contents: `
    import React from 'react'; import {createRoot} from 'react-dom/client';
    import {App} from 'antd';
    import {LocaleProvider} from './src/lib/providers/LocaleProvider';
    import {ThemeProvider} from './src/lib/providers/ThemeProvider';
    import {CommunityFeed} from './src/app/(app)/comunidad/CommunityFeed/CommunityFeed';
    import {CommunityThread} from './src/app/(app)/comunidad/[id]/CommunityThread/CommunityThread';
    import {PersonalCommunityTopics} from './src/components/community/PersonalCommunityTopics/PersonalCommunityTopics';
    import {CommunityModeration} from './src/components/community/CommunityModeration/CommunityModeration';
    import './src/styles/variables.css';
    const data=window.fixture;
    createRoot(document.getElementById('root')).render(<LocaleProvider><ThemeProvider><App>{data.moderation ? <CommunityModeration {...data.moderation}/> : data.personal ? <PersonalCommunityTopics {...data.personal}/> : data.topic ? <CommunityThread topic={data.topic} page={data.page}/> : <CommunityFeed {...data.feed}/>}</App></ThemeProvider></LocaleProvider>);
  `,
    resolveDir: process.cwd(),
    loader: 'tsx',
  },
  plugins: [
    {
      name: 'framework-test-adapters',
      setup(b) {
        b.onResolve(
          { filter: /^(next\/navigation|next-auth\/react)$/ },
          (args) => ({ path: args.path, namespace: 'fixture' })
        );
        b.onLoad({ filter: /.*/, namespace: 'fixture' }, (args) => ({
          contents:
            args.path === 'next/navigation'
              ? 'export const useRouter=()=>({push:href=>location.assign(href),refresh:()=>{}});'
              : 'export const useSession=()=>({data:window.fixture.session?{user:window.fixture.session}:null}); export const signIn=()=>{window.loginRequested=true;};',
          loader: 'js',
        }));
      },
    },
  ],
  bundle: true,
  write: false,
  outdir: 'test-results/community-flow',
  platform: 'browser',
  jsx: 'automatic',
  define: { 'process.env.NODE_ENV': '"production"', 'process.env': '{}' },
});
const js = bundle.outputFiles.find((f) => f.path.endsWith('.js')).text;
const css = bundle.outputFiles.find((f) => f.path.endsWith('.css')).text;
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://127.0.0.1');
    if (url.pathname === '/bundle.js' || url.pathname === '/bundle.css') {
      res.setHeader(
        'Content-Type',
        url.pathname.endsWith('.js') ? 'text/javascript' : 'text/css'
      );
      res.end(url.pathname.endsWith('.js') ? js : css);
      return;
    }
    identity =
      identities[
        /fixture=(owner|other|admin)/.exec(req.headers.cookie ?? '')?.[1]
      ] ?? null;
    const topicMatch =
      /^\/api\/community\/topics\/(\d+)(\/replies|\/follow)?$/.exec(
        url.pathname
      );
    if (url.pathname.startsWith('/api/')) {
      const handler = topicMatch
        ? routes[topicMatch[2]?.slice(1) ?? 'topic'][req.method]
        : url.pathname === '/api/admin/community'
          ? routes.moderation[req.method]
          : url.pathname === '/api/community/reports'
            ? routes.reports[req.method]
            : url.pathname === '/api/community/blocks'
              ? routes.blocks[req.method]
              : routes[
                  url.pathname.endsWith('/recommendations')
                    ? 'recommendations'
                    : url.pathname.endsWith('/series')
                      ? 'series'
                      : 'topics'
                ][req.method];
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const body = Buffer.concat(chunks).toString();
      const request = new Request(url.href, {
        method: req.method,
        headers: { 'Content-Type': 'application/json' },
        ...(body ? { body } : {}),
      });
      const response = await handler(request, {
        params: Promise.resolve({ id: topicMatch?.[1] }),
      });
      res.writeHead(response.status, Object.fromEntries(response.headers));
      res.end(await response.text());
      return;
    }
    const match = /^\/comunidad\/(\d+)$/.exec(url.pathname);
    const page = Number(url.searchParams.get('page') ?? 1);
    const view = url.searchParams.get('view') ?? 'all';
    const resolved = url.searchParams.get('resolved') === 'true';
    const moderation =
      url.pathname === '/admin/comunidad' && identity?.role === 'ADMIN'
        ? {
            initial: await db.getCommunityModerationQueue(
              identity.id,
              page,
              resolved
            ),
            settings: await db.getCommunitySettings(),
            canConfigure: true,
            page,
            resolved,
          }
        : null;
    const personal =
      url.pathname === '/comunidad/mis-conversaciones' && identity
        ? {
            ...(await db.getPersonalCommunityTopics(
              identity.id,
              view === 'all' ? 'own' : view,
              page
            )),
            view: view === 'all' ? 'own' : view,
            page,
          }
        : null;
    const search = url.searchParams.get('q') ?? '';
    const workMatch = /^\/comunidad\/obras\/(\d+)$/.exec(url.pathname);
    const episodeId = url.searchParams.has('episodeId')
      ? Number(url.searchParams.get('episodeId'))
      : undefined;
    const workContext = workMatch
      ? await db.getCommunityConversationContext(
          Number(workMatch[1]),
          episodeId
        )
      : null;
    const topic = match
      ? await db.getCommunityTopic(Number(match[1]), page, identity?.id)
      : null;
    if (match && !topic) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    const reviews = await db.getCommunityReviews(
      view === 'reviews' ? page : 1,
      search
    );
    const topics = await db.getCommunityTopics(
      page,
      search,
      personal || view === 'reviews' ? 'all' : view,
      identity?.id,
      workContext ? { seriesId: workContext.series.id, episodeId } : undefined
    );
    const fixture = {
      session: identity,
      moderation,
      personal,
      topic,
      page,
      feed: {
        metrics:
          !workContext && !personal && !moderation
            ? await db.getCommunityMetrics(identity?.id)
            : undefined,
        context: workContext
          ? { series: workContext.series, episodeId }
          : undefined,
        items: reviews.items,
        topics: topics.items,
        view,
        page,
        search,
        hasNext: view === 'reviews' ? reviews.hasNext : topics.hasNext,
      },
    };
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(
      `<!doctype html><html data-theme="dark"><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/bundle.css"><style>*{box-sizing:border-box}body{margin:0;background:var(--bg-base);color:var(--text-primary);font-family:Arial,sans-serif}a{color:var(--primary-color)}</style></head><body><div id="root"></div><script>window.fixture=${JSON.stringify(fixture).replaceAll('<', '\\u003c')}</script><script src="/bundle.js"></script></body></html>`
    );
  } catch (error) {
    console.error(error);
    res.writeHead(500);
    res.end('Test harness error');
  }
});
let browser;
let page;
const errors = [];
let series;
try {
  await prisma.user.createMany({
    data: Object.values(identities).map((user) => ({
      id: user.id,
      name: `${user.name} Apellido`,
      nickname: user.name,
      email: `${user.id}@example.invalid`,
      role: user.role,
    })),
  });
  series = await prisma.series.create({
    data: {
      title: key,
      type: 'serie',
      imageUrl: null,
      seasons: {
        create: {
          seasonNumber: 1,
          episodes: { create: { episodeNumber: 2, title: 'Segundo capítulo' } },
        },
      },
    },
    include: { seasons: { include: { episodes: true } } },
  });
  await prisma.review.create({
    data: {
      userId: key,
      seriesId: series.id,
      title: 'Una historia que vale la pena',
      body: 'Una reseña pública con un adelanto interesante y sin spoilers.',
      publishedAt: new Date(),
    },
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ headless: true });
  page = await browser.newPage({ locale: 'es-AR' });
  page.on('pageerror', (e) => errors.push(e.message));
  const login = async (user) => {
    await page.context().clearCookies();
    if (user)
      await page
        .context()
        .addCookies([{ name: 'fixture', value: user, url: base }]);
  };
  const api = (path, method, data) =>
    page.request.fetch(`${base}${path}`, {
      method,
      ...(data === undefined ? {} : { data }),
    });
  assert.equal((await api('/api/community/topics', 'POST', {})).status(), 401);
  await page.goto(base + '/comunidad');
  await page
    .getByRole('button', { name: 'Pedir recomendaciones', exact: true })
    .click();
  assert.equal(await page.evaluate(() => window.loginRequested), true);
  await login('owner');
  await page.reload();
  await page
    .getByRole('button', { name: 'Conversar sobre una serie', exact: true })
    .click();
  const modal = page.getByRole('dialog');
  await modal
    .getByRole('combobox', { name: 'Serie o película', exact: true })
    .fill(key);
  await page.getByTitle(key, { exact: true }).last().click();
  await modal
    .getByRole('combobox', { name: 'Capítulo (opcional)', exact: true })
    .click();
  await page
    .getByTitle('Temporada 1 · Capítulo 2 · Segundo capítulo', { exact: true })
    .click();
  await modal
    .getByRole('textbox', { name: 'Título', exact: true })
    .fill('Hablemos del segundo capítulo');
  await modal
    .getByRole('textbox', { name: 'Tu mensaje', exact: true })
    .fill('Este es el inicio de una conversación sobre el capítulo.');
  await modal
    .getByRole('button', { name: 'Guardar borrador', exact: true })
    .click();
  await page.waitForURL(/\/comunidad\/\d+$/);
  const topicId = Number(page.url().split('/').pop());
  assert.equal(
    (await prisma.communityTopic.findUnique({ where: { id: topicId } }))
      .visibility,
    'PRIVATE'
  );
  await login('other');
  assert.equal(
    (await api(`/api/community/topics/${topicId}`, 'GET')).status(),
    404
  );
  await login('owner');
  await page.getByRole('button', { name: 'Editar', exact: true }).click();
  await modal
    .getByRole('textbox', { name: 'Tu mensaje', exact: true })
    .fill('Este borrador fue editado antes de publicarlo.');
  await modal.getByRole('button', { name: 'Guardar', exact: true }).click();
  await page.waitForLoadState('networkidle');
  assert.equal(
    (await prisma.communityTopic.findUnique({ where: { id: topicId } })).body,
    'Este borrador fue editado antes de publicarlo.'
  );
  await page.getByRole('button', { name: 'Publicar', exact: true }).click();
  await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().endsWith(`/api/community/topics/${topicId}`) &&
        response.request().method() === 'PATCH'
    ),
    page
      .locator('.ant-popconfirm')
      .getByRole('button', { name: 'Publicar', exact: true })
      .click(),
  ]);
  await page.waitForLoadState('networkidle');
  assert.equal(
    (await prisma.communityTopic.findUnique({ where: { id: topicId } }))
      .visibility,
    'PUBLIC'
  );
  assert.equal(
    (await prisma.communityTopic.findUnique({ where: { id: topicId } }))
      .episodeId,
    series.seasons[0].episodes[0].id
  );
  await page
    .getByRole('button', { name: 'Mostrar spoilers', exact: true })
    .click();
  await page
    .getByRole('heading', {
      name: 'Hablemos del segundo capítulo',
      exact: true,
    })
    .waitFor();
  await page
    .getByRole('button', { name: 'Seguir conversación', exact: true })
    .click();
  await page
    .getByRole('switch', { name: 'Avisarme de nuevas respuestas', exact: true })
    .waitFor();
  assert.equal(
    (
      await prisma.communityFollow.findUnique({
        where: { userId_topicId: { userId: key, topicId } },
      })
    ).notify,
    false
  );
  await page
    .getByRole('switch', { name: 'Avisarme de nuevas respuestas', exact: true })
    .click();
  await page.waitForLoadState('networkidle');
  assert.equal(
    (
      await prisma.communityFollow.findUnique({
        where: { userId_topicId: { userId: key, topicId } },
      })
    ).notify,
    true
  );
  await login('other');
  await page.reload();
  assert.equal(
    (await api(`/api/community/topics/${topicId}`, 'DELETE')).status(),
    404
  );
  await page
    .getByRole('button', { name: 'Mostrar spoilers', exact: true })
    .click();
  await page
    .getByRole('textbox', { name: 'Responder', exact: true })
    .fill('Esta es una respuesta publicada desde el navegador.');
  await page
    .getByRole('combobox', {
      name: 'Recomendar una obra (opcional)',
      exact: true,
    })
    .fill(key);
  await page.getByTitle(key, { exact: true }).last().click();
  await page.getByRole('button', { name: 'Responder', exact: true }).click();
  await page.waitForLoadState('networkidle');
  if (
    await page
      .getByRole('button', { name: 'Mostrar spoilers', exact: true })
      .count()
  )
    await page
      .getByRole('button', { name: 'Mostrar spoilers', exact: true })
      .click();
  await page
    .getByText('Esta es una respuesta publicada desde el navegador.', {
      exact: true,
    })
    .waitFor();
  assert.equal(await prisma.communityReply.count({ where: { topicId } }), 1);
  assert.equal(notifications[0]?.userId, key);
  await page
    .getByRole('button', { name: 'Guardar para ver', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Guardada en pendientes', exact: true })
    .waitFor();
  assert.equal(
    (
      await prisma.viewStatus.findFirstOrThrow({
        where: { userId: identities.other.id, seriesId: series.id },
      })
    ).status,
    'SIN_VER'
  );
  await login('owner');
  await page.goto(base + '/comunidad/mis-conversaciones?view=following');
  await page.getByText('Respuestas nuevas', { exact: true }).waitFor();
  await page.goto(base + `/comunidad/${topicId}`);
  await page
    .getByRole('button', { name: 'Marcar esta página como leída', exact: true })
    .click();
  await page.waitForLoadState('networkidle');
  await page.goto(base + '/comunidad/mis-conversaciones?view=following');
  assert.equal(
    await page.getByText('Respuestas nuevas', { exact: true }).count(),
    0
  );
  assert.equal(
    (
      await api(`/api/community/topics/${topicId}`, 'PATCH', { closed: true })
    ).status(),
    200
  );
  assert.equal(
    (
      await api(`/api/community/topics/${topicId}/replies`, 'POST', {
        body: 'No debe publicarse.',
      })
    ).status(),
    409
  );
  assert.equal(
    (
      await api(`/api/community/topics/${topicId}`, 'PATCH', { closed: false })
    ).status(),
    200
  );
  for (const [label, title, needsSeries] of [
    ['Pedir una reseña', '¿Quién recomienda esta serie?', true],
    ['Pedir recomendaciones', 'Busco una historia alegre para ver', false],
  ]) {
    await page.goto(base + '/comunidad');
    await page.getByRole('button', { name: label, exact: true }).click();
    if (needsSeries) {
      await modal
        .getByRole('combobox', { name: 'Serie o película', exact: true })
        .fill(key);
      await page.getByTitle(key, { exact: true }).last().click();
    }
    await modal
      .getByRole('textbox', { name: 'Título', exact: true })
      .fill(title);
    await modal
      .getByRole('textbox', { name: 'Tu mensaje', exact: true })
      .fill('Me gustaría conocer sus recomendaciones para este fin de semana.');
    await modal
      .getByRole('button', { name: 'Guardar borrador', exact: true })
      .click();
    await page.waitForURL(/\/comunidad\/\d+$/);
    await page.getByRole('heading', { name: title, exact: true }).waitFor();
    await page.getByRole('button', { name: 'Publicar', exact: true }).click();
    await Promise.all([
      page.waitForResponse(
        (response) =>
          /\/api\/community\/topics\/\d+$/.test(response.url()) &&
          response.request().method() === 'PATCH'
      ),
      page
        .locator('.ant-popconfirm')
        .getByRole('button', { name: 'Publicar', exact: true })
        .click(),
    ]);
    await page.waitForLoadState('networkidle');
    if (needsSeries)
      assert.match(
        await page
          .getByRole('link', { name: 'Escribir una reseña', exact: true })
          .getAttribute('href'),
        /\?review=new#series-section-reviews$/
      );
  }
  await mkdir('test-results', { recursive: true });
  await page.goto(
    base +
      `/comunidad/obras/${series.id}?episodeId=${series.seasons[0].episodes[0].id}`
  );
  await page
    .getByRole('button', { name: 'Conversar sobre una serie', exact: true })
    .click();
  await modal
    .getByRole('textbox', { name: 'Título', exact: true })
    .fill('Una conversación desde el capítulo');
  await modal
    .getByRole('textbox', { name: 'Tu mensaje', exact: true })
    .fill('El capítulo ya viene seleccionado desde la ficha de la obra.');
  await modal
    .getByRole('button', { name: 'Guardar borrador', exact: true })
    .click();
  await page.waitForURL(/\/comunidad\/\d+$/);
  const contextDraft = await prisma.communityTopic.findUniqueOrThrow({
    where: { id: Number(page.url().split('/').pop()) },
  });
  assert.equal(contextDraft.seriesId, series.id);
  assert.equal(contextDraft.episodeId, series.seasons[0].episodes[0].id);
  assert.equal(contextDraft.visibility, 'PRIVATE');
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of [
      '/comunidad',
      `/comunidad/${topicId}`,
      '/comunidad/mis-conversaciones?view=own',
    ]) {
      await page.goto(base + path);
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1
        ),
        `${path} overflow at ${width}`
      );
      await page.screenshot({
        path: `test-results/community-flow-${path === '/comunidad' ? 'feed' : path.includes('mis-conversaciones') ? 'personal' : 'thread'}-${width}.png`,
        fullPage: true,
      });
    }
  }
  await login('other');
  await page.goto(base + `/comunidad/${topicId}`);
  await page
    .getByRole('button', { name: 'Denunciar', exact: true })
    .first()
    .click();
  await modal
    .getByRole('textbox', { name: 'Detalles (opcionales)', exact: true })
    .fill('Contenido para revisión desde navegador.');
  await modal.getByRole('button', { name: 'Denunciar', exact: true }).click();
  await page
    .getByText('Denuncia enviada para revisión.', { exact: true })
    .waitFor();
  const report = await prisma.communityReport.findFirstOrThrow({
    where: {
      reporterId: identities.other.id,
      targetType: 'TOPIC',
      targetId: String(topicId),
    },
  });
  assert.equal((await api('/api/admin/community', 'GET')).status(), 403);
  await login('admin');
  assert.equal(
    (await api(`/api/community/topics/${contextDraft.id}`, 'GET')).status(),
    404
  );
  assert.equal(
    (await api(`/api/community/topics/${contextDraft.id}`, 'DELETE')).status(),
    404
  );
  assert.equal(
    (await api(`/api/community/topics/${topicId}`, 'DELETE')).status(),
    404
  );
  await page.goto(base + '/admin/comunidad');
  await page
    .getByRole('button', { name: 'Ocultar contenido', exact: true })
    .click();
  await modal
    .getByRole('textbox', { name: 'Motivo de la decisión', exact: true })
    .fill('Ocultado tras revisión de la denuncia.');
  await modal.getByRole('button', { name: 'Guardar', exact: true }).click();
  await page
    .getByText('No hay denuncias en esta vista', { exact: true })
    .waitFor();
  assert.equal(
    (await api(`/api/community/topics/${topicId}`, 'GET')).status(),
    404
  );
  await page.goto(base + '/admin/comunidad?resolved=true');
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 900 });
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1
      )
    );
    await page.screenshot({
      path: `test-results/community-moderation-${width}.png`,
      fullPage: true,
    });
  }
  await page
    .getByRole('button', { name: 'Quitar restricción', exact: true })
    .click();
  await modal
    .getByRole('textbox', { name: 'Motivo de la decisión', exact: true })
    .fill('Restricción retirada después de revisar el caso.');
  await modal.getByRole('button', { name: 'Guardar', exact: true }).click();
  await modal.waitFor({ state: 'hidden' });
  assert.equal(
    await prisma.communityModerationAction.count({
      where: { reportId: report.id },
    }),
    2
  );
  assert.equal(
    (await api(`/api/community/topics/${topicId}`, 'GET')).status(),
    200
  );
  await login('other');
  await page.goto(base + `/comunidad/${topicId}`);
  await page
    .getByRole('button', { name: 'Bloquear usuario', exact: true })
    .first()
    .click();
  await page
    .locator('.ant-popconfirm')
    .getByRole('button', { name: 'Bloquear usuario', exact: true })
    .click();
  await page.waitForURL(base + '/comunidad');
  assert.equal(
    (await api(`/api/community/topics/${topicId}`, 'GET')).status(),
    404
  );
  await api('/api/community/blocks', 'PATCH', {
    targetId: key,
    blocked: false,
  });
  await login('owner');
  assert.equal(
    (await api(`/api/community/topics/${topicId}`, 'DELETE')).status(),
    200
  );
  assert.equal(
    (await api(`/api/community/topics/${topicId}`, 'GET')).status(),
    404
  );
  assert.equal(await prisma.communityReply.count({ where: { topicId } }), 0);
  assert.deepEqual(errors, []);
  console.log(
    'PASS: browser -> actual HTTP handlers -> local PostgreSQL; all three kinds, episode selection, spoilers, replies, notification dispatch, ownership, close/reopen, moderation and responsive layouts. Only session resolution and notification delivery are simulated.'
  );
} catch (error) {
  console.error('Browser errors:', errors);
  if (page)
    console.error(
      'Page:',
      (await page.locator('body').innerText()).slice(0, 6000)
    );
  throw error;
} finally {
  if (browser) await browser.close();
  if (server.listening) await new Promise((resolve) => server.close(resolve));
  await prisma.communityReport.deleteMany({
    where: {
      reporterId: { in: Object.values(identities).map((user) => user.id) },
    },
  });
  await prisma.communityTopic.deleteMany({
    where: { userId: { in: Object.values(identities).map((user) => user.id) } },
  });
  if (series) await prisma.series.delete({ where: { id: series.id } });
  await prisma.user.deleteMany({
    where: { id: { in: Object.values(identities).map((user) => user.id) } },
  });
  await prisma.$disconnect();
}
