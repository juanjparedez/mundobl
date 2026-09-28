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
    import { CommunityFeed } from './src/app/(app)/comunidad/CommunityFeed/CommunityFeed';
    import './src/styles/variables.css';
    const items = [
      {id:1,title:'Una recomendación para quienes disfrutan historias de amistad',series:{id:11,title:'A long title about friendship and second chances',origin:'CURATED',catalogScope:'PERSONAL'}},
      {id:2,title:null,series:{id:22,title:'A viewing contribution',origin:'USER_EMBED',catalogScope:'WATCHABLE_ONLY'}},
      {id:3,title:'Una reseña pública',series:{id:33,title:'Título'.repeat(30),origin:'CURATED',catalogScope:'PERSONAL'}}
    ];
    createRoot(document.getElementById('root')).render(<LocaleProvider><CommunityFeed items={items} page={2} search="A & B" hasNext/></LocaleProvider>);
  `,
    resolveDir: process.cwd(),
    loader: 'tsx',
  },
  plugins: [
    {
      name: 'framework-fixtures',
      setup(b) {
        b.onResolve(
          { filter: /^(next\/navigation|next-auth\/react)$/ },
          (args) => ({ path: args.path, namespace: 'fixture' })
        );
        b.onLoad({ filter: /.*/, namespace: 'fixture' }, (args) => ({
          contents:
            args.path === 'next/navigation'
              ? 'export const useRouter=()=>({push(){},refresh(){}});'
              : 'export const useSession=()=>({data:null});export const signIn=()=>{};',
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
try {
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page
    .getByRole('heading', { name: 'Las historias siguen acá', exact: true })
    .waitFor();
  await page.getByText('Título oculto por spoilers', { exact: true }).waitFor();
  const links = page.locator('.community-card__footer a');
  assert.equal(await links.count(), 3);
  assert.match(
    await links.nth(0).getAttribute('href'),
    /^\/series\/11-.*#series-section-reviews$/
  );
  assert.equal(
    await links.nth(1).getAttribute('href'),
    '/ver/22-a-viewing-contribution#series-section-reviews'
  );
  assert.equal(
    await page
      .getByRole('link', { name: 'Anterior', exact: true })
      .getAttribute('href'),
    '/comunidad?q=A+%26+B'
  );
  assert.equal(
    await page
      .getByRole('link', { name: 'Siguiente', exact: true })
      .getAttribute('href'),
    '/comunidad?q=A+%26+B&page=3'
  );
  await mkdir('test-results', { recursive: true });
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 850 });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth
      ),
      false
    );
    await page.screenshot({
      path: `test-results/community-populated-${width}.png`,
      fullPage: true,
    });
  }
  assert.equal(
    await page
      .getByRole('textbox', { name: 'Buscar una serie', exact: true })
      .inputValue(),
    'A & B'
  );
  await page
    .getByRole('textbox', { name: 'Buscar una serie', exact: true })
    .fill('Una serie');
  await page
    .getByRole('button', { name: 'Buscar una serie', exact: true })
    .click();
  await page.waitForURL('**/comunidad?view=all&q=Una+serie');
  assert.deepEqual(errors, []);
  console.log(
    'PASS: actual community component and translations, spoiler placeholder, catalog/viewing destinations, long titles and mobile/desktop widths. Synthetic content; no authenticated backend flow.'
  );
} catch (error) {
  console.error('Browser errors:', errors);
  console.error('Page text:', await page.locator('body').innerText());
  throw error;
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
