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
const key = `community-app-${Date.now()}`;
const users = { owner: key, other: `${key}-other`, admin: `${key}-admin` };
let browser, context, page, series;
const errors = [];
async function login(name) {
  await context.clearCookies();
  if (!name) return;
  const id = users[name];
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
          name: 'Prueba local',
          email: `${id}@example.invalid`,
          role: name === 'admin' ? 'ADMIN' : 'VISITOR',
          banned: false,
          roleCheckedAt: 0,
        },
      }),
    },
  ]);
}
try {
  await prisma.user.createMany({
    data: Object.entries(users).map(([role, id]) => ({
      id,
      email: `${id}@example.invalid`,
      name: 'Prueba local',
      role: role === 'admin' ? 'ADMIN' : 'VISITOR',
    })),
  });
  series = await prisma.series.create({
    data: {
      title: key,
      type: 'serie',
      seasons: {
        create: { seasonNumber: 1, episodes: { create: { episodeNumber: 1 } } },
      },
    },
    include: { seasons: { include: { episodes: true } } },
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
  await login('owner');
  assert.equal(
    (await (await context.request.get(base + '/api/auth/session')).json()).user
      .id,
    users.owner
  );
  await page.goto(base + '/comunidad/listas/nueva');
  await page
    .getByRole('button', { name: 'Ok, entendido', exact: true })
    .click();
  await page
    .getByRole('textbox', { name: 'Nombre de la lista', exact: true })
    .fill('Lista desde la aplicación completa');
  await page
    .getByRole('combobox', { name: 'Agregar una obra', exact: true })
    .fill(key);
  await page.getByTitle(key, { exact: true }).last().click();
  const [created] = await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().endsWith('/api/community/lists') &&
        response.request().method() === 'POST'
    ),
    page.getByRole('button', { name: 'Guardar', exact: true }).click(),
  ]);
  assert.equal(
    created.status(),
    201,
    `${await created.text()} origin=${created.request().headers().origin} payload=${created.request().postData()}`
  );
  await page.waitForURL((url) =>
    /^\/comunidad\/listas\/[a-z0-9]{20,}$/.test(url.pathname)
  );
  const listId = page.url().split('/').pop();
  assert.equal(
    (
      await prisma.recommendationList.findUniqueOrThrow({
        where: { id: listId },
      })
    ).visibility,
    'PRIVATE'
  );
  await login('other');
  assert.equal(
    (
      await context.request.get(base + `/api/community/lists/${listId}`)
    ).status(),
    404
  );
  await login('owner');
  await page.reload();
  await page.getByRole('button', { name: 'Publicar', exact: true }).click();
  await page
    .locator('.ant-popconfirm')
    .getByRole('button', { name: 'Publicar', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Volver a privado', exact: true })
    .waitFor();
  await login('other');
  await page.reload();
  await page
    .getByRole('button', { name: 'Guardar para ver', exact: true })
    .click();
  await page.getByRole('button', { name: /Guardada en pendientes/ }).waitFor();
  await page.getByRole('button', { name: 'Denunciar', exact: true }).click();
  const modal = page.getByRole('dialog');
  await modal
    .getByRole('textbox', { name: 'Detalles (opcionales)', exact: true })
    .fill('Revisión desde la aplicación integrada.');
  await modal.getByRole('button', { name: 'Denunciar', exact: true }).click();
  await page
    .getByText('Denuncia enviada para revisión.', { exact: true })
    .waitFor();
  await login('admin');
  await page.goto(base + '/admin/comunidad');
  await page
    .getByRole('button', { name: 'Ocultar contenido', exact: true })
    .click();
  await modal
    .getByRole('textbox', { name: 'Motivo de la decisión', exact: true })
    .fill('Revisión integrada con registro de decisión.');
  await modal.getByRole('button', { name: 'Guardar', exact: true }).click();
  await page
    .getByText('No hay denuncias en esta vista', { exact: true })
    .waitFor();
  await login('other');
  assert.equal(
    (
      await context.request.get(base + `/api/community/lists/${listId}`)
    ).status(),
    404
  );
  await login('owner');
  await page.goto(base + `/comunidad/listas/${listId}`);
  await page
    .getByRole('button', { name: 'Volver a privado', exact: true })
    .click();
  await page.getByText('Privada · solo vos', { exact: true }).waitFor();
  await page.goto(
    base +
      `/comunidad/obras/${series.id}?episodeId=${series.seasons[0].episodes[0].id}`
  );
  await page
    .getByRole('button', { name: 'Conversar sobre una serie', exact: true })
    .click();
  await modal
    .getByRole('textbox', { name: 'Título', exact: true })
    .fill('Conversación integrada de capítulo');
  await modal
    .getByRole('textbox', { name: 'Tu mensaje', exact: true })
    .fill('Texto privado desde la aplicación completa.');
  await modal
    .getByRole('button', { name: 'Guardar borrador', exact: true })
    .click();
  await page.waitForURL(/\/comunidad\/\d+$/);
  const topicId = Number(page.url().split('/').pop());
  const topic = await prisma.communityTopic.findUniqueOrThrow({
    where: { id: topicId },
  });
  assert.equal(topic.visibility, 'PRIVATE');
  assert.equal(topic.episodeId, series.seasons[0].episodes[0].id);
  await mkdir('test-results', { recursive: true });
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 900 });
    for (const [name, path] of [
      ['community', '/comunidad'],
      ['lists', '/comunidad/listas?mine=true'],
      ['topics', '/comunidad/mis-conversaciones'],
      ['profile', '/comunidad/mi-espacio'],
      ['thread', `/comunidad/${topicId}`],
    ]) {
      await page.goto(base + path);
      await page.locator('#main-content').waitFor();
      if (name === 'community') {
        await page.waitForFunction(() => {
          const button = document.querySelector(
            '.community-feed__actions button'
          );
          return button && !button.disabled;
        });
      }
      await page.evaluate(() => document.fonts.ready);
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1
        ),
        `${path}: overflow at ${width}`
      );
      await page.screenshot({
        path: `test-results/community-app-${name}-${width}.png`,
        fullPage: true,
      });
    }
  }
  assert.deepEqual(errors, []);
  console.log(
    'PASS: production Next server, real AppLayout, JWT session verification, private list creation/publication/withdrawal, recommendation save, report/moderation audit, contextual draft creation and 1280/390px layouts. Only OAuth login is replaced by locally signed test sessions.'
  );
} catch (error) {
  console.error('Page errors:', errors, 'URL:', page?.url());
  if (page) {
    console.error(
      'Page:',
      (await page.locator('body').innerText()).slice(0, 4000)
    );
    await page.screenshot({
      path: 'test-results/community-app-failure.png',
      fullPage: true,
    });
  }
  throw error;
} finally {
  if (browser) await browser.close();
  await prisma.communityReport.deleteMany({
    where: { reporterId: { in: Object.values(users) } },
  });
  await prisma.communityTopic.deleteMany({
    where: { userId: { in: Object.values(users) } },
  });
  if (series) await prisma.series.delete({ where: { id: series.id } });
  await prisma.user.deleteMany({ where: { id: { in: Object.values(users) } } });
  await prisma.$disconnect();
}
