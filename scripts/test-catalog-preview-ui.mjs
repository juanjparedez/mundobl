import assert from 'node:assert/strict';
import { chromium, expect } from '@playwright/test';
import pg from 'pg';
import { encode } from 'next-auth/jwt';
import { mkdirSync } from 'node:fs';
const base = process.env.SERIES_FORM_TEST_BASE_URL || 'http://localhost:3018';
assert(['127.0.0.1', 'localhost'].includes(new URL(base).hostname));
const url = new URL(process.env.DATABASE_URL || '');
assert.equal(url.hostname, '127.0.0.1');
assert.equal(url.port, '55433');
assert.equal(url.pathname, '/mundobl_replay');
const pool = new pg.Pool({ connectionString: url.toString() });
const browser = await chromium.launch();
const ids = [];
const userId = `catalog-local-${Date.now()}`;
const title = `Catalog test ${Date.now()}`;
try {
  for (const [origin, scope, visibility, rating] of [
    ['CURATED', 'PERSONAL', 'VISIBLE', 'GENERAL'],
    ['CURATED', 'PERSONAL', 'HIDDEN', 'GENERAL'],
    ['USER_EMBED', 'WATCHABLE_ONLY', 'VISIBLE', 'GENERAL'],
    ['CURATED', 'WATCHABLE_ONLY', 'VISIBLE', 'GENERAL'],
    ['CURATED', 'PERSONAL', 'VISIBLE', 'ADULT18'],
  ]) {
    const row = await pool.query(
      'INSERT INTO "Series" (title,type,synopsis,"catalogScope",origin,visibility,"contentRating","updatedAt") VALUES ($1,$7,$2,$3,$4,$5,$6,now()) RETURNING id',
      [
        title + ids.length,
        'Sinopsis completa local',
        scope,
        origin,
        visibility,
        rating,
        'serie',
      ]
    );
    ids.push(row.rows[0].id);
  }
  // Invalidate the built catalog through the same authenticated create flow as an editor.
  await pool.query(
    'INSERT INTO "User" (id,name,role,email,"updatedAt") VALUES ($1,$2,$3,$4,now())',
    [userId, 'Catalog test', 'ADMIN', `${userId}@example.invalid`]
  );
  const admin = await browser.newContext();
  await admin.addCookies([
    {
      name: 'authjs.session-token',
      value: await encode({
        secret: process.env.AUTH_SECRET || 'editorial-local-validation-only',
        salt: 'authjs.session-token',
        token: {
          sub: userId,
          id: userId,
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
  const created = await admin.request.post(`${base}/api/series`, {
    data: { title: title + ' invalidation', type: 'serie' },
  });
  assert.equal(created.status(), 201);
  ids.push((await created.json()).id);
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const previewRequests = [];
  page.on('request', (request) => {
    if (request.url().includes('/preview')) previewRequests.push(request.url());
  });
  for (let i = 0; i < 5; i++) {
    const response = await page.request.get(
      `${base}/api/series/${ids[i]}/preview`
    );
    assert.equal(response.status(), [0, 4].includes(i) ? 200 : 404);
    if ([0, 4].includes(i))
      assert.equal(
        (await response.json()).synopsis,
        i === 4 ? null : 'Sinopsis completa local'
      );
  }
  assert.equal(
    (await page.request.get(`${base}/api/series/not-an-id/preview`)).status(),
    404
  );
  await page.goto(`${base}/catalogo?q=${encodeURIComponent(title + '0')}`, {
    timeout: 120000,
  });
  const card = page.locator('.serie-card').filter({ hasText: title + '0' });
  await expect(card).toBeVisible({ timeout: 60000 });
  assert.equal(previewRequests.length, 0, 'listing must not fetch previews');
  const open = card.getByRole('button', { name: 'Vista rápida', exact: true });
  await open.click();
  const modal = page.getByRole('dialog');
  await expect(
    modal.getByText('Sinopsis completa local', { exact: true })
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(modal).not.toBeVisible();
  await open.click();
  await expect(
    modal.getByText('Sinopsis completa local', { exact: true })
  ).toBeVisible();
  assert.equal(previewRequests.length, 1, 'reopening reuses the public text');
  assert(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth
    )
  );
  mkdirSync('test-results/resource-batch', { recursive: true });
  await modal.screenshot({
    path: 'test-results/resource-batch/catalog-preview-mobile.png',
    animations: 'disabled',
  });
  const warm = await page.request.get(`${base}/api/series/${ids[0]}/preview`);
  if (process.env.TEST_ISR === 'true')
    assert.equal(warm.headers()['x-nextjs-cache'], 'HIT');
  const changed = await admin.request.post(
    `${base}/api/series/${ids[0]}/curate`,
    {
      data: {
        fields: ['synopsis'],
        values: { editVersion: 0, synopsis: 'Sinopsis actualizada' },
      },
    }
  );
  assert.equal(changed.status(), 200);
  const refreshed = await page.request.get(
    `${base}/api/series/${ids[0]}/preview`
  );
  assert.equal((await refreshed.json()).synopsis, 'Sinopsis actualizada');
  await admin.close();
  console.log(
    'PASS: public preview boundaries, adult redaction, malformed ID, no eager requests, mobile open/reopen, deduplication and cache invalidation after curation.'
  );
} finally {
  await browser.close();
  if (ids.length)
    await pool.query('DELETE FROM "Series" WHERE id=ANY($1::int[])', [ids]);
  await pool.query('DELETE FROM "Series" WHERE title=$1', [
    title + ' invalidation',
  ]);
  await pool.query(
    'DELETE FROM "SeriesRevision" WHERE "seriesId"=ANY($1::int[])',
    [ids]
  );
  await pool.query('DELETE FROM "AccessLog" WHERE "userId"=$1', [userId]);
  await pool.query('DELETE FROM "User" WHERE id=$1', [userId]);
  await pool.end();
}
