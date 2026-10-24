import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { chromium } from '@playwright/test';
import { encode } from 'next-auth/jwt';
import pg from 'pg';

// Corre contra `next dev -p 3002` con AUTH_SECRET=onboarding-local-test-only.
const base = 'http://localhost:3002';
const connection = new URL(process.env.DATABASE_URL);
assert.equal(connection.hostname, '127.0.0.1');
assert.equal(connection.port, '55433');
assert.equal(connection.pathname, '/mundobl_replay');

const PREFIX = 'Onboarding UI';
const USER_ID = 'onboarding-ui-user';
const year = new Date().getUTCFullYear();
const pool = new pg.Pool({ connectionString: connection.href });

async function seed() {
  await pool.query(
    `INSERT INTO "User" (id, email, role, "updatedAt") VALUES ($1, $2, 'VISITOR', now())`,
    [USER_ID, `${USER_ID}@example.test`]
  );
  for (const title of ['Uno', 'Dos', 'Tres']) {
    const {
      rows: [series],
    } = await pool.query(
      `INSERT INTO "Series" (title, type, origin, "catalogScope", visibility, "airDays", year, "updatedAt")
       VALUES ($1, 'serie', 'CURATED', 'PERSONAL', 'VISIBLE', 'lunes', $2, now()) RETURNING id`,
      [`${PREFIX} ${title}`, year]
    );
    const {
      rows: [season],
    } = await pool.query(
      `INSERT INTO "Season" ("seriesId", "seasonNumber", "updatedAt") VALUES ($1, 1, now()) RETURNING id`,
      [series.id]
    );
    for (let n = 1; n <= 6; n += 1) {
      await pool.query(
        `INSERT INTO "Episode" ("seasonId", "episodeNumber", "updatedAt") VALUES ($1, $2, now())`,
        [season.id, n]
      );
    }
  }
}

async function cleanup() {
  await pool.query(`DELETE FROM "User" WHERE id = $1`, [USER_ID]);
  await pool.query(`DELETE FROM "Series" WHERE title LIKE $1`, [`${PREFIX}%`]);
}

const cookie = async () => ({
  name: 'authjs.session-token',
  value: await encode({
    secret: 'onboarding-local-test-only',
    salt: 'authjs.session-token',
    token: {
      sub: USER_ID,
      id: USER_ID,
      name: 'Local test',
      role: 'VISITOR',
      banned: false,
      roleCheckedAt: Date.now(),
    },
    maxAge: 3600,
  }),
  domain: 'localhost',
  path: '/',
});

await cleanup();
await seed();
const browser = await chromium.launch();
mkdirSync('test-results', { recursive: true });
try {
  for (const width of [390, 1280]) {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
    });
    await context.addCookies([await cookie()]);
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(base + '/catalogo', {
      waitUntil: 'domcontentloaded',
      timeout: 120_000,
    });

    const dialog = page.getByRole('dialog');
    await dialog.waitFor({ timeout: 60_000 });
    await dialog.getByText('¿Qué estás viendo ahora?').waitFor();
    await dialog.getByRole('button', { name: `${PREFIX} Dos` }).click();
    await dialog.locator('.ant-select').click();
    await page.getByTitle('Voy por el 3', { exact: true }).click();
    await page.screenshot({
      path: `test-results/onboarding-${width}.png`,
      fullPage: false,
    });
    if (width === 390) {
      // Ahora no: se cierra y no vuelve a aparecer.
      await dialog.getByRole('button', { name: 'Ahora no' }).click();
      await dialog.waitFor({ state: 'hidden' });
      const { rows } = await pool.query(
        `SELECT "onboardingCompletedAt" FROM "User" WHERE id = $1`,
        [USER_ID]
      );
      assert.ok(rows[0].onboardingCompletedAt, 'skip closes it for good');
      await pool.query(
        `UPDATE "User" SET "onboardingCompletedAt" = NULL WHERE id = $1`,
        [USER_ID]
      );
    } else {
      await dialog.getByRole('button', { name: 'Seguir (1)' }).click();
      await page.waitForURL('**/watching', { timeout: 60_000 });
      const { rows } = await pool.query(
        `SELECT
           (SELECT count(*) FROM "ViewStatus" WHERE "userId" = $1 AND "seriesId" IS NOT NULL AND status = 'VIENDO')::int AS viendo,
           (SELECT count(*) FROM "ViewStatus" WHERE "userId" = $1 AND "episodeId" IS NOT NULL AND status = 'VISTA')::int AS watched,
           (SELECT count(*) FROM "UserActiveDay" WHERE "userId" = $1)::int AS days`,
        [USER_ID]
      );
      assert.deepEqual(rows[0], { viendo: 1, watched: 3, days: 1 });
    }
    assert.deepEqual(errors, []);
    await context.close();
  }
  console.log('onboarding ui: ok');
} finally {
  await browser.close();
  await cleanup();
  await pool.end();
}
