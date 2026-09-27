import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { createServer } from 'node:http';
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const bundle = await build({
  stdin: {
    contents: `
      import React, {useState} from 'react';
      import { createRoot } from 'react-dom/client';
      import { LocaleProvider } from './src/lib/providers/LocaleProvider';
      import { HistorySeriesCard } from './src/components/watching/HistorySeriesCard/HistorySeriesCard';
      import './src/components/watching/TrackingHistory/TrackingHistory.css';
      import './src/styles/variables.css';
      const poster='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="180"><rect width="120" height="180" fill="teal"/><text x="20" y="90" fill="white">Poster</text></svg>');
      function Fixture(){
        const [open,setOpen]=useState(false);
        return <div className="tracking-history__groups">{[1,2].map(id=><HistorySeriesCard key={id} title={'Serie '+id} href={'/series/'+id} imageUrl={id===1?poster:undefined} expanded={id===1&&open} onToggle={()=>setOpen(!open)} labels={{expand:'Ver {count} movimientos más',collapse:'Ver menos',loaded:'{count} movimientos cargados'}}>
        {Array.from({length:6},(_,i)=><li key={i}><p>T1 · E{i+1}</p><p>Vista · 21 sept 2026</p><button>Nota privada</button> <button>Conversación pública</button></li>)}
        </HistorySeriesCard>)}</div>
      }
      createRoot(document.getElementById('root')).render(<LocaleProvider><Fixture/></LocaleProvider>);
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
  await page.locator('.history-series-card').first().waitFor();
  assert.equal(await page.locator('.tracking-history__list > li').count(), 4);
  const poster = page.locator('.history-series-card__poster').first();
  const bounds = await poster.boundingBox();
  assert.equal(bounds.width, 120);
  assert.equal(bounds.height, 180);
  assert.equal(
    await poster
      .locator('img')
      .evaluate((el) => getComputedStyle(el).objectFit),
    'contain'
  );
  assert.equal(await page.locator('.poster-placeholder').count(), 1);
  await page
    .getByRole('button', { name: 'Ver 4 movimientos más' })
    .first()
    .click();
  assert.equal(await page.locator('.tracking-history__list > li').count(), 8);
  assert.equal(
    await page
      .getByRole('button', { name: 'Nota privada', exact: true })
      .count(),
    8
  );
  assert.equal(
    await page
      .getByRole('button', { name: 'Ver menos' })
      .getAttribute('aria-expanded'),
    'true'
  );
  await page.getByRole('button', { name: 'Ver menos' }).click();
  assert.equal(await page.locator('.tracking-history__list > li').count(), 4);
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth
    ),
    true
  );
  assert.equal(
    await page
      .locator('.tracking-history__list')
      .first()
      .evaluate((el) => el.clientHeight >= el.scrollHeight),
    true
  );
  await mkdir('test-results', { recursive: true });
  await page.screenshot({
    path: 'test-results/history-cards-mobile.png',
    fullPage: true,
  });
  await page.setViewportSize({ width: 1280, height: 844 });
  await page.screenshot({
    path: 'test-results/history-cards-desktop.png',
    fullPage: true,
  });
  assert.deepEqual(errors, []);
  console.log(
    'PASS: 2 visible events per series, independent expansion, preserved actions, 2:3 cover, placeholder, mobile no overflow or nested scrolling.'
  );
} catch (error) {
  console.error('Browser errors:', errors);
  console.error('Page text:', await page.locator('body').innerText());
  throw error;
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
