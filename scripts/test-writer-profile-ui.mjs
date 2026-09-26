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
      import { ConfigProvider, theme } from 'antd';
      import { LocaleProvider } from './src/lib/providers/LocaleProvider';
      import { PeopleIndexShell } from './src/app/(app)/actores/PeopleIndexShell';
      import { WriterCredits } from './src/components/series/WriterCredits/WriterCredits';
      import { WriterProfile } from './src/app/(app)/guionistas/[id]/WriterProfile/WriterProfile';
      import './src/styles/variables.css';
      const writer={id:1,name:'Guionista de prueba con nombre extenso',aliases:['Alias'],nationality:'Tailandia',biography:'Biografía de prueba.',imageUrl:null,imageAttribution:null,imageLicense:null,imdbUrl:'javascript:alert(1)',mdlUrl:null,wikiUrl:'https://example.invalid/person',bioSourceUrl:null,series:[{href:'/series/1-fixture',sourceUrl:'https://example.invalid/credit',series:{id:1,title:'Obra del catálogo',year:2020}},{href:'/ver/2-fixture',sourceUrl:null,series:{id:2,title:'Obra para ver',year:2026}}]};
      createRoot(document.getElementById('root')).render(<ConfigProvider theme={{algorithm:theme.darkAlgorithm}}><LocaleProvider><PeopleIndexShell titleKey="writerProfile.indexTitle" subtitleKey="writerProfile.indexDescription" countKey="peopleIndex.creditsCount" current="/guionistas" items={[{id:8,name:"Índice de prueba",href:"/guionistas/8",count:2,indexable:true,searchTerms:["Alias secreto"]}]} /><WriterCredits credits={[{writer:{id:1,name:writer.name}}]}/><WriterCredits credits={[]}/><WriterProfile writer={writer}/></LocaleProvider></ConfigProvider>);
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
      ? 'text/javascript; charset=utf-8'
      : req.url === '/bundle.css'
        ? 'text/css; charset=utf-8'
        : 'text/html; charset=utf-8'
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
    .getByRole('heading', { name: 'Guionista de prueba con nombre extenso' })
    .waitFor();
  assert.equal(
    await page
      .getByRole('link', { name: 'Obra del catálogo' })
      .getAttribute('href'),
    '/series/1-fixture'
  );
  assert.equal(
    await page
      .getByRole('link', { name: 'Obra para ver' })
      .getAttribute('href'),
    '/ver/2-fixture'
  );
  assert.equal(await page.locator('a[href^="javascript:"]').count(), 0);
  assert.equal(
    await page
      .getByRole('link', { name: 'Fuente del crédito' })
      .getAttribute('href'),
    'https://example.invalid/credit'
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
    path: 'test-results/writer-profile-mobile.png',
    fullPage: true,
  });
  assert.equal(await page.locator('.writer-credits').count(), 1);
  assert.equal(
    await page.locator('.writer-credits a').getAttribute('href'),
    '/guionistas/1'
  );
  const search = page.locator(
    '.people-filters__search input, input.people-filters__search'
  );
  await search.fill('Alias secreto');
  await page.getByRole('link', { name: /Índice de prueba/ }).waitFor();
  await search.fill('sin coincidencias');
  assert.equal(
    await page.getByRole('link', { name: /Índice de prueba/ }).count(),
    0
  );
  await search.fill('');
  assert.deepEqual(errors, []);
  console.log(
    'PASS: writer profile sources, safe URLs, catalog/watchable destinations and mobile layout. Synthetic fixture.'
  );
} catch (error) {
  console.error('Browser errors:', errors);
  throw error;
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
