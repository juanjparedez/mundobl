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
      import { ProfileStatsStrip } from './src/app/(app)/perfil/dashboard/ProfileStatsStrip/ProfileStatsStrip';
      import { StatsStripWidget } from './src/app/(app)/perfil/dashboard/widgets/StatsStripWidget/StatsStripWidget';
      import './src/styles/variables.css';
      const stats={activityYear:2026,completedThisYear:2,watched:2,watching:1,toRewatch:0,abandoned:0,favorites:1,avgRating:7.5,reviews:1,comments:3,hoursWatched:1.5,unknownDurationVideos:3,longestStreak:2,totalEpisodes:8,completedByYear:[{year:2026,count:99}]};
      createRoot(document.getElementById('root')).render(<LocaleProvider><ProfileStatsStrip stats={stats}/><StatsStripWidget stats={stats}/></LocaleProvider>);
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
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page
    .getByText('Horas con duración registrada', { exact: true })
    .first()
    .waitFor();
  assert.equal(
    await page
      .getByText('3 videos vistos sin duración: no incluidos.', { exact: true })
      .count(),
    2
  );
  await mkdir('test-results', { recursive: true });
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth
      ),
      false
    );
    const clipped = await page
      .locator('[class$="__hint"]')
      .evaluateAll((nodes) =>
        nodes.some((node) => node.scrollWidth > node.clientWidth)
      );
    assert.equal(clipped, false);
    await page.screenshot({
      path: `test-results/profile-duration-${width}.png`,
      fullPage: true,
    });
  }
  const annualTiles = page
    .locator('li')
    .filter({ has: page.getByText('Vistos en 2026', { exact: true }) });
  assert.equal(await annualTiles.count(), 2);
  for (const tile of await annualTiles.all())
    assert.match(await tile.innerText(), /^2\s/);
  assert.deepEqual(errors, []);
  console.log(
    'PASS: both real profile statistics strips retain decimal hours, show unknown duration coverage without truncation, and fit mobile/desktop. Synthetic stats.'
  );
} catch (error) {
  console.error('Browser errors:', errors);
  console.error('Page text:', await page.locator('body').innerText());
  throw error;
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
