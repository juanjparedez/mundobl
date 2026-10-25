import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { chromium } from 'playwright';
import { encode } from 'next-auth/jwt';
const require = createRequire(import.meta.url);
require('./assert-local-test-database.ts').assertLocalTestDatabase();
const { prisma } = require('../src/lib/database.ts');
const base = process.env.COMMUNITY_APP_TEST_URL ?? 'http://127.0.0.1:3223';
assert.ok(['127.0.0.1', 'localhost'].includes(new URL(base).hostname));
assert.equal(process.env.AUTH_SECRET, 'community-full-app-test-only');

// /perfil en pestañas + logros, contra el servidor Next de produccion. Solo
// el login OAuth se reemplaza por una sesion firmada localmente.
const id = `profile-app-${Date.now()}`;
let browser, context, page, series;
const errors = [];

async function login(role = 'VISITOR') {
  await context.clearCookies();
  await context.addCookies([
    {
      name: 'authjs.session-token',
      url: base,
      value: await encode({
        secret: process.env.AUTH_SECRET,
        salt: 'authjs.session-token',
        maxAge: 3600,
        token: {
          id,
          sub: id,
          name: 'Prueba perfil',
          email: `${id}@example.invalid`,
          role,
          banned: false,
          roleCheckedAt: 0,
        },
      }),
    },
  ]);
}

// El nombre accesible incluye el aria-label del icono ("home Resumen").
const tab = (name) => page.getByRole('tab', { name: new RegExp(`${name}$`) });

try {
  await prisma.user.create({
    data: { id, email: `${id}@example.invalid`, name: 'Prueba perfil' },
  });
  series = await prisma.series.create({
    data: {
      title: id,
      type: 'serie',
      watchLinks: {
        create: { platform: 'Viki', url: 'https://example.test/viki' },
      },
      seasons: {
        create: { seasonNumber: 1, episodes: { create: { episodeNumber: 1 } } },
      },
    },
  });
  await prisma.viewStatus.create({
    data: { userId: id, seriesId: series.id, status: 'VISTA' },
  });

  browser = await chromium.launch({ headless: true });
  context = await browser.newContext({
    locale: 'es-AR',
    serviceWorkers: 'block',
  });
  await context.route('**/*', (route) =>
    new URL(route.request().url()).origin === base
      ? route.continue()
      : route.abort()
  );
  page = await context.newPage();
  page.on('pageerror', (error) => errors.push(error.message));
  await login();

  // Compartir: valida datos, no duplica y no acepta series inexistentes.
  const share = (body) =>
    context.request.post(base + '/api/user/shares', { data: body });
  assert.equal(
    (await share({ seriesId: series.id, channel: 'x' })).status(),
    400
  );
  assert.equal((await share({ seriesId: 2e9, channel: 'copy' })).status(), 404);
  assert.equal(
    (await share({ seriesId: series.id, channel: 'copy' })).status(),
    200
  );
  assert.equal(
    (await share({ seriesId: series.id, channel: 'native' })).status(),
    200
  );
  assert.equal(await prisma.seriesShare.count({ where: { userId: id } }), 1);

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(base + '/perfil');
  await tab('Resumen').waitFor();
  for (const name of ['Estadísticas', 'Logros', 'Actividad', 'Ajustes']) {
    assert.ok(await tab(name).isVisible(), `${name} tab`);
  }
  assert.equal(await tab('Admin').count(), 0, 'no admin tab for visitors');
  assert.equal(
    await tab('Resumen').getAttribute('aria-selected'),
    'true',
    'Resumen by default'
  );

  await page.getByRole('link', { name: 'Ver todos los logros' }).click();
  await page.waitForURL('**/perfil?tab=logros');
  await page.getByText('Parches de plataforma').waitFor();
  const board = page.locator('.mb-achievements-board');
  // Primer paso + Pasala + Viki bronce.
  await board.getByText(/^3 de \d+ logros obtenidos$/).waitFor();
  assert.equal(await board.locator('.mb-platform-patch').count(), 6);
  assert.equal(
    await board.locator('.mb-platform-patch--bronze').count(),
    1,
    'Viki bronze'
  );
  await page.getByText('Obtenidos', { exact: true }).click();
  assert.deepEqual(
    (
      await board.locator('.overview-achievements__name').allTextContents()
    ).sort(),
    ['Pasala', 'Primer paso']
  );

  await tab('Ajustes').click();
  await page.waitForURL('**/perfil?tab=ajustes');
  await page.locator('#profile-list-count').waitFor();
  await page.goBack();
  await page.waitForURL('**/perfil?tab=logros');

  await page.goto(base + '/perfil/estadisticas');
  await page.waitForURL('**/perfil?tab=estadisticas');
  await page.getByText('Todo tu historial').waitFor();

  await page.goto(base + '/perfil?tab=admin');
  assert.equal(
    await tab('Resumen').getAttribute('aria-selected'),
    'true',
    'unknown or forbidden tab falls back to Resumen'
  );

  await mkdir('test-results', { recursive: true });
  for (const width of [1280, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    for (const name of ['resumen', 'logros', 'ajustes']) {
      await page.goto(
        base + (name === 'resumen' ? '/perfil' : `/perfil?tab=${name}`)
      );
      await page.locator('.mb-perfil-dashboard__tabs').waitFor();
      await page.evaluate(() => document.fonts.ready);
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1
        ),
        `${name}: overflow at ${width}`
      );
      await page.screenshot({
        path: `test-results/profile-app-${name}-${width}.png`,
        fullPage: true,
      });
    }
  }

  await prisma.user.update({ where: { id }, data: { role: 'ADMIN' } });
  await login('ADMIN');
  await page.goto(base + '/perfil?tab=admin');
  await page.waitForFunction(() =>
    document
      .querySelector('[role="tab"][aria-selected="true"]')
      ?.textContent?.includes('Admin')
  );

  assert.deepEqual(errors, []);
  console.log(
    'PASS: /perfil tabs (deep links, back button, admin only for staff, /perfil/estadisticas redirect), achievements board with platform patches and filters, share recording without duplicates, no overflow at 1280/390/320.'
  );
} catch (error) {
  console.error('Page errors:', errors, 'URL:', page?.url());
  if (page) {
    console.error(
      'Page:',
      (
        await page
          .locator('body')
          .innerText()
          .catch(() => '')
      ).slice(0, 3000)
    );
  }
  throw error;
} finally {
  await browser?.close();
  await prisma.user.deleteMany({ where: { id } });
  if (series) await prisma.series.deleteMany({ where: { id: series.id } });
  await prisma.$disconnect();
}
