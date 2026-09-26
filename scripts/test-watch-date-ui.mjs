import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { createServer } from 'node:http';
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const bundle = await build({
  stdin: {
    contents: `
      import React from 'react';
      import { createRoot } from 'react-dom/client';
      import { WatchDateEditor } from './src/components/series/WatchDateEditor/WatchDateEditor';
      import { MESSAGES } from './src/i18n/messages';
      import './src/styles/variables.css';
      function Fixture() {
        const [open,setOpen]=React.useState(true);
        return <><button onClick={()=>setOpen(true)}>Open fixture</button>{open ? <WatchDateEditor options={location.search ? [{target:{seriesId:9},label:'A completed film'}] : [{target:{episodeId:1},label:'T1 E1 · 1/2'},{target:{episodeId:2},label:'T1 E1 · 2/2'}]} labels={MESSAGES.es.watchDateEditor} onClose={()=>setOpen(false)} /> : <p>Closed</p>}</>;
      }
      createRoot(document.getElementById('root')).render(<Fixture />);
    `,
    resolveDir: process.cwd(),
    loader: 'tsx',
  },
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
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  const date = page.getByLabel('Fecha de visionado (UTC)', { exact: true });
  await date.waitFor();
  assert.equal(await date.inputValue(), '2020-01-02');
  await date.fill('2020-01-01');
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await page.getByText('Closed', { exact: true }).waitFor();
  assert.deepEqual(payload, {
    episodeId: 1,
    watchedDate: '2020-01-01',
    expectedDate: '2020-01-02T14:30:00.000Z',
  });
  await page.getByRole('button', { name: 'Open fixture' }).click();
  await date.waitFor();
  await page
    .getByRole('button', { name: 'Fecha desconocida', exact: true })
    .click();
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await page.getByText('Closed', { exact: true }).waitFor();
  assert.equal(payload.watchedDate, null);
  conflict = true;
  await page.getByRole('button', { name: 'Open fixture' }).click();
  await date.waitFor();
  await date.fill('2021-01-01');
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await page
    .getByText(
      'El seguimiento cambió. Cerrá y volvé a abrir para revisar la fecha actual.',
      { exact: true }
    )
    .waitFor();
  assert.equal(
    await page
      .getByRole('button', { name: 'Guardar', exact: true })
      .isDisabled(),
    true
  );
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth
    ),
    false
  );
  await mkdir('test-results', { recursive: true });
  await page.screenshot({
    path: 'test-results/watch-date-editor.png',
    fullPage: true,
  });
  conflict = false;
  await page.goto(`http://127.0.0.1:${server.address().port}?series=1`);
  await date.waitFor();
  await date.fill('2020-02-02');
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await page.getByText('Closed', { exact: true }).waitFor();
  assert.deepEqual(payload, {
    seriesId: 9,
    watchedDate: '2020-02-02',
    expectedDate: '2020-01-02T14:30:00.000Z',
  });
  assert.deepEqual(errors, []);
  console.log(
    'PASS: real watch-date editor loads historical date, saves with exact expected timestamp, clears to unknown, keeps stale edits open, and fits mobile. API responses simulated.'
  );
} catch (error) {
  console.error('Browser errors:', errors);
  console.error('Page text:', await page.locator('body').innerText());
  throw error;
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
