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
import { AutoFitList } from './src/components/design-system/AutoFitList/AutoFitList';
import { ProfileListPreferences } from './src/app/(app)/perfil/dashboard/ProfileListPreferences/ProfileListPreferences';
      import './src/styles/variables.css';
      for (const id of ['a','b']) WidgetRegistry.register({id,category:'activity',labelKey:'profileDashboard.widgetHeatmap',defaultSize:{w:4,h:2},Component:()=> <Widget title={id}><AutoFitList collapsedCount={5} listClassName="test-summary" viewLessLabel="Less" viewMoreLabel={()=>'More'}>{Array.from({length:35},(_,i)=><li key={i}>Contenido {id} {i}</li>)}</AutoFitList></Widget>});
      const layouts={lg:[{i:'a',x:0,y:0,w:6,h:2,hMode:'manual'},{i:'b',x:6,y:0,w:6,h:2,hMode:'manual'}],xxs:[{i:'b',x:0,y:0,w:2,h:2,hMode:'manual'},{i:'a',x:0,y:2,w:2,h:2,hMode:'manual'}]};
      createRoot(document.getElementById('root')).render(<LocaleProvider><ProfileListPreferences userId="fixture"><DashboardGrid layouts={layouts}/></ProfileListPreferences></LocaleProvider>);
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
  assert.equal(await page.locator('.test-summary > li').count(), 10);
  await page.getByRole('button', { name: 'More', exact: true }).first().click();
  assert.equal(await page.locator('.test-summary > li').count(), 40);
  await page.getByRole('combobox').click();
  await page.getByTitle('10', { exact: true }).click();
  await page.waitForFunction(
    () => document.querySelectorAll('.test-summary > li').length === 20
  );
  await page.reload();
  await page.waitForFunction(
    () => document.querySelectorAll('.test-summary > li').length === 20
  );
  await page.getByRole('combobox').click();
  await page.getByTitle('3', { exact: true }).click();
  await page.waitForFunction(
    () => document.querySelectorAll('.test-summary > li').length === 6
  );
  await page.getByRole('combobox').click();
  await page.getByTitle('5', { exact: true }).click();
  await page.waitForFunction(
    () => document.querySelectorAll('.test-summary > li').length === 10
  );
  await mkdir('test-results', { recursive: true });
  await page.screenshot({ path: 'test-results/profile-list-count.png' });
  await page.setViewportSize({ width: 1280, height: 844 });
  await page.locator('.react-grid-layout').waitFor();
  assert.equal(
    await page.locator('.mb-widget[data-h-mode="manual"]').count(),
    2
  );
  assert.deepEqual(errors, []);
  console.log(
    'PASS: global count updates both lists from 5 to 10 to 3, survives reload and preserves widget order.'
  );
} catch (error) {
  console.error('Browser errors:', errors);
  console.error('Page text:', await page.locator('body').innerText());
  throw error;
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
