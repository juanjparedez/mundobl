import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { createServer } from 'node:http';
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

// Isolated rendering of the real field inside Ant Design Form; synthetic APIs only.
const bundle = await build({
  stdin: {
    contents: `
    import React from 'react';
    import { createRoot } from 'react-dom/client';
    import { Form, Button } from 'antd';
    import { ContributionMetadataField } from './src/components/series/ContributionMetadataField/ContributionMetadataField';
    const labels = { search: 'Find existing names', error: 'Could not load names', retry: 'Retry' };
    function Fixture() {
      const [saved, setSaved] = React.useState(null);
      return <Form initialValues={{ actors: ['Unreviewed Actor'], studio: 'Known Studio' }} onFinish={setSaved}>
        <Form.Item label="Cast" name="actors"><ContributionMetadataField kind="actors" multiple labels={labels} /></Form.Item>
        <Form.Item label="Studio" name="studio"><ContributionMetadataField kind="productionCompanies" labels={labels} /></Form.Item>
        <Button htmlType="submit">Save fixture</Button>
        <output>{JSON.stringify(saved)}</output>
      </Form>;
    }
    createRoot(document.getElementById('root')).render(<Fixture />);
  `,
    resolveDir: process.cwd(),
    loader: 'tsx',
  },
  bundle: true,
  write: false,
  outdir: 'test-results/contribution-bundle',
  platform: 'browser',
  jsx: 'automatic',
  define: { 'process.env.NODE_ENV': '"production"' },
});
const js = bundle.outputFiles.find((file) => file.path.endsWith('.js')).text;
const css = bundle.outputFiles.find((file) => file.path.endsWith('.css')).text;
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
        : '<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/bundle.css"></head><body><div id="root"></div><script src="/bundle.js"></script></body></html>'
  );
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
let failCount = 0;
await page.route('**/api/contribution-metadata?**', async (route) => {
  const query = new URL(route.request().url()).searchParams;
  if (query.get('q') === 'retry' && failCount++ === 0) {
    await route.fulfill({
      status: 503,
      json: { code: 'METADATA_UNAVAILABLE' },
    });
    return;
  }
  const names =
    query.get('kind') === 'productionCompanies'
      ? ['Known Studio']
      : query.get('q') === 'retry'
        ? ['Recovered Actor']
        : ['Known Actor'];
  await route.fulfill({ json: { names } });
});
try {
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  const cast = page.getByRole('combobox', { name: 'Cast' });
  await cast.fill('Known');
  await page.getByTitle('Known Actor', { exact: true }).click();
  // Unreviewed initial suggestions stay visible until the user corrects them.
  await page
    .getByTitle('Unreviewed Actor', { exact: true })
    .locator('.ant-select-selection-item-remove')
    .click();
  await page.getByRole('button', { name: 'Save fixture' }).click();
  await page.waitForFunction(() =>
    document.querySelector('output')?.textContent?.includes('Known Actor')
  );
  assert.deepEqual(JSON.parse(await page.locator('output').textContent()), {
    actors: ['Known Actor'],
    studio: 'Known Studio',
  });
  await cast.fill('retry');
  await page.getByText('Could not load names', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Retry', exact: true }).click();
  await page.getByTitle('Recovered Actor', { exact: true }).click();
  await page.getByRole('button', { name: 'Save fixture' }).click();
  await page.waitForFunction(() =>
    document.querySelector('output')?.textContent?.includes('Recovered Actor')
  );
  assert.deepEqual(
    JSON.parse(await page.locator('output').textContent()).actors,
    ['Known Actor', 'Recovered Actor']
  );
  // The debug JSON is intentionally unstyled; verify the production field itself.
  const field = await page
    .locator('.contribution-metadata-field')
    .first()
    .boundingBox();
  assert.ok(field && field.width >= 300 && field.x + field.width <= 390);
  await mkdir('test-results', { recursive: true });
  await page.screenshot({
    path: 'test-results/contribution-metadata-field.png',
    fullPage: true,
  });
  assert.deepEqual(errors, []);
  console.log(
    'PASS: actual metadata field, accessible form labels, multiple selection, preserved unreviewed values, failure and retry, and mobile width. APIs simulated.'
  );
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
