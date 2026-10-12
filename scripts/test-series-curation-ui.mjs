import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { chromium, expect } from '@playwright/test';
import { encode } from 'next-auth/jwt';
import pg from 'pg';

const base = process.env.SERIES_FORM_TEST_BASE_URL || 'http://localhost:3002';
assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
const url = new URL(process.env.DATABASE_URL ?? '');
assert.equal(url.hostname, '127.0.0.1');
assert.equal(url.port, '55433');
assert.equal(url.pathname, '/mundobl_replay');
const pool = new pg.Pool({ connectionString: url.toString() });
const userId = `curation-test-${Date.now()}`;
const title = `Only Friends test ${Date.now()}`;
const browser = await chromium.launch();
let id;
try {
  await pool.query(
    'INSERT INTO "User" (id,name,role,email,"updatedAt") VALUES ($1,$2,$3,$4,now())',
    [userId, 'Admin local', 'ADMIN', `${userId}@example.invalid`]
  );
  id = (
    await pool.query(
      'INSERT INTO "Series" (title,type,synopsis,"catalogScope","updatedAt") VALUES ($1,$2,$3,$4,now()) RETURNING id',
      [title, 'serie', 'Sinopsis importada', 'WATCHABLE_ONLY']
    )
  ).rows[0].id;
  const seasonId = (
    await pool.query(
      'INSERT INTO "Season" ("seriesId","seasonNumber","episodeCount","updatedAt") VALUES ($1,1,1,now()) RETURNING id',
      [id]
    )
  ).rows[0].id;
  const episodeId = (
    await pool.query(
      'INSERT INTO "Episode" ("seasonId","episodeNumber","embedUrl","updatedAt") VALUES ($1,1,$2,now()) RETURNING id',
      [seasonId, 'https://www.youtube.com/watch?v=test']
    )
  ).rows[0].id;
  await pool.query(
    'INSERT INTO "WatchLink" ("seriesId",platform,url) VALUES ($1,$2,$3)',
    [id, 'YouTube', 'https://youtube.com/watch?v=existing']
  );
  const context = await browser.newContext({
    locale: 'es-AR',
    viewport: { width: 1400, height: 1000 },
  });
  assert.equal(
    (await context.request.get(`${base}/api/series/${id}/curate`)).status(),
    401
  );
  const cookie = async (role) => ({
    name: 'authjs.session-token',
    value: await encode({
      secret: process.env.AUTH_SECRET || 'curation-local-test-only',
      salt: 'authjs.session-token',
      token: {
        sub: userId,
        id: userId,
        name: 'Admin local',
        role,
        banned: false,
        roleCheckedAt: Date.now(),
      },
      maxAge: 3600,
    }),
    domain: new URL(base).hostname,
    path: '/',
  });
  await context.addCookies([await cookie('VISITOR')]);
  assert.equal(
    (
      await context.request.post(`${base}/api/series/${id}/curate`, {
        data: {},
      })
    ).status(),
    403
  );
  await context.addCookies([await cookie('ADMIN')]);
  const duplicate = await context.request.post(`${base}/api/series`, {
    data: { title: title.toLowerCase(), type: 'serie' },
  });
  assert.equal(duplicate.status(), 409);
  assert.equal(
    (await duplicate.json()).existingSeries.catalogScope,
    'WATCHABLE_ONLY'
  );
  const page = await context.newPage();
  page.setDefaultTimeout(30000);
  page.on('dialog', (dialog) => dialog.accept());
  await page.goto(`${base}/admin/series/nueva`, { timeout: 120000 });
  await expect(page.locator('#title')).toBeVisible({ timeout: 90000 });
  await page.locator('#title').fill(title);
  await page.locator('#synopsis').fill('Sinopsis curada por Flor');
  await expect(
    page.getByText('Borrador guardado en este navegador', { exact: true })
  ).toBeVisible();
  await page.reload();
  await page
    .getByRole('button', { name: 'Recuperar', exact: true })
    .click({ timeout: 30000 });
  await expect(page.locator('#title')).toHaveValue(title);
  await expect(page.locator('#synopsis')).toHaveValue(
    'Sinopsis curada por Flor'
  );
  await page
    .getByRole('button', { name: 'Comparar datos', exact: true })
    .click();
  const dialog = page.getByRole('dialog');
  await expect(
    dialog.getByText('Sinopsis importada', { exact: true })
  ).toBeVisible();
  await expect(
    dialog.getByText('Sinopsis curada por Flor', { exact: true })
  ).toBeVisible();
  mkdirSync('test-results/series-curation', { recursive: true });
  await dialog.screenshot({
    path: 'test-results/series-curation/comparison.png',
  });
  await dialog
    .getByRole('button', { name: 'Guardar en la ficha existente', exact: true })
    .click();
  await expect(page).toHaveURL(new RegExp(`/series/${id}`), { timeout: 60000 });
  const saved = (
    await pool.query(
      'SELECT title,synopsis,"catalogScope","editVersion" FROM "Series" WHERE id=$1',
      [id]
    )
  ).rows[0];
  assert.equal(saved.synopsis, 'Sinopsis curada por Flor');
  assert.equal(saved.catalogScope, 'PERSONAL');
  assert.equal(saved.editVersion, 1);
  assert.equal(
    (
      await pool.query(
        'SELECT id FROM "Episode" WHERE id=$1 AND "seasonId"=$2',
        [episodeId, seasonId]
      )
    ).rowCount,
    1
  );
  assert.equal(
    (await pool.query('SELECT id FROM "WatchLink" WHERE "seriesId"=$1', [id]))
      .rowCount,
    1
  );
  assert.equal(
    (
      await pool.query('SELECT id FROM "SeriesRevision" WHERE "seriesId"=$1', [
        id,
      ])
    ).rowCount,
    1
  );
  const draftKey = `mundobl.series-draft.v1:${userId}:create:new`;
  assert.equal(
    await page.evaluate((key) => localStorage.getItem(key), draftKey),
    null
  );
  const stale = await context.request.post(`${base}/api/series/${id}/curate`, {
    data: {
      fields: ['synopsis'],
      values: { title, synopsis: 'Vieja', editVersion: 0 },
    },
  });
  assert.equal(stale.status(), 409);
  assert.equal((await stale.json()).code, 'EDIT_CONFLICT');

  // Restoring an edit draft retains its original version, even after another edit.
  await page.goto(`${base}/admin/series/${id}/editar`);
  await expect(page.locator('#synopsis')).toHaveValue(
    'Sinopsis curada por Flor'
  );
  await page.locator('#synopsis').fill('Borrador de edición');
  await expect(
    page.getByText('Borrador guardado en este navegador', { exact: true })
  ).toBeVisible();
  await pool.query(
    'UPDATE "Series" SET synopsis=$1,"editVersion"="editVersion"+1 WHERE id=$2',
    ['Edición más reciente', id]
  );
  await page.reload();
  await page.getByRole('button', { name: 'Recuperar', exact: true }).click();
  await expect(page.locator('#synopsis')).toHaveValue('Borrador de edición');
  const responsePromise = page.waitForResponse(
    (r) =>
      r.url().endsWith(`/api/series/${id}`) && r.request().method() === 'PUT'
  );
  await page.locator('button[type=submit]').last().click();
  assert.equal((await responsePromise).status(), 409);
  assert.equal(
    (await pool.query('SELECT synopsis FROM "Series" WHERE id=$1', [id]))
      .rows[0].synopsis,
    'Edición más reciente'
  );
  assert.ok(
    await page.evaluate(
      (key) => localStorage.getItem(key),
      `mundobl.series-draft.v1:${userId}:edit:${id}`
    )
  );
  console.log(
    'PASS: auth, hidden duplicate, draft reload, comparison, curated precedence, stable episode/link IDs, revision, stale writes rejected, failed-save draft retained.'
  );
} finally {
  await browser.close();
  if (id) await pool.query('DELETE FROM "Series" WHERE id=$1', [id]);
  await pool.query('DELETE FROM "User" WHERE id=$1', [userId]);
  await pool.end();
}
