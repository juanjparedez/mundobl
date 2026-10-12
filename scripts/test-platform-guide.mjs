import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { createServer } from 'node:http';
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
const bundle = await build({
  stdin: {
    contents: `
import React from 'react';
import {createRoot} from 'react-dom/client';
import {LocaleProvider,useLocale} from './src/lib/providers/LocaleProvider';
import {PlataformasClient} from './src/app/(app)/plataformas/PlataformasClient';
import './src/styles/variables.css';
function Fixture(){const {setLocale}=useLocale();return <><button onClick={()=>setLocale('en')}>English</button><div className="plataformas-page"><PlataformasClient/></div></>}
createRoot(document.getElementById('root')).render(<LocaleProvider><Fixture/></LocaleProvider>);
`,
    resolveDir: process.cwd(),
    loader: 'tsx',
  },
  bundle: true,
  write: false,
  outdir: 'test-results/platforms/bundle',
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
        : '<!doctype html><html data-theme="dark"><head><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/bundle.css"><style>*{box-sizing:border-box}body{margin:0;background:var(--bg-base);color:var(--text-primary);font-family:sans-serif}</style></head><body><div id="root"></div><script src="/bundle.js"></script></body></html>'
  );
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  locale: 'es',
  viewport: { width: 390, height: 844 },
});
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
try {
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page
    .getByRole('heading', { name: 'Plataformas y suscripciones' })
    .waitFor();
  assert.equal(await page.getByRole('article').count(), 9);
  assert.equal(
    await page.getByRole('link', { name: 'Consultar fuente oficial' }).count(),
    9
  );
  assert.match(
    await page.locator('.plataformas-transparency-note').innerText(),
    /sin afiliación confirmada/
  );
  await page.locator('label').filter({ hasText: 'Precio observado' }).click();
  assert.equal(await page.getByRole('article').count(), 3);
  const netflix = page.getByRole('article', { name: 'Netflix', exact: true });
  assert.match(await netflix.innerText(), /Argentina/);
  assert.match(await netflix.innerText(), /ARS/);
  assert.equal(
    await netflix.getByRole('link').getAttribute('href'),
    'https://help.netflix.com/es/node/24926'
  );
  await page.locator('label').filter({ hasText: 'Consultar precio' }).click();
  assert.equal(await page.getByRole('article').count(), 5);
  assert.equal(await page.locator('.plataforma-plan-box').count(), 0);
  await page.locator('label').filter({ hasText: 'Todas' }).click();
  await mkdir('test-results/platforms', { recursive: true });
  for (const width of [320, 390, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      ),
      `Overflow at ${width}`
    );
    if (width !== 320)
      await page.screenshot({
        path: `test-results/platforms/guide-${width}.png`,
        fullPage: true,
      });
  }
  await page.getByRole('button', { name: 'English', exact: true }).click();
  await page
    .getByRole('heading', { name: 'Platforms and subscriptions' })
    .waitFor();
  assert.equal(
    await page.getByRole('link', { name: 'View official source' }).count(),
    9
  );
  assert.doesNotMatch(
    await page.locator('body').innerText(),
    /platformGuide\./
  );
  assert.deepEqual(errors, []);
  console.log(
    'Platform guide: sources, filters, locale switch and 320/390/1280px layout passed.'
  );
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
