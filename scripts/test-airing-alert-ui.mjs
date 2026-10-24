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

const PREFIX = 'Airing alert UI';
const USER_ID = 'airing-alert-ui-user';
const DAYS = [
  'domingo',
  'lunes',
  'martes',
  'miercoles',
  'jueves',
  'viernes',
  'sabado',
];
const now = new Date();
const pool = new pg.Pool({ connectionString: connection.href });

async function cleanup() {
  await pool.query(`DELETE FROM "User" WHERE id = $1`, [USER_ID]);
  await pool.query(
    `DELETE FROM "SeriesActivityDaily" WHERE "seriesId" IN (SELECT id FROM "Series" WHERE title LIKE $1)`,
    [`${PREFIX}%`]
  );
  await pool.query(`DELETE FROM "Series" WHERE title LIKE $1`, [`${PREFIX}%`]);
}

async function seed() {
  await pool.query(
    `INSERT INTO "User" (id, email, role, "updatedAt", "onboardingCompletedAt") VALUES ($1, $2, 'VISITOR', now(), now())`,
    [USER_ID, `${USER_ID}@example.test`]
  );
  const {
    rows: [series],
  } = await pool.query(
    `INSERT INTO "Series" (title, type, origin, "catalogScope", visibility, "airDays", year, "updatedAt")
     VALUES ($1, 'serie', 'CURATED', 'PERSONAL', 'VISIBLE', $2, $3, now()) RETURNING id`,
    [
      `${PREFIX} Uno`,
      `${DAYS[now.getUTCDay()]}, ${DAYS[(now.getUTCDay() + 1) % 7]}`,
      now.getUTCFullYear(),
    ]
  );
  return series.id;
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

const counts = async (seriesId) => {
  const { rows } = await pool.query(
    `SELECT kind, source, SUM(count)::int AS n FROM "SeriesActivityDaily"
     WHERE "seriesId" = $1 AND kind LIKE 'alert_%' GROUP BY kind, source`,
    [seriesId]
  );
  return Object.fromEntries(rows.map((r) => [`${r.kind}:${r.source}`, r.n]));
};

const waitFor = async (check, label) => {
  for (let i = 0; i < 40; i += 1) {
    if (await check()) return;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  assert.fail(label);
};

await cleanup();
const seriesId = await seed();
const browser = await chromium.launch();
mkdirSync('test-results', { recursive: true });
const action = 'Avisame cuando salga el próximo capítulo';
try {
  // 1. Anonimo: ve el boton, lo toca, queda la intencion y se va a Google.
  const context = await browser.newContext({
    viewport: { width: 390, height: 900 },
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route('**/accounts.google.com/**', (route) =>
    route.fulfill({ status: 200, contentType: 'text/html', body: 'google' })
  );
  await page.goto(`${base}/series/${seriesId}`, {
    waitUntil: 'domcontentloaded',
    timeout: 180_000,
  });
  const button = page.getByRole('button', { name: action });
  await button.waitFor({ timeout: 90_000 });
  await page.getByText(/Estrena: /).waitFor();
  await page.locator('.airing-alert').scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'test-results/airing-alert-390.png' });
  await waitFor(
    async () => (await counts(seriesId))['alert_offer:browser'] === 1,
    'offer counted'
  );
  await button.click();
  await waitFor(
    async () => (await counts(seriesId))['alert_click:browser'] === 1,
    'click counted'
  );
  // El login sale a Google; la intencion queda en el sessionStorage de la pestaña.
  await page.waitForURL(/accounts\.google\.com/, { timeout: 60_000 });

  // 2. Vuelve logueado: se activa solo y ofrece el mail.
  await context.addCookies([await cookie()]);
  await page.unroute('**/accounts.google.com/**');
  await page.goto(`${base}/series/${seriesId}`, {
    waitUntil: 'domcontentloaded',
    timeout: 120_000,
  });
  const email = page.getByRole('button', { name: 'Sí, por mail también' });
  await email.waitFor({ timeout: 60_000 });
  const { rows: subs } = await pool.query(
    `SELECT 1 FROM "SeriesSubscription" WHERE "userId" = $1 AND "seriesId" = $2`,
    [USER_ID, seriesId]
  );
  assert.equal(subs.length, 1, 'subscribed after login');
  await waitFor(
    async () => (await counts(seriesId))['alert_on:account'] === 1,
    'activation counted'
  );
  await email.scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'test-results/airing-alert-390-email.png' });
  await email.click();
  await page.getByText(/Listo: te avisamos cada /).waitFor();
  const { rows: prefs } = await pool.query(
    `SELECT "emailEnabled" FROM "NotificationPrefs" WHERE "userId" = $1`,
    [USER_ID]
  );
  assert.equal(prefs[0]?.emailEnabled, true, 'email opt-in saved');
  await context.close();

  // 3. Ya suscripto: el boton no vuelve a aparecer.
  const desktop = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });
  await desktop.addCookies([await cookie()]);
  const again = await desktop.newPage();
  again.on('pageerror', (error) => errors.push(error.message));
  await again.goto(`${base}/series/${seriesId}`, {
    waitUntil: 'networkidle',
    timeout: 120_000,
  });
  await again.screenshot({
    path: 'test-results/airing-alert-1280-subscribed.png',
  });
  assert.equal(await again.getByRole('button', { name: action }).count(), 0);
  await desktop.close();

  assert.deepEqual(errors, []);
  console.log('airing alert ui: ok');
} finally {
  await browser.close();
  await cleanup();
  await pool.end();
}
