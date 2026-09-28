import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { createServer } from 'node:http';
import { AsyncLocalStorage } from 'node:async_hooks';
import { createRequire } from 'node:module';
import { readFile, mkdir } from 'node:fs/promises';
import ts from 'typescript';
import { chromium } from 'playwright';
const require = createRequire(import.meta.url);
const db = require('../src/lib/database.ts');
require('./assert-local-test-database.ts').assertLocalTestDatabase();
const { prisma } = db;
const key = `community-lists-http-${Date.now()}`;
const users = {
  owner: { id: key, role: 'VISITOR', name: 'Lector' },
  other: { id: `${key}-other`, role: 'VISITOR', name: 'Otra persona' },
};
const sessions = new AsyncLocalStorage();
const auth = {
  requireAuth: async () => {
    const user = sessions.getStore();
    return user
      ? { authorized: true, userId: user.id, role: user.role }
      : { authorized: false, response: Response.json({}, { status: 401 }) };
  },
};
async function loadRoute(file) {
  const code = ts.transpileModule(await readFile(file, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const exports = {};
  new Function('require', 'exports', code)(
    (name) =>
      name === '@/lib/auth-helpers'
        ? auth
        : require(name.startsWith('@/') ? `../src/${name.slice(2)}.ts` : name),
    exports
  );
  return exports;
}
const routes = await Promise.all(
  [
    ['/^lists$/', 'src/app/api/community/lists/route.ts'],
    ['/^lists\\/([^/]+)$/', 'src/app/api/community/lists/[id]/route.ts'],
    ['/^profile$/', 'src/app/api/community/profile/route.ts'],
    ['/^profiles\\/([^/]+)$/', 'src/app/api/community/profiles/[id]/route.ts'],
    ['/^blocks$/', 'src/app/api/community/blocks/route.ts'],
    ['/^series$/', 'src/app/api/community/series/route.ts'],
  ].map(async ([pattern, file]) => [
    new RegExp(pattern.slice(1, -1)),
    await loadRoute(file),
  ])
);
const bundle = await build({
  stdin: {
    loader: 'tsx',
    resolveDir: process.cwd(),
    contents: `
    import React from 'react'; import {createRoot} from 'react-dom/client'; import {App} from 'antd';
    import {LocaleProvider} from './src/lib/providers/LocaleProvider'; import {ThemeProvider} from './src/lib/providers/ThemeProvider';
    import {CommunityLists} from './src/components/community/CommunityLists/CommunityLists';
    import {NewRecommendation} from './src/components/community/NewRecommendation/NewRecommendation';
    import {RecommendationPage} from './src/components/community/RecommendationPage/RecommendationPage';
    import {CommunityProfileEditor} from './src/components/community/CommunityProfileEditor/CommunityProfileEditor';
    import {PublicCommunityProfile} from './src/components/community/PublicCommunityProfile/PublicCommunityProfile';
    import {TopFiveInvitation} from './src/components/community/TopFiveInvitation/TopFiveInvitation';
    import './src/styles/variables.css';
    const d=window.fixture;
    createRoot(document.getElementById('root')).render(<LocaleProvider><ThemeProvider><App><TopFiveInvitation />{d.kind==='new'?<NewRecommendation/>:d.kind==='detail'?<RecommendationPage initial={d.list}/>:d.kind==='settings'?<CommunityProfileEditor initial={d.profile} initialBlocks={d.blocks}/>:d.kind==='profile'?<PublicCommunityProfile profile={d.profile}/>:<CommunityLists {...d.lists}/>}</App></ThemeProvider></LocaleProvider>);
  `,
  },
  bundle: true,
  write: false,
  outdir: 'test-results/community-library-flow',
  jsx: 'automatic',
  platform: 'browser',
  define: { 'process.env.NODE_ENV': '"production"', 'process.env': '{}' },
  plugins: [
    {
      name: 'fixture-session-router',
      setup(b) {
        b.onResolve(
          { filter: /^(next\/navigation|next-auth\/react)$/ },
          (args) => ({ path: args.path, namespace: 'fixture' })
        );
        b.onLoad({ filter: /.*/, namespace: 'fixture' }, (args) => ({
          loader: 'js',
          contents:
            args.path === 'next/navigation'
              ? 'export const useRouter=()=>({push:href=>location.assign(href),refresh:()=>{}}); export const usePathname=()=>location.pathname;'
              : 'export const useSession=()=>({data:window.fixture.session?{user:window.fixture.session}:null,status:window.fixture.session?"authenticated":"unauthenticated"}); export const signIn=()=>{window.loginRequested=true};',
        }));
      },
    },
  ],
});
const javascript = bundle.outputFiles.find((file) =>
  file.path.endsWith('.js')
).text;
const css = bundle.outputFiles.find((file) => file.path.endsWith('.css')).text;
const errors = [];
const server = createServer((req, res) =>
  sessions.run(
    users[/fixture=(owner|other)/.exec(req.headers.cookie ?? '')?.[1]] ?? null,
    async () => {
      try {
        const url = new URL(req.url, `http://${req.headers.host}`);
        if (url.pathname === '/bundle.js' || url.pathname === '/bundle.css') {
          res.setHeader(
            'Content-Type',
            url.pathname.endsWith('.js') ? 'text/javascript' : 'text/css'
          );
          res.end(url.pathname.endsWith('.js') ? javascript : css);
          return;
        }
        const identity = sessions.getStore();
        if (url.pathname.startsWith('/api/community/')) {
          const path = url.pathname.slice('/api/community/'.length);
          const pair = routes.find(([pattern]) => pattern.test(path));
          if (!pair?.[1][req.method]) {
            res.writeHead(404);
            res.end();
            return;
          }
          const chunks = [];
          for await (const chunk of req) chunks.push(chunk);
          const body = Buffer.concat(chunks);
          const request = new Request(url, {
            method: req.method,
            headers: req.headers,
            ...(body.length ? { body } : {}),
          });
          const response = await pair[1][req.method](request, {
            params: Promise.resolve({ id: pair[0].exec(path)[1] }),
          });
          res.writeHead(response.status, Object.fromEntries(response.headers));
          res.end(await response.text());
          return;
        }
        let data;
        const listMatch = /^\/comunidad\/listas\/([^/]+)$/.exec(url.pathname);
        const profileMatch = /^\/comunidad\/perfiles\/([^/]+)$/.exec(
          url.pathname
        );
        if (url.pathname === '/comunidad/listas/nueva') data = { kind: 'new' };
        else if (listMatch) {
          const list = await db.getRecommendationList(
            listMatch[1],
            identity?.id
          );
          if (!list) {
            res.writeHead(404);
            res.end('Not found');
            return;
          }
          data = { kind: 'detail', list };
        } else if (url.pathname === '/comunidad/mi-espacio')
          data = {
            kind: 'settings',
            profile: await db.getCommunityProfileSettings(identity.id),
            blocks: await db.getCommunityBlocks(identity.id),
          };
        else if (profileMatch) {
          const profile = await db.getPublicCommunityProfile(
            profileMatch[1],
            identity?.id
          );
          if (!profile) {
            res.writeHead(404);
            res.end('Not found');
            return;
          }
          data = { kind: 'profile', profile };
        } else {
          const mine = url.searchParams.get('mine') === 'true';
          const search = url.searchParams.get('q') ?? key;
          data = {
            kind: 'lists',
            lists: {
              ...(await db.getRecommendationLists({
                viewerId: identity?.id,
                mine,
                search,
              })),
              mine,
              search,
              page: 1,
            },
          };
        }
        const fixture = JSON.stringify({
          ...data,
          session: identity,
        }).replaceAll('<', '\\u003c');
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(
          `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/bundle.css"><style>*{box-sizing:border-box}body{margin:0;background:var(--bg-layout);color:var(--text-primary);font-family:Arial,sans-serif}</style></head><body><div id="root"></div><script>window.fixture=${fixture}</script><script src="/bundle.js"></script></body></html>`
        );
      } catch (error) {
        errors.push(String(error));
        res.writeHead(500);
        res.end('Fixture error');
      }
    }
  )
);
let browser;
let page;
const seriesIds = [];
try {
  await prisma.user.createMany({
    data: Object.values(users).map((user) => ({
      ...user,
      email: `${user.id}@example.invalid`,
    })),
  });
  for (const suffix of ['Primera historia', 'Segunda historia']) {
    const series = await prisma.series.create({
      data: { title: `${key} ${suffix}`, type: 'serie' },
    });
    seriesIds.push(series.id);
  }
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ headless: true });
  page = await browser.newPage({
    locale: 'es-AR',
    viewport: { width: 1280, height: 900 },
  });
  page.on('pageerror', (error) => errors.push(error.message));
  const login = async (user) => {
    await page.context().clearCookies();
    if (user)
      await page
        .context()
        .addCookies([{ name: 'fixture', value: user, url: base }]);
  };
  const api = (path, method = 'GET', data) =>
    page.request.fetch(base + path, {
      method,
      ...(data === undefined ? {} : { data }),
    });
  assert.equal((await api('/api/community/lists', 'POST', {})).status(), 401);
  await login('owner');
  await page.goto(base + '/comunidad/listas/nueva');
  await page
    .getByRole('textbox', { name: 'Nombre de la lista', exact: true })
    .fill(`${key} Mis recomendaciones`);
  await page
    .getByRole('textbox', { name: '¿Qué une estas historias?', exact: true })
    .fill('Historias para conversar y recomendar.');
  const add = async (suffix) => {
    await page
      .getByRole('combobox', { name: 'Agregar una obra', exact: true })
      .fill(key);
    await page.getByTitle(`${key} ${suffix}`, { exact: true }).last().click();
  };
  await add('Primera historia');
  await page
    .getByRole('textbox', {
      name: 'Por qué la recomendás (opcional)',
      exact: true,
    })
    .fill('Me gustó mucho su historia.');
  await add('Segunda historia');
  await page
    .getByRole('textbox', {
      name: 'Por qué la recomendás (opcional)',
      exact: true,
    })
    .last()
    .fill('El final sorpresa que no hay que mostrar.');
  await page
    .getByRole('switch', { name: 'Contiene spoilers', exact: true })
    .last()
    .click();
  await page
    .getByRole('button', {
      name: `Subir: ${key} Segunda historia`,
      exact: true,
    })
    .click();
  await page.getByRole('button', { name: 'Vista previa', exact: true }).click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Mostrar spoilers', exact: true })
    .waitFor();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: /close|cerrar/i })
    .click();
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await page.waitForURL(/\/comunidad\/listas\/c[a-z0-9]+$/);
  const listId = page.url().split('/').pop();
  const stored = await prisma.recommendationList.findUnique({
    where: { id: listId },
    include: { items: { orderBy: { position: 'asc' } } },
  });
  assert.equal(stored.visibility, 'PRIVATE');
  assert.equal(stored.items[0].seriesId, seriesIds[1]);
  await login('other');
  assert.equal((await api(`/api/community/lists/${listId}`)).status(), 404);
  await login('owner');
  await page.getByRole('button', { name: 'Publicar', exact: true }).click();
  await page
    .getByRole('button', { name: 'Publicar', exact: true })
    .last()
    .click();
  await page
    .getByRole('button', { name: 'Volver a privado', exact: true })
    .waitFor();
  await login('other');
  await page.goto(base + `/comunidad/listas/${listId}`);
  assert.equal(
    await page.getByRole('button', { name: 'Editar', exact: true }).count(),
    0
  );
  assert.equal(
    await page
      .getByText('El final sorpresa que no hay que mostrar.', { exact: true })
      .count(),
    0
  );
  await page
    .getByRole('button', { name: 'Mostrar spoilers', exact: true })
    .click();
  await page
    .getByText('El final sorpresa que no hay que mostrar.', { exact: true })
    .waitFor();
  await login('owner');
  await page.goto(base + '/comunidad/mi-espacio');
  await page
    .getByRole('textbox', { name: 'Nombre público', exact: true })
    .fill('Mi alias elegido');
  await page
    .getByRole('textbox', { name: 'Una presentación breve', exact: true })
    .fill('Me gustan las historias compartidas.');
  await page
    .getByRole('switch', { name: 'Publicar mi perfil', exact: true })
    .click();
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Publicar', exact: true })
    .click();
  await page
    .getByRole('link', { name: 'Ver mi perfil público', exact: true })
    .waitFor();
  const profileId = (
    await prisma.communityProfile.findUnique({ where: { userId: key } })
  ).publicId;
  await login('other');
  await page.goto(base + `/comunidad/perfiles/${profileId}`);
  await page
    .getByRole('heading', { name: 'Mi alias elegido', exact: true })
    .waitFor();
  assert.equal(
    await page.getByText(`${key} Mis recomendaciones`, { exact: true }).count(),
    1
  );
  await page.goto(base + '/comunidad/listas');
  await page
    .getByRole('button', { name: 'No volver a mostrar', exact: true })
    .click();
  await page.reload();
  assert.equal(
    await page
      .getByRole('button', { name: 'No volver a mostrar', exact: true })
      .count(),
    0
  );
  assert.equal(
    (
      await prisma.communityProfile.findUnique({
        where: { userId: users.other.id },
      })
    ).promptChoice,
    'DISMISSED'
  );
  await login('owner');
  await page.goto(base + '/comunidad/listas');
  await page.getByRole('button', { name: 'Mi Top 5', exact: true }).click();
  await page.waitForURL(/\/comunidad\/listas\/c[a-z0-9]+$/);
  await page
    .getByRole('textbox', { name: 'Nombre de la lista', exact: true })
    .waitFor();
  assert.equal(
    await prisma.recommendationList.count({
      where: { userId: key, kind: 'TOP_FIVE', visibility: 'PRIVATE' },
    }),
    1
  );
  await page.goto(base + `/comunidad/listas/${listId}`);
  await page
    .getByRole('button', { name: 'Volver a privado', exact: true })
    .click();
  await page.getByRole('button', { name: 'Publicar', exact: true }).waitFor();
  await login('other');
  assert.equal((await api(`/api/community/lists/${listId}`)).status(), 404);
  await login('owner');
  await mkdir('test-results', { recursive: true });
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 900 });
    for (const [name, path] of [
      ['list', `/comunidad/listas/${listId}`],
      ['profile', '/comunidad/mi-espacio'],
      ['index', '/comunidad/listas?mine=true'],
    ]) {
      await page.goto(base + path, { waitUntil: 'networkidle' });
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1
        ),
        `${name} overflows at ${width}`
      );
      await page.screenshot({
        path: `test-results/community-library-${name}-${width}.png`,
        fullPage: true,
      });
    }
  }
  assert.deepEqual(errors, []);
  console.log(
    'PASS: actual components, theme, HTTP handlers and PostgreSQL; private list creation/reorder/preview/publication/revocation, spoiler reveal, profile opt-in, persistent invitation dismissal, private Top 5, desktop/mobile. Session resolution and navigation shell are test adapters.'
  );
} catch (error) {
  if (page)
    console.error((await page.locator('body').innerText()).slice(0, 5000));
  console.error(errors);
  throw error;
} finally {
  if (browser) await browser.close();
  if (server.listening) await new Promise((resolve) => server.close(resolve));
  await prisma.user.deleteMany({
    where: { id: { in: Object.values(users).map((user) => user.id) } },
  });
  await prisma.series.deleteMany({ where: { id: { in: seriesIds } } });
  await prisma.$disconnect();
}
