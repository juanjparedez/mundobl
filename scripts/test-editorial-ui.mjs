import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

// Isolated component rendering with simulated fetch, not a Next HTTP/cache test.
const require = createRequire(import.meta.url);
const out = resolve('test-results/partnership');
await mkdir(out, { recursive: true });
const bundle = await build({
  stdin: {
    contents: `
import React from 'react';
import {createRoot} from 'react-dom/client';
import {LocaleProvider,useLocale} from './src/lib/providers/LocaleProvider';
import {ContentGate} from './src/components/content/ContentGate/ContentGate';
import {ContentNotice} from './src/components/content/ContentNotice/ContentNotice';
import {ClassificationEditor} from './src/components/content/ClassificationEditor/ClassificationEditor';
import {PilotReport} from './src/components/content/PilotReport/PilotReport';
import {recordPilotClick} from './src/lib/pilot-clicks';
import {ThemeProvider,useTheme} from './src/lib/providers/ThemeProvider';
import './src/styles/globals.css';
import './src/styles/dark-mode-fixes.css';
window.calls=[];
window.fetch=async (url, options)=>{window.calls.push({url,body:options?.body});return {ok:true,status:200,json:async()=>({editVersion:1})}};
function Fixture(){const {setLocale}=useLocale();const {setTheme}=useTheme();window.setTestTheme=setTheme;const [mode,setMode]=React.useState('gate');return <>
<select aria-label="Test locale" onChange={e=>setLocale(e.target.value)}>{['es','en','it','de','fr','ja','ko','zh-CN','zh-TW','th'].map(l=><option key={l}>{l}</option>)}</select>
{['gate','editor','report'].map(m=><button key={m} onClick={()=>setMode(m)}>{m}</button>)}
<button onClick={()=>recordPilotClick('series',1)}>Test click</button>
{mode==='gate'?<><ContentGate settings warnings={['SEX','VIOLENCE']}/><ContentNotice rating="UNREVIEWED" warnings={[]}/></>:mode==='editor'?<ClassificationEditor initial={{id:1,title:'Editorial fixture',contentRating:'UNREVIEWED',contentWarnings:[],contentRatingSource:null,editVersion:0}}/>:<PilotReport rows={[{day:'2026-10-12',placement:'series',clicks:12}]}/>}
</>}
createRoot(document.getElementById('root')).render(<LocaleProvider><ThemeProvider><Fixture/></ThemeProvider></LocaleProvider>);
`,
    resolveDir: process.cwd(),
    loader: 'tsx',
  },
  bundle: true,
  write: false,
  outdir: out,
  platform: 'browser',
  jsx: 'automatic',
  define: { 'process.env.NODE_ENV': '"production"', 'process.env': '{}' },
});
const js = bundle.outputFiles.find((f) => f.path.endsWith('.js')).text;
const css = bundle.outputFiles.find((f) => f.path.endsWith('.css')).text;
const html = `<!doctype html><html data-theme="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>${css}</style></head><body><div id="root"></div><script>${js.replaceAll('</script', '<\\/script')}</script></body></html>`;
const path = resolve(out, 'editorial-fixture.html');
await writeFile(path, html);
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
try {
  await page.goto(pathToFileURL(path).href);
  await page
    .getByRole('heading', { name: 'Contenido para mayores de 18' })
    .waitFor();
  await page
    .getByRole('button', { name: 'Tengo 18 años o más y quiero continuar' })
    .click();
  assert.ok(
    (await page.evaluate(() => window.calls)).some(
      (c) => c.url === '/api/content-consent' && JSON.parse(c.body).allow
    )
  );
  await page
    .getByRole('button', { name: 'Volver a pedir confirmación' })
    .click();
  assert.ok(
    (await page.evaluate(() => window.calls)).some(
      (c) => c.url === '/api/content-consent' && !JSON.parse(c.body).allow
    )
  );
  await page.getByRole('button', { name: 'Test click', exact: true }).click();
  await page.getByRole('button', { name: 'Test click', exact: true }).click();
  assert.equal(
    (await page.evaluate(() => window.calls)).filter(
      (c) => c.url === '/api/pilot-clicks'
    ).length,
    1
  );
  const { loadLocaleMessages } = require('../src/i18n/messages.ts');
  for (const locale of [
    'es',
    'en',
    'it',
    'de',
    'fr',
    'ja',
    'ko',
    'zh-CN',
    'zh-TW',
    'th',
  ]) {
    await page.getByLabel('Test locale').selectOption(locale);
    const labels = await loadLocaleMessages(locale);
    await page
      .getByRole('heading', { name: labels.editorial.adultTitle })
      .waitFor();
    assert.ok(!(await page.locator('body').innerText()).includes('editorial.'));
  }
  await page.getByLabel('Test locale').selectOption('es');
  await page.locator('.ant-wave').first().waitFor({ state: 'detached' });
  for (const theme of ['light', 'dark']) {
    await page.evaluate((t) => window.setTestTheme(t), theme);
    for (const width of [320, 390, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      const overflow = await page.evaluate(() =>
        Array.from(document.querySelectorAll('*'))
          .filter((e) => e.getBoundingClientRect().right > innerWidth)
          .map((e) => ({
            tag: e.tagName,
            cls: e.className,
            width: e.getBoundingClientRect().width,
          }))
      );
      assert.deepEqual(overflow, [], theme + ' ' + width);
      if (width !== 320)
        await page.screenshot({
          path: resolve(out, `gate-${theme}-${width}.png`),
          fullPage: true,
          animations: 'disabled',
        });
    }
  }
  await page.getByRole('button', { name: 'editor', exact: true }).click();
  await page.getByRole('button', { name: 'Guardar clasificación' }).click();
  assert.ok(
    (await page.evaluate(() => window.calls)).some(
      (c) => c.url === '/api/admin/series/1/classification'
    )
  );
  await page.screenshot({
    path: resolve(out, 'editor-desktop.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await page.getByRole('button', { name: 'report', exact: true }).click();
  await page.getByRole('heading', { name: 'Piloto GagaOOLala' }).waitFor();
  await page.screenshot({
    path: resolve(out, 'report-desktop.png'),
    fullPage: true,
    animations: 'disabled',
  });
  const mail = require('../src/lib/email-templates.ts').renderWelcomeEmail({
    name: 'Comunidad',
  });
  await writeFile(resolve(out, 'welcome-preview.html'), mail.html);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route('https://**/*', (route) => route.abort());
  await page.setContent(mail.html);
  await page.screenshot({
    path: resolve(out, 'welcome-mobile.png'),
    fullPage: true,
    animations: 'disabled',
  });
  assert.deepEqual(errors, []);
  console.log(
    'PASS: isolated UI, 10 locales, 320/390/1280px light/dark, consent/revoke payloads, click deduplication, editor/report and welcome previews. Fetch simulated; no server or emails.'
  );
} finally {
  await browser.close();
}
