import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { encode } from 'next-auth/jwt';

const require = createRequire(import.meta.url);
const { assertLocalTestDatabase } = require('./assert-local-test-database.ts');
assertLocalTestDatabase();
const { prisma } = require('../src/lib/database.ts');
const { renderWelcomeEmail } = require('../src/lib/email-templates.ts');
const origin = 'http://localhost:3018';
assert.equal(process.env.NEXTAUTH_URL, origin);
assert.equal(process.env.AUTH_SECRET, 'editorial-local-validation-only');
const key = `editorial-flow-${Date.now()}`;
const adminId = key + '-admin';
const browser = await chromium.launch({ headless: true });
const anon = await browser.newContext({
  viewport: { width: 390, height: 844 },
});
const admin = await browser.newContext();
const errors = [];
let series;
const day = new Date(new Date().toISOString().slice(0, 10));
const before = await prisma.pilotClickDaily.findMany({ where: { day } });
function assertRendered(html, path) {
  // next/dynamic({ ssr: false }) intentionally emits a CSR boundary in development.
  const digests = [...html.matchAll(/data-dgst="([^"]+)"/g)].map(
    (match) => match[1]
  );
  assert.deepEqual(
    digests.filter((digest) => digest !== 'BAILOUT_TO_CLIENT_SIDE_RENDERING'),
    [],
    path + ' SSR error'
  );
  assert.ok(!/\\"digest\\":\\"[^\\]/.test(html), path + ' RSC error');
}
try {
  await prisma.user.create({
    data: { id: adminId, email: adminId + '@example.test', role: 'ADMIN' },
  });
  const token = await encode({
    secret: process.env.AUTH_SECRET,
    salt: 'authjs.session-token',
    token: {
      id: adminId,
      role: 'ADMIN',
      banned: false,
      roleCheckedAt: Date.now(),
      email: adminId + '@example.test',
    },
  });
  await admin.addCookies([
    { name: 'authjs.session-token', value: token, url: origin },
  ]);
  series = await prisma.series.create({
    data: {
      title: key,
      type: 'serie',
      synopsis: 'PRIVATE-ADULT-SYNOPSIS-' + key,
      notesPrivate: true,
      review: 'PRIVATE-EDITORIAL-' + key,
      seasons: {
        create: {
          seasonNumber: 1,
          episodes: {
            create: {
              episodeNumber: 1,
              duration: 25,
              title: 'EP.1',
              embedUrl: 'https://www.youtube.com/watch?v=localfixture',
              embedPlatform: 'YouTube',
            },
          },
        },
      },
      watchLinks: {
        create: {
          platform: 'GagaOOLala',
          url: 'https://www.gagaoolala.com/en/videos/123',
          official: true,
        },
      },
      infoBlocks: { create: { label: 'Fixture', body: 'Adult fixture block' } },
      embeddableContent: {
        create: {
          title: key,
          url: 'https://www.youtube.com/watch?v=localfixture',
          platform: 'YouTube',
          category: 'TRAILER',
        },
      },
    },
    include: { seasons: { include: { episodes: true } }, watchLinks: true },
  });
  const id = series.id,
    seasonId = series.seasons[0].id,
    episodeId = series.seasons[0].episodes[0].id;
  const post = (ctx, path, data) =>
    ctx.request.post(origin + path, { data, headers: { Origin: origin } });
  const classify = (rating, editVersion) =>
    admin.request.patch(`${origin}/api/admin/series/${id}/classification`, {
      headers: { Origin: origin },
      data: { rating, warnings: ['SEX'], source: 'Local test', editVersion },
    });
  const page = await anon.newPage();
  page.on('pageerror', (e) => errors.push(e.message));
  await page.route('https://**/*', (route) => route.abort());
  await page.goto(`${origin}/series/${id}`);
  await page.getByText('Sin revisar', { exact: true }).first().waitFor();
  assert.equal((await classify('ADULT18', 0)).status(), 200);
  assert.equal((await classify('GENERAL', 0)).status(), 409);
  assert.equal(
    (
      await anon.request.patch(
        `${origin}/api/admin/series/${id}/classification`,
        { data: {} }
      )
    ).status(),
    401
  );
  const paths = [
    `/series/${id}`,
    `/catalogo/${id}`,
    `/catalogo/${id}/dashboard`,
    `/ver/${id}`,
  ];
  for (const path of paths) {
    const response = await anon.request.get(origin + path);
    const html = await response.text();
    await writeFile(
      `test-results/partnership/gated-${path.replaceAll('/', '_')}.html`,
      html
    );
    assert.equal(response.status(), 200, path);
    assertRendered(html, path);
    assert.match(
      response.headers()['cache-control'],
      process.env.EDITORIAL_DIAGNOSTIC === '1'
        ? /no-cache|no-store/
        : /no-store/,
      path
    );
    assert.ok(html.includes('Contenido para mayores de 18'), path);
    assert.ok(!html.includes(series.synopsis), path + ' must not leak in RSC');
    assert.ok(
      !html.includes('youtube.com/watch?v=localfixture'),
      path + ' media'
    );
    assert.ok(
      !html.includes('PRIVATE-EDITORIAL-' + key),
      path + ' private notes'
    );
  }
  for (const path of [
    `/api/series/${id}`,
    `/api/episodes/${episodeId}`,
    `/api/episodes?seasonId=${seasonId}`,
    `/api/seasons/${seasonId}`,
    `/api/series/${id}/info-blocks`,
  ]) {
    const response = await anon.request.get(origin + path);
    assert.equal(response.status(), 403, path);
    assert.match(response.headers()['cache-control'], /no-store/);
  }
  const content = await anon.request.get(
    `${origin}/api/contenido?seriesId=${id}`
  );
  assert.deepEqual(await content.json(), []);
  await page.goto(`${origin}/series/${id}`);
  await page
    .getByRole('button', { name: 'Tengo 18 años o más y quiero continuar' })
    .waitFor();
  await mkdir('test-results/partnership', { recursive: true });
  await page.screenshot({
    path: 'test-results/partnership/adult-gate-mobile.png',
    fullPage: true,
  });
  await page
    .getByRole('button', { name: 'Tengo 18 años o más y quiero continuar' })
    .click();
  await page.getByText(series.synopsis, { exact: true }).first().waitFor();
  const consent = (await anon.cookies()).find(
    (c) => c.name === 'mundobl-content-consent'
  );
  assert.ok(consent.httpOnly);
  assert.equal(consent.sameSite, 'Lax');
  for (const path of paths) {
    const response = await anon.request.get(origin + path);
    const html = await response.text();
    await writeFile(
      `test-results/partnership/accepted-${path.replaceAll('/', '_')}.html`,
      html
    );
    assert.equal(response.status(), 200, path + ' accepted');
    assertRendered(html, path + ' accepted');
  }
  assert.equal(
    (await anon.request.get(`${origin}/api/episodes/${episodeId}`)).status(),
    200
  );
  const fresh = await browser.newContext();
  for (const path of paths) {
    const response = await fresh.request.get(origin + path);
    assert.equal(response.status(), 200, path);
    const html = await response.text();
    assertRendered(html, path + ' new browser');
    assert.ok(html.includes('Contenido para mayores de 18'), path);
    assert.ok(!html.includes(series.synopsis), path + ' shared HTML/RSC');
  }
  assert.equal(
    (await fresh.request.get(`${origin}/api/series/${id}`)).status(),
    403,
    'No shared cache leak after consent'
  );
  await fresh.close();
  await page.goto(`${origin}/preferencias-contenido`);
  await page
    .getByRole('button', { name: 'Volver a pedir confirmación' })
    .click();
  await page.getByText('Preferencia guardada.', { exact: true }).waitFor();
  await page.goto(`${origin}/series/${id}`);
  await page
    .getByRole('button', { name: 'Tengo 18 años o más y quiero continuar' })
    .waitFor();
  assert.ok(!(await page.content()).includes(series.synopsis));
  assert.equal(
    (await anon.request.get(`${origin}/api/series/${id}`)).status(),
    403
  );
  assert.equal(
    (
      await anon.request.post(`${origin}/api/content-consent`, {
        data: { allow: true },
        headers: { Origin: 'https://other.test' },
      })
    ).status(),
    403
  );

  const counts = async () =>
    (await prisma.pilotClickDaily.findMany({ where: { day } })).reduce(
      (n, r) => n + r.clicks,
      0
    );
  const start = await counts();
  assert.equal(
    (await anon.request.get(`${origin}/api/pilot-clicks`)).status(),
    405
  );
  assert.equal(
    (
      await anon.request.post(`${origin}/api/pilot-clicks`, {
        data: { placement: 'platforms' },
        headers: { Origin: 'https://other.test' },
      })
    ).status(),
    403
  );
  assert.equal(
    (
      await post(anon, '/api/pilot-clicks', {
        placement: 'series',
        watchLinkId: -1,
      })
    ).status(),
    400
  );
  assert.equal(
    (
      await post(admin, '/api/pilot-clicks', { placement: 'platforms' })
    ).status(),
    204
  );
  assert.equal(await counts(), start, 'Staff and invalid requests excluded');
  await Promise.all(
    Array.from({ length: 4 }, () =>
      post(anon, '/api/pilot-clicks', {
        placement: 'series',
        watchLinkId: series.watchLinks[0].id,
      })
    )
  );
  assert.equal(await counts(), start + 4, 'Atomic aggregate increment');
  const adminPage = await admin.newPage();
  const hydrationErrors = [];
  adminPage.on('console', (message) => {
    if (/hydrated|hydration|server rendered HTML/i.test(message.text()))
      hydrationErrors.push(message.text());
  });
  await adminPage.goto(`${origin}/admin/series/${id}/clasificacion`);
  await adminPage
    .getByRole('heading', { name: 'Clasificación editorial' })
    .waitFor();
  await adminPage.getByRole('combobox').first().waitFor();
  await adminPage.screenshot({
    path: 'test-results/partnership/classification-desktop.png',
    fullPage: true,
  });
  await adminPage.goto(`${origin}/admin/piloto`);
  await adminPage.getByRole('heading', { name: 'Piloto GagaOOLala' }).waitFor();
  await adminPage.screenshot({
    path: 'test-results/partnership/pilot-report.png',
    fullPage: true,
  });
  await page.goto(`${origin}/contenido`);
  assert.ok(
    !(await page.content()).includes('youtube.com/watch?v=localfixture')
  );
  const welcome = renderWelcomeEmail({ name: 'Comunidad' });
  await writeFile(
    'test-results/partnership/welcome-preview.html',
    welcome.html
  );
  await page.setContent(welcome.html);
  await page.screenshot({
    path: 'test-results/partnership/welcome-mobile.png',
    fullPage: true,
  });
  assert.deepEqual(errors, []);
  assert.deepEqual(hydrationErrors, [], 'Editorial admin hydration');
  console.log(
    `PASS (${process.env.EDITORIAL_DIAGNOSTIC === '1' ? 'development diagnostic, production cache validation still required' : 'production build'}): actual server + PostgreSQL + browser, 4 gated routes/RSC, 5 APIs, stale cache invalidation, isolated cookies, accept/revoke, admin UI/report, atomic clicks, staff exclusion, email preview only.`
  );
} finally {
  await browser.close();
  if (series) {
    await prisma.embeddableContent.deleteMany({
      where: { seriesId: series.id },
    });
    await prisma.series.delete({ where: { id: series.id } });
    await prisma.seriesRevision.deleteMany({ where: { seriesId: series.id } });
  }
  await prisma.user.deleteMany({ where: { id: adminId } });
  // Restore only these disposable test-day aggregates, never production.
  await prisma.pilotClickDaily.deleteMany({ where: { day } });
  if (before.length) await prisma.pilotClickDaily.createMany({ data: before });
  await prisma.$disconnect();
}
