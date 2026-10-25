import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { chromium } from 'playwright';
import { encode } from 'next-auth/jwt';
const require = createRequire(import.meta.url);
require('./assert-local-test-database.ts').assertLocalTestDatabase();
const { prisma } = require('../src/lib/database.ts');
const base = process.env.COMMUNITY_APP_TEST_URL ?? 'http://127.0.0.1:3223';
assert.ok(['127.0.0.1', 'localhost'].includes(new URL(base).hostname));
assert.equal(process.env.AUTH_SECRET, 'community-full-app-test-only');

// /ver con capitulos que solo se ven en YouTube, contra el servidor Next de
// produccion: el link de un +18 es solo para usuarios logueados y su iframe
// no se monta; el no embebible muestra el link a todos.
const id = `ver-availability-${Date.now()}`;
const VIDEO_IDS = {
  OK: 'testOKAY001',
  AGE_RESTRICTED: 'testAGE0002',
  NOT_EMBEDDABLE: 'testNOT0003',
};
const video = (playback, n) => ({
  episodeNumber: n,
  title: `${id} EP.${n}`,
  embedUrl: `https://www.youtube.com/watch?v=${VIDEO_IDS[playback]}`,
  embedPlatform: 'YouTube',
  embedVideoId: VIDEO_IDS[playback],
  durationSeconds: 900,
  playback,
});
let browser, context, page, series;
const errors = [];

async function login() {
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
          name: 'Prueba ver',
          email: `${id}@example.invalid`,
          role: 'VISITOR',
          banned: false,
          roleCheckedAt: 0,
        },
      }),
    },
  ]);
}

const open = async (n) => {
  await page.goto(`${base}/ver/${series.id}?e=1x${n}`);
  await page.locator('.ver-serie__title').waitFor();
};
const signInButton = () =>
  page
    .locator('.ver-serie__availability')
    .getByRole('button', { name: 'Iniciar sesión' });
const iframes = () => page.locator('iframe[src*="youtube"]').count();
const youtubeLinks = (videoId) =>
  page.locator(`a[href*="watch?v=${videoId}"]`).count();

try {
  await prisma.user.create({
    data: { id, email: `${id}@example.invalid`, name: 'Prueba ver' },
  });
  series = await prisma.series.create({
    data: {
      title: id,
      type: 'serie',
      catalogScope: 'WATCHABLE_ONLY',
      seasons: {
        create: {
          seasonNumber: 1,
          episodes: {
            create: [
              video('OK', 1),
              video('AGE_RESTRICTED', 2),
              video('NOT_EMBEDDABLE', 3),
            ],
          },
        },
      },
    },
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

  await open(1);
  assert.equal(await iframes(), 1, 'playable chapter keeps its player');

  // Anonimo: aviso y boton de login, sin link ni iframe del +18.
  await open(2);
  await page
    .getByText(/restringe este capítulo por edad\. Iniciá sesión/)
    .waitFor();
  assert.ok(await signInButton().isVisible());
  assert.equal(await iframes(), 0, 'no age-restricted iframe');
  assert.equal(await youtubeLinks('testAGE0002'), 0, 'no link for anonymous');

  // No embebible: el link es para todos y el avance se sigue aca.
  await open(3);
  await page
    .getByText(/Miralo en YouTube y seguí tu avance desde MundoBL/)
    .waitFor();
  assert.ok((await youtubeLinks('testNOT0003')) > 0, 'non-embeddable link');

  // Logueado: el +18 muestra el link a YouTube y sigue sin iframe.
  await login();
  await open(2);
  await page.getByText(/se ve allá con una cuenta mayor de 18/).waitFor();
  assert.ok((await youtubeLinks('testAGE0002')) > 0, 'link when signed in');
  assert.equal(await iframes(), 0, 'still no age-restricted iframe');
  assert.equal(await signInButton().count(), 0);

  assert.deepEqual(errors, []);
  console.log(
    '/ver availability: +18 link only when signed in, no +18 iframe, non-embeddable link for everyone OK.'
  );
} finally {
  await browser?.close();
  if (series) await prisma.series.delete({ where: { id: series.id } });
  await prisma.user.deleteMany({ where: { id } });
  await prisma.$disconnect();
}
