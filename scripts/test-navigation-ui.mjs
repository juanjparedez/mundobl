import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { chromium, expect } from '@playwright/test';
import { encode } from 'next-auth/jwt';
import pg from 'pg';

const base = process.env.NAVIGATION_TEST_BASE_URL || 'http://localhost:3018';
assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
const connection = new URL(process.env.DATABASE_URL ?? '');
assert.equal(connection.hostname, '127.0.0.1');
assert.equal(connection.port, '55433');
assert.equal(connection.pathname, '/mundobl_replay');
const pool = new pg.Pool({ connectionString: connection.toString() });
const run = `Navigation ${Date.now()}`;
const userId = `navigation-${Date.now()}`;
const ids = [];
const browser = await chromium.launch();
mkdirSync('test-results/navigation', { recursive: true });
try {
  const created = await pool.query(
    "INSERT INTO \"Series\" (title,type,synopsis,\"updatedAt\") SELECT $1 || ' ' || lpad(n::text,2,'0'),'serie','Local navigation fixture',now() FROM generate_series(1,60) n RETURNING id",
    [run]
  );
  ids.push(...created.rows.map((row) => row.id));
  for (const id of ids.slice(0, 12)) {
    const season = (
      await pool.query(
        'INSERT INTO "Season" ("seriesId","seasonNumber","episodeCount","updatedAt") VALUES ($1,1,1,now()) RETURNING id',
        [id]
      )
    ).rows[0].id;
    await pool.query(
      'INSERT INTO "Episode" ("seasonId","episodeNumber","embedUrl","embedPlatform","updatedAt") VALUES ($1,1,$2,\'YouTube\',now())',
      [season, 'https://www.youtube.com/watch?v=test']
    );
  }
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    extraHTTPHeaders: { 'Cache-Control': 'no-cache' },
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route('https://www.youtube.com/**', (route) => route.abort());
  await page.goto(base + '/catalogo?q=' + encodeURIComponent(run) + '&page=2', {
    waitUntil: 'networkidle',
    timeout: 120000,
  });
  await expect(
    page.getByPlaceholder('Buscar por título, país o tipo...')
  ).toHaveValue(run);
  await expect(
    page.getByRole('button', { name: new RegExp('^' + run) }).first()
  ).toBeVisible({ timeout: 15000 });
  console.log(
    'Cards',
    await page.getByRole('button', { name: new RegExp('^' + run) }).count()
  );
  await page.getByRole('button', { name: 'Ok, entendido' }).click();
  await page.evaluate(() => window.scrollTo(0, 500));
  const originalUrl = page.url();
  await page
    .getByRole('button', { name: new RegExp('^' + run) })
    .last()
    .click();
  await page.waitForURL(/\/series\//);
  await page.locator('.mb-back-to-catalog').first().click();
  await expect(page).toHaveURL(originalUrl);
  await expect(
    page.getByPlaceholder('Buscar por título, país o tipo...')
  ).toHaveValue(run);
  const scroll = await page.evaluate(() => ({
    saved: history.state.__mb_page_scroll?.y,
    current: scrollY,
  }));
  assert(scroll.saved > 0, JSON.stringify(scroll));
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(scroll.saved);
  await page.reload({ waitUntil: 'networkidle' });
  await expect(
    page.getByPlaceholder('Buscar por título, país o tipo...')
  ).toHaveValue(run);
  const detailPage = await context.newPage();
  await detailPage.goto(base + '/series/' + ids[0] + '#test', {
    waitUntil: 'networkidle',
  });
  await detailPage.locator('.mb-back-to-catalog').first().click();
  await expect(detailPage).toHaveURL(base + '/catalogo');
  await expect(
    detailPage.getByPlaceholder('Buscar por título, país o tipo...')
  ).toBeVisible();
  await detailPage.close();
  await page.locator('.ant-pagination-item-1').first().click();
  await expect(page).toHaveURL((url) => !url.searchParams.has('page'));
  await page.goBack();
  await expect(page).toHaveURL((url) => url.searchParams.get('page') === '2');
  await expect(
    page.getByRole('button', { name: run + ' 49', exact: true })
  ).toBeVisible();
  await page.goForward();
  await expect(page).toHaveURL((url) => !url.searchParams.has('page'));
  await expect(
    page.getByRole('button', { name: run + ' 01', exact: true })
  ).toBeVisible();
  console.log(
    'Catalog filters, page, scroll, reload, direct fallback and native back/forward passed'
  );
  await page
    .locator('.app-sidebar')
    .getByText('Personas y productoras', { exact: true })
    .click();
  const dialog = page.getByRole('dialog');
  for (const href of ['/actores', '/directores', '/productoras'])
    await expect(dialog.locator(`a[href="${href}"]`)).toBeVisible();
  await page.screenshot({
    animations: 'disabled',
    path: 'test-results/navigation/desktop-drawer.png',
  });
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await page.goto(
    base + '/ver?q=' + encodeURIComponent(run) + '&view=grid&curated=1',
    { waitUntil: 'networkidle' }
  );
  console.log(
    'Ver inputs',
    await page
      .locator('input')
      .evaluateAll((els) => els.map((el) => el.placeholder))
  );
  console.log(
    'Ver links',
    await page
      .locator('a[href^="/ver/"]')
      .filter({ hasNotText: 'Agregar' })
      .evaluateAll((els) =>
        els.slice(0, 3).map((el) => el.getAttribute('href'))
      )
  );
  await expect(
    page.locator('a[href^="/ver/"]').filter({ hasNotText: 'Agregar' }).first()
  ).toBeVisible();
  await page
    .locator('a[href^="/ver/"]')
    .filter({ hasNotText: 'Agregar' })
    .first()
    .click();
  await page.waitForURL(/\/ver\/\d/);
  await page.locator('.mb-back-to-catalog').first().click();
  await expect(page).toHaveURL(
    (url) =>
      url.pathname === '/ver' &&
      url.searchParams.get('q') === run &&
      url.searchParams.get('view') === 'grid' &&
      url.searchParams.get('curated') === '1'
  );
  await expect(page.getByRole('checkbox')).toBeChecked();
  console.log('Ver return preserves query, grid and curated filter');
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    await page
      .locator('.bottom-nav')
      .getByRole('button', { name: 'Más', exact: true })
      .click();
    const drawer = page.getByRole('dialog');
    await drawer
      .getByRole('button', { name: /Personas y productoras/ })
      .click();
    for (const href of ['/actores', '/directores', '/productoras'])
      await expect(drawer.locator(`a[href="${href}"]`)).toBeVisible();
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      ),
      `overflow at ${width}`
    );
    await drawer.locator('a[href="/actores"]').click({ trial: true });
    await page.screenshot({
      animations: 'disabled',
      path: `test-results/navigation/mobile-${width}.png`,
    });
    await page.keyboard.press('Escape');
    await expect(drawer).not.toBeVisible();
  }
  console.log('Mobile drawers 320/390/768, destinations and Escape passed');
  await pool.query(
    'INSERT INTO "User" (id,name,email,role,"updatedAt") VALUES ($1,\'Navigation admin\',$2,\'ADMIN\',now())',
    [userId, userId + '@example.invalid']
  );
  await context.addCookies([
    {
      name: 'authjs.session-token',
      value: await encode({
        secret: process.env.AUTH_SECRET || 'editorial-local-validation-only',
        salt: 'authjs.session-token',
        token: {
          sub: userId,
          id: userId,
          name: 'Navigation admin',
          role: 'ADMIN',
          banned: false,
          roleCheckedAt: Date.now(),
        },
        maxAge: 3600,
      }),
      domain: new URL(base).hostname,
      path: '/',
    },
  ]);
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(base + '/admin/series', {
    waitUntil: 'networkidle',
    timeout: 120000,
  });
  const buttons = page.locator('.admin-nav button');
  assert((await buttons.count()) > 0);
  for (let i = 0; i < (await buttons.count()); i++) {
    await buttons.nth(i).click();
    await expect(page.getByRole('dialog').locator('a').first()).toBeVisible();
    await page.keyboard.press('Escape');
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('.admin-nav-mobile-trigger').click();
  await expect(page.getByRole('dialog').locator('a').first()).toBeVisible();
  await page.screenshot({
    animations: 'disabled',
    path: 'test-results/navigation/admin-mobile.png',
  });
  await page.keyboard.press('Escape');
  console.log('Admin group drawers desktop and mobile passed');
  assert.deepEqual(errors, []);
  await context.close();
} finally {
  await browser.close();
  if (ids.length)
    await pool.query('DELETE FROM "Series" WHERE id=ANY($1::int[])', [ids]);
  await pool.query('DELETE FROM "User" WHERE id=$1', [userId]);
  await pool.end();
}
