import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { createServer } from 'node:http';
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const bundle = await build({
  stdin: {
    contents: `
      import React from 'react';
      import { ConfigProvider, theme } from 'antd';
      import { createRoot } from 'react-dom/client';
      import { SeasonsList } from './src/components/series/SeasonsList';
      import { LocaleProvider } from './src/lib/providers/LocaleProvider';
      import './src/styles/variables.css';
      createRoot(document.getElementById('root')).render(<ConfigProvider theme={{algorithm:theme.darkAlgorithm}}><LocaleProvider><SeasonsList seasons={[{id:11,seasonNumber:1},{id:12,seasonNumber:2}]} /></LocaleProvider></ConfigProvider>);
    `,
    resolveDir: process.cwd(),
    loader: 'tsx',
  },
  plugins: [
    {
      name: 'fixture-boundaries',
      setup(build) {
        const stubs = {
          'next-auth/react': `export const useSession = () => ({data:location.search.includes('guest') ? null : {user:{id:'fixture',role:'USER'}}});`,
          './SeriesUserStatusProvider': `export const useSeriesUserStatus = () => ({seasonStatus:{11:'VISTA',12:'SIN_VER'},episodeStatus:{}});`,
          './EpisodesList': 'export const EpisodesList = () => null;',
          './EpisodeChapterList/EpisodeChapterList':
            'export const EpisodeChapterList = () => null;',
          '@/components/common/CommentsList':
            'export const CommentsList = () => null;',
        };
        build.onResolve({ filter: /.*/ }, (args) =>
          Object.hasOwn(stubs, args.path)
            ? { path: args.path, namespace: 'fixture' }
            : undefined
        );
        build.onLoad({ filter: /.*/, namespace: 'fixture' }, (args) => ({
          contents: stubs[args.path],
          loader: 'js',
        }));
      },
    },
  ],
  bundle: true,
  write: false,
  outdir: 'test-results/community-bundle',
  platform: 'browser',
  jsx: 'automatic',
  define: { 'process.env.NODE_ENV': '"production"', 'process.env': '{}' },
});
const js = bundle.outputFiles.find((f) => f.path.endsWith('.js')).text;
const css = bundle.outputFiles.find((f) => f.path.endsWith('.css')).text;
const server = createServer((req, res) => {
  res.setHeader(
    'Content-Type',
    req.url === '/bundle.js'
      ? 'text/javascript'
      : req.url === '/bundle.css'
        ? 'text/css'
        : 'text/html'
  );
  res.end(
    req.url === '/bundle.js'
      ? js
      : req.url === '/bundle.css'
        ? css
        : '<!doctype html><html data-theme="dark"><head><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/bundle.css"><style>body{margin:0;background:var(--bg-base);color:var(--text-primary);font-family:sans-serif}a{color:var(--primary-color)}</style></head><body><div id="root"></div><script src="/bundle.js"></script></body></html>'
  );
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ locale: 'es-AR' });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
let payload;
let conflict = false;
await page.route('**/api/user/watch-date**', async (route) => {
  if (route.request().method() === 'PATCH') {
    payload = route.request().postDataJSON();
    await route.fulfill({
      status: conflict ? 409 : 200,
      json: { watchedDate: payload.watchedDate },
    });
  } else
    await route.fulfill({ json: { watchedDate: '2020-01-02T14:30:00.000Z' } });
});
try {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  const button = page.getByRole('button', {
    name: /Corregir fecha de visionado/,
  });
  await button.waitFor();
  assert.equal(await button.count(), 1);
  await button.click();
  const date = page.getByLabel('Fecha de visionado (UTC)', { exact: true });
  await date.waitFor();
  await date.fill('2020-02-02');
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await page.getByRole('dialog').waitFor({ state: 'hidden' });
  assert.deepEqual(payload, {
    seasonId: 11,
    watchedDate: '2020-02-02',
    expectedDate: '2020-01-02T14:30:00.000Z',
  });
  await page.getByText('Temporada 2', { exact: true }).click();
  assert.equal(
    await button.count(),
    1,
    'Unwatched season has no correction action'
  );
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth
    ),
    false
  );
  await mkdir('test-results', { recursive: true });
  await page.screenshot({
    path: 'test-results/season-watch-date.png',
    fullPage: true,
  });
  await page.goto(`http://127.0.0.1:${server.address().port}?guest`);
  await page.getByText('Temporada 1', { exact: true }).waitFor();
  assert.equal(await button.count(), 0, 'No account date editor for guests');
  assert.deepEqual(errors, []);
  console.log(
    'PASS: real SeasonsList opens real editor with season target, saves exact prior date, excludes unwatched/guest, and fits mobile. Session/status and API simulated; unrelated child panels stubbed.'
  );
} catch (error) {
  console.error('Browser errors:', errors);
  console.error('Page text:', await page.locator('body').innerText());
  throw error;
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
