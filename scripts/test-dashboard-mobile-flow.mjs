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
      import { LocaleProvider } from './src/lib/providers/LocaleProvider';
      import { DashboardGrid, Widget, WidgetRegistry } from './src/components/dashboard';
      import './src/styles/variables.css';
      for (const id of ['a','b']) WidgetRegistry.register({id,category:'activity',labelKey:'profileDashboard.widgetHeatmap',defaultSize:{w:4,h:2},Component:()=> <Widget title={id}>{Array.from({length:35},(_,i)=><p key={i}>Contenido {id} {i}</p>)}</Widget>});
      const layouts={lg:[{i:'a',x:0,y:0,w:6,h:2,hMode:'manual'},{i:'b',x:6,y:0,w:6,h:2,hMode:'manual'}],xxs:[{i:'b',x:0,y:0,w:2,h:2,hMode:'manual'},{i:'a',x:0,y:2,w:2,h:2,hMode:'manual'}]};
      createRoot(document.getElementById('root')).render(<LocaleProvider><DashboardGrid layouts={layouts}/></LocaleProvider>);
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
        : '<!doctype html><html data-theme="dark"><head><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/bundle.css"><style>*{box-sizing:border-box}body{margin:0;background:var(--bg-base);color:var(--text-primary);font-family:sans-serif}a{color:var(--primary-color)}</style></head><body><div id="root"></div><script src="/bundle.js"></script></body></html>'
  );
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ locale: 'es-AR' });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
try {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.locator('.mb-dashboard-grid__mobile-flow').waitFor();
  assert.deepEqual(await page.locator('.mb-widget__title').allTextContents(), [
    'b',
    'a',
  ]);
  const bodies = await page
    .locator('.mb-widget__body')
    .evaluateAll((nodes) =>
      nodes.map((n) => ({
        overflow: getComputedStyle(n).overflowY,
        height: n.clientHeight,
        content: n.scrollHeight,
      }))
    );
  assert.ok(
    bodies.every((n) => n.overflow === 'visible' && n.content <= n.height + 1)
  );
  await page.mouse.move(190, 250);
  await page.mouse.wheel(0, 500);
  await page.waitForFunction(() => window.scrollY > 200);
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth
    ),
    false
  );
  await mkdir('test-results', { recursive: true });
  await page.screenshot({ path: 'test-results/profile-mobile-flow.png' });
  await page.setViewportSize({ width: 1280, height: 844 });
  await page.locator('.react-grid-layout').waitFor();
  assert.equal(
    await page.locator('.mb-widget[data-h-mode="manual"]').count(),
    2
  );
  assert.deepEqual(errors, []);
  console.log(
    'PASS: mobile cards expand, page scroll works over cards, saved mobile order and desktop manual heights retained.'
  );
} catch (error) {
  console.error('Browser errors:', errors);
  console.error('Page text:', await page.locator('body').innerText());
  throw error;
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
