import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { chromium } from '@playwright/test';
import { encode } from 'next-auth/jwt';
import pg from 'pg';

const base = 'http://localhost:3002';
const connection = new URL(process.env.DATABASE_URL);
assert.equal(connection.hostname, '127.0.0.1');
assert.equal(connection.port, '55433');
assert.equal(connection.pathname, '/mundobl_replay');
const pool = new pg.Pool({ connectionString: connection.href });
await pool.query(
  `INSERT INTO "Series" (title, type, "basedOn", "updatedAt") VALUES ('Based-on UI Manga', 'serie', 'Manga', now()), ('Based-on UI GM', 'serie', 'GM', now())`
);
await pool.end();
const cookie = async (role) => ({
  name: 'authjs.session-token',
  value: await encode({
    secret: 'based-on-local-test-only',
    salt: 'authjs.session-token',
    token: {
      sub: 'based-on-admin',
      id: 'based-on-admin',
      name: 'Local test',
      role,
      banned: false,
      roleCheckedAt: Date.now(),
    },
    maxAge: 3600,
  }),
  domain: 'localhost',
  path: '/',
});
const browser = await chromium.launch();
try {
  const context = await browser.newContext();
  assert.equal(
    (await context.request.get(base + '/api/admin/based-on')).status(),
    401
  );
  await context.addCookies([await cookie('VISITOR')]);
  assert.equal(
    (
      await context.request.patch(base + '/api/admin/based-on', { data: {} })
    ).status(),
    403
  );
  await context.addCookies([await cookie('ADMIN')]);
  assert.equal(
    (
      await context.request.patch(base + '/api/admin/based-on', {
        data: { action: 'remove' },
      })
    ).status(),
    400
  );
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(base + '/admin/tags?tab=based-on');
  const row = (value) =>
    page
      .getByRole('row')
      .filter({ has: page.getByText(JSON.stringify(value), { exact: true }) });
  await row('Manga')
    .getByRole('button', { name: 'Fusionar', exact: true })
    .click();
  const dialog = page.getByRole('dialog');
  await dialog.locator('.ant-select').click();
  await page.getByTitle('manga', { exact: true }).click();
  await dialog.getByRole('button', { name: 'Aplicar', exact: true }).click();
  await dialog.waitFor({ state: 'hidden' });
  assert.equal(
    (
      await (await context.request.get(base + '/api/admin/based-on')).json()
    ).some((entry) => entry.value === 'Manga'),
    false
  );
  await row('GM')
    .getByRole('button', { name: 'Renombrar', exact: true })
    .click();
  await dialog.getByRole('textbox').fill('Juego móvil');
  await dialog.getByRole('button', { name: 'Aplicar', exact: true }).click();
  await dialog.waitFor({ state: 'hidden' });
  await row('Juego móvil')
    .getByRole('button', { name: 'Quitar clasificación', exact: true })
    .click();
  await dialog
    .getByText(
      'Se vaciará Basado en en estas fichas. Las fichas no se eliminan.',
      { exact: true }
    )
    .waitFor();
  await dialog.getByRole('button', { name: 'Aplicar', exact: true }).click();
  await dialog.waitFor({ state: 'hidden' });
  mkdirSync('test-results/based-on', { recursive: true });
  await page.screenshot({
    path: 'test-results/based-on/desktop.png',
    fullPage: true,
  });
  await page.setViewportSize({ width: 375, height: 812 });
  await page
    .getByRole('button', { name: 'Fusionar', exact: true })
    .first()
    .click();
  await dialog.waitFor({ state: 'visible' });
  await page.screenshot({
    path: 'test-results/based-on/mobile.png',
    animations: 'disabled',
    fullPage: true,
  });
  assert.deepEqual(errors, []);
  console.log(
    'PASS: 401/403 permissions, 400 validation, UI merge/rename/clear, desktop/mobile, no page errors.'
  );
} finally {
  await browser.close();
}
