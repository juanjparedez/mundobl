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
    import { RuntimeMaintenance } from './src/components/admin/RuntimeMaintenance/RuntimeMaintenance';
    import { MESSAGES } from './src/i18n/messages';
    import './src/styles/variables.css';
    createRoot(document.getElementById('root')).render(
      <ConfigProvider theme={{algorithm:theme.darkAlgorithm}}><RuntimeMaintenance labels={MESSAGES.es.runtimeMaintenance}/></ConfigProvider>
    );`,
    resolveDir: process.cwd(),
    loader: 'tsx',
  },
  bundle: true,
  write: false,
  outdir: 'test-results/runtime-maintenance-bundle',
  platform: 'browser',
  jsx: 'automatic',
  define: { 'process.env.NODE_ENV': '"production"', 'process.env': '{}' },
});
const js = bundle.outputFiles.find((file) => file.path.endsWith('.js')).text;
const css = bundle.outputFiles.find((file) => file.path.endsWith('.css')).text;
let reads = 0;
let fail = false;
let configured = true;
const writes = [];
const server = createServer(async (req, res) => {
  if (req.url.startsWith('/api/admin/runtime/maintenance')) {
    res.setHeader('Content-Type', 'application/json');
    if (req.method === 'POST') {
      let body = '';
      for await (const chunk of req) body += chunk;
      const payload = JSON.parse(body);
      writes.push(payload);
      res.end(
        JSON.stringify({
          ok: true,
          ...(payload.action === 'purgeLogs'
            ? { result: { deleted: 5, done: false } }
            : {}),
        })
      );
    } else {
      reads++;
      if (fail) {
        res.statusCode = 502;
        res.end('{}');
        return;
      }
      const previous = new URL(req.url, 'http://localhost').searchParams.has(
        'until'
      );
      res.end(
        JSON.stringify({
          configured,
          r2Configured: false,
          scanned: 10,
          candidates:
            previous || !configured
              ? []
              : [
                  {
                    id: 'dpl_old',
                    url: 'mundobl-old-fixture.vercel.app',
                    created: 1700000000000,
                    environment: 'preview',
                  },
                ],
          hasMore: !previous,
          next: previous ? null : 1690000000000,
        })
      );
    }
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
        : '<!doctype html><html data-theme="dark"><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/bundle.css"><style>*{box-sizing:border-box}body{margin:0;padding:16px;background:var(--bg-base);color:var(--text-primary);font-family:sans-serif}#root{min-width:0}</style></head><body><div id="root"></div><script src="/bundle.js"></script></body></html>'
  );
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.getByRole('button', { name: 'Revisar previews' }).waitFor();
  assert.equal(reads, 0, 'No automatic provider requests');
  await page.getByRole('button', { name: 'Revisar previews' }).click();
  await page
    .getByText('mundobl-old-fixture.vercel.app', { exact: true })
    .waitFor();
  await page
    .locator('tbody')
    .getByRole('button', { name: 'Eliminar', exact: true })
    .click();
  await page.getByText('¿Eliminar este deployment y su URL?').waitFor();
  assert.equal(writes.length, 0, 'Review must not delete');
  await page.getByRole('button', { name: 'Cancelar' }).click();
  assert.equal(writes.length, 0);
  await page
    .locator('tbody')
    .getByRole('button', { name: 'Eliminar', exact: true })
    .click();
  await page
    .locator('.ant-popconfirm')
    .getByRole('button', { name: 'Eliminar', exact: true })
    .click();
  await page.getByText('Completado', { exact: true }).waitFor();
  assert.deepEqual(writes[0], {
    action: 'deleteDeployment',
    deploymentId: 'dpl_old',
  });
  assert.equal(await page.locator('tbody tr[data-row-key]').count(), 0);
  await page.getByRole('button', { name: 'Revisar anteriores' }).click();
  await page.waitForFunction(
    () => !document.body.textContent.includes('Procesando…')
  );
  assert.equal(
    await page.getByRole('button', { name: 'Revisar anteriores' }).count(),
    0
  );
  await page
    .getByRole('button', { name: 'Limpiar logs vencidos', exact: true })
    .click();
  await page
    .locator('.ant-popconfirm')
    .getByRole('button', { name: 'Limpiar logs vencidos' })
    .click();
  await page.getByText(/Eliminados: 5/).waitFor();
  assert.equal(writes[1].action, 'purgeLogs');
  fail = true;
  await page.getByRole('button', { name: 'Revisar producción' }).click();
  await page.getByText(/No se pudo confirmar/).waitFor();
  assert.equal(
    await page.getByRole('button', { name: 'Eliminar', exact: true }).count(),
    0
  );
  fail = false;
  configured = false;
  await page.getByRole('button', { name: 'Revisar producción' }).click();
  await page
    .getByText(/La integración de Vercel no está configurada/)
    .waitFor();
  assert.equal(
    await page.getByRole('button', { name: 'Eliminar', exact: true }).count(),
    0
  );
  configured = true;
  await page.getByRole('button', { name: 'Revisar previews' }).click();
  await page
    .getByText('mundobl-old-fixture.vercel.app', { exact: true })
    .waitFor();
  assert(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth
    ),
    'No page overflow on mobile'
  );
  await mkdir('test-results', { recursive: true });
  await page.screenshot({
    path: 'test-results/runtime-maintenance-mobile.png',
    fullPage: true,
  });
  await page.setViewportSize({ width: 1280, height: 960 });
  await page.screenshot({
    path: 'test-results/runtime-maintenance-desktop.png',
    fullPage: true,
  });
  assert.deepEqual(errors, []);
  console.log(
    'Runtime maintenance UI: explicit review, cancel/confirm, pagination, partial cleanup, provider failure, missing config and mobile layout passed.'
  );
} finally {
  if (browser) await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
