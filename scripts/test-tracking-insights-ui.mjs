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
      import { SessionProvider } from 'next-auth/react';
      import { LocaleProvider } from './src/lib/providers/LocaleProvider';
      import { TrackingInsightsPage } from './src/components/watching/TrackingInsightsPage/TrackingInsightsPage';
      import './src/styles/variables.css';
      createRoot(document.getElementById('root')).render(<SessionProvider session={{user:{id:'fixture'},expires:'2099-01-01'}}><LocaleProvider><TrackingInsightsPage /></LocaleProvider></SessionProvider>);
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
let failures = true;
const server = createServer((req, res) => {
  if (req.url.startsWith('/api/user/tracking-stats')) {
    res.setHeader('Content-Type', 'application/json');
    if (failures) {
      failures = false;
      res.statusCode = 503;
      res.end('{}');
      return;
    }
    const days = Number(
      new URL(req.url, 'http://localhost').searchParams.get('days')
    );
    res.end(
      JSON.stringify({
        days,
        start: '2026-09-01',
        end: '2026-09-27',
        previousStart: '2026-08-01',
        previousEnd: '2026-08-31',
        unknownDates: 3,
        current: {
          chapters: days,
          series: 2,
          minutes: 142,
          unknownDurations: 1,
        },
        previous: { chapters: 3, series: 1, minutes: 125, unknownDurations: 0 },
        rows: Array.from({ length: 12 }, (_, i) => ({
          id: i,
          title: 'Serie ' + i,
          href: '/series/' + i,
          chapters: 2,
          minutes: 10,
          completed: false,
          metadata: {
            country: i < 6 ? { id: 1, name: 'Tailandia', code: 'TH' } : null,
            genres: [{ id: 1, name: 'Romance' }],
            type: 'serie',
            format: 'regular',
          },
        })),
      })
    );
    return;
  }

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
  await page
    .getByText('No pudimos cargar tus estadísticas. Podés volver a intentarlo.')
    .waitFor();
  await page.getByRole('button', { name: 'Reintentar' }).click();
  await page.locator('.mb-tracking-insights__list li').first().waitFor();
  assert.equal(
    await page.locator('.mb-tracking-insights__list li').count(),
    10
  );
  assert.equal(
    await page
      .locator('.mb-stat-card')
      .first()
      .locator('.mb-stat-card__value')
      .innerText(),
    '30'
  );
  await page.getByRole('combobox').click();
  await page.getByTitle('Últimos 7 días', { exact: true }).click();
  await page.waitForFunction(
    () => document.querySelector('.mb-stat-card__value')?.textContent === '7'
  );
  const countryPanel = page
    .locator('.insight-distribution')
    .filter({
      has: page.getByRole('heading', { name: 'País de la obra', exact: true }),
    });
  await countryPanel
    .getByRole('button')
    .filter({ hasText: 'Tailandia' })
    .click();
  assert.equal(await page.locator('.mb-tracking-insights__list li').count(), 6);
  assert.equal(
    await countryPanel
      .getByRole('button')
      .filter({ hasText: 'Tailandia' })
      .getAttribute('aria-pressed'),
    'true'
  );
  assert.equal(
    await page.locator('.mb-stat-card__value').first().innerText(),
    '7'
  );
  await page
    .getByRole('button', { name: 'Quitar filtro', exact: true })
    .click();
  assert.equal(
    await page.locator('.mb-tracking-insights__list li').count(),
    10
  );
  await page.locator('.ant-pagination-item-2').click();
  assert.equal(await page.locator('.mb-tracking-insights__list li').count(), 2);
  assert.equal(
    await page
      .getByRole('link', { name: 'Serie 10', exact: true })
      .getAttribute('href'),
    '/series/10'
  );
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth
    ),
    true
  );
  assert.equal(
    await page
      .locator('.mb-tracking-insights__list')
      .evaluate((el) => el.clientHeight >= el.scrollHeight),
    true
  );
  await page
    .getByRole('heading', { name: 'Mis estadísticas', exact: true })
    .click();
  await mkdir('test-results', { recursive: true });
  await page.screenshot({
    path: 'test-results/tracking-insights-mobile.png',
    fullPage: true,
  });
  await page.setViewportSize({ width: 1280, height: 844 });
  await page.screenshot({
    path: 'test-results/tracking-insights-desktop.png',
    fullPage: true,
  });
  assert.deepEqual(errors, []);
  console.log(
    'PASS: mobile error/retry, period switch, pagination, links, no horizontal overflow or nested list scroll.'
  );
} catch (error) {
  console.error('Browser errors:', errors);
  console.error('Page text:', await page.locator('body').innerText());
  throw error;
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
