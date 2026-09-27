import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { createServer } from 'node:http';
import { chromium } from 'playwright';

const bundle = await build({
  stdin: {
    contents: `
import React from 'react';import {createRoot} from 'react-dom/client';
import {useWatchingPreferences} from './src/hooks/useWatchingPreferences';
function Fixture(){const p=useWatchingPreferences('fixture');return <main><output>{JSON.stringify({preferences:p.preferences,ready:p.ready,saving:p.saving,failed:p.failed})}</output><button disabled={!p.ready||p.saving} onClick={()=>p.updatePreferences({view:p.preferences.view==='grid'?'list':'grid'})}>View</button><button disabled={!p.ready||p.saving} onClick={()=>p.updatePreferences({pin:{id:1,pinned:!p.preferences.pinned.includes(1)}})}>Pin</button><button onClick={()=>p.reload()}>Retry</button></main>}
createRoot(document.getElementById('root')).render(<Fixture/>);
`,
    resolveDir: process.cwd(),
    loader: 'tsx',
  },
  bundle: true,
  write: false,
  platform: 'browser',
  jsx: 'automatic',
  define: { 'process.env.NODE_ENV': '"production"' },
});
const server = createServer((req, res) => {
  res.setHeader(
    'Content-Type',
    req.url === '/bundle.js'
      ? 'text/javascript; charset=utf-8'
      : 'text/html; charset=utf-8'
  );
  res.end(
    req.url === '/bundle.js'
      ? bundle.outputFiles[0].text
      : '<!doctype html><html><body><div id="root"></div><script src="/bundle.js"></script></body></html>'
  );
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({ headless: true });
let saved = null;
let failRead = false;
let failWrite = false;
const errors = [];
async function device(legacy) {
  const context = await browser.newContext();
  const page = await context.newPage();
  page.on('pageerror', (e) => errors.push(e.message));
  if (legacy)
    await page.addInitScript(
      (value) =>
        localStorage.setItem(
          'mundobl.watching.preferences.v1.fixture',
          JSON.stringify(value)
        ),
      legacy
    );
  await page.route('**/api/user/watching-preferences', async (route) => {
    const method = route.request().method();
    if ((method === 'GET' && failRead) || (method === 'PATCH' && failWrite))
      return route.fulfill({ status: 503, body: '{}' });
    if (method === 'POST' && saved === null)
      saved = route.request().postDataJSON();
    if (method === 'PATCH') {
      const change = route.request().postDataJSON();
      if (change.pin) {
        saved.pinned = saved.pinned.filter((id) => id !== change.pin.id);
        if (change.pin.pinned) saved.pinned.push(change.pin.id);
      } else saved = { ...saved, ...change };
    }
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ preferences: saved }),
    });
  });
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  return page;
}
const state = (page) =>
  page.locator('output').evaluate((el) => JSON.parse(el.textContent));
const ready = (page) =>
  page.waitForFunction(
    () =>
      JSON.parse(document.querySelector('output').textContent).ready &&
      !JSON.parse(document.querySelector('output').textContent).saving
  );
try {
  const a = await device({ view: 'grid', sort: 'name', pinned: [1] });
  await ready(a);
  assert.equal(saved.view, 'grid');
  const b = await device({ view: 'list', sort: 'recent', pinned: [] });
  await ready(b);
  assert.deepEqual(
    (await state(b)).preferences,
    saved,
    'second device must receive server preferences'
  );
  await b.getByRole('button', { name: 'View', exact: true }).click();
  await ready(b);
  assert.equal(saved.view, 'list');
  await a.evaluate(() => window.dispatchEvent(new Event('focus')));
  await a.waitForFunction(
    () =>
      JSON.parse(document.querySelector('output').textContent).preferences
        .view === 'list'
  );
  failWrite = true;
  await a.getByRole('button', { name: 'Pin', exact: true }).click();
  await a.waitForFunction(
    () => JSON.parse(document.querySelector('output').textContent).failed
  );
  assert.equal(
    await a.getByRole('button', { name: 'Pin', exact: true }).isDisabled(),
    true
  );
  assert.deepEqual((await state(a)).preferences.pinned, [1]);
  assert.deepEqual(saved.pinned, [1]);
  failWrite = false;
  await a.getByRole('button', { name: 'Retry' }).click();
  await ready(a);
  await a.getByRole('button', { name: 'Pin', exact: true }).click();
  await ready(a);
  assert.deepEqual(saved.pinned, []);
  failRead = true;
  const c = await device({ view: 'grid', sort: 'remaining', pinned: [4] });
  await c.waitForFunction(
    () => JSON.parse(document.querySelector('output').textContent).failed
  );
  assert.equal(
    await c.getByRole('button', { name: 'View', exact: true }).isDisabled(),
    true
  );
  assert.equal(
    saved.view,
    'list',
    'failed read cannot initialize or overwrite server'
  );
  failRead = false;
  await c.getByRole('button', { name: 'Retry' }).click();
  await ready(c);
  assert.deepEqual((await state(c)).preferences, saved);
  assert.deepEqual(errors, []);
  console.log(
    'PASS: real preference hook, two isolated devices, legacy bootstrap once, focus sync, failed writes roll back and disable edits, failed reads never overwrite server, retry recovery. HTTP responses simulated.'
  );
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
