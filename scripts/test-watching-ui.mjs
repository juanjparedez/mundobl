import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';

// UI integration only: every API request is intercepted, never sent to a real account.
const origin = 'http://localhost:3100';
let dateWrite;
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
  serviceWorkers: 'block',
  timezoneId: 'America/Argentina/Buenos_Aires',
});
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
const items = [
  {
    id: 1,
    status: 'VIENDO',
    lastWatchedAt: '2026-09-20T12:00:00.000Z',
    series: {
      id: 1,
      title: 'Always Meet Again',
      origin: 'CURATED',
      catalogScope: 'PERSONAL',
      year: 2026,
      country: { name: 'Corea del Sur' },
      hasWatchableEpisode: false,
      seasons: [
        {
          id: 10,
          seasonNumber: 1,
          episodes: Array.from({ length: 8 }, (_, i) => ({
            id: 100 + i,
            episodeNumber: i + 1,
            viewStatus: i < 3 ? [{ status: 'VISTA' }] : [],
          })),
        },
      ],
    },
  },
  {
    id: 2,
    status: 'RETOMAR',
    lastWatchedAt: '2026-09-18T12:00:00.000Z',
    series: {
      id: 2,
      title: 'Una historia GL de prueba',
      origin: 'USER_EMBED',
      catalogScope: 'WATCHABLE_ONLY',
      year: 2026,
      country: { name: 'Tailandia' },
      hasWatchableEpisode: true,
      seasons: [
        {
          id: 20,
          seasonNumber: 1,
          episodes: [
            {
              id: 200,
              episodeNumber: 1,
              title: 'EP.1 [1/2]',
              viewStatus: [{ status: 'VISTA' }],
            },
            { id: 201, episodeNumber: 2, title: 'EP.1 [2/2]', viewStatus: [] },
          ],
        },
      ],
    },
  },
];
const notes = new Map();
const writes = [];
const noteRequests = [];
const publicComments = [];
const allRequests = [];
let historyCleared = false;
let preferences = null;
const historyItem = {
  id: 'history-1',
  kind: 'DATE_CHANGED',
  status: 'VISTA',
  previousStatus: 'VISTA',
  watchedDate: '2026-09-21T00:00:00.000Z',
  previousWatchedDate: '2026-09-20T00:00:00.000Z',
  recordedAt: '2026-09-26T12:00:00.000Z',
  seriesTitle: 'Always Meet Again',
  href: '/series/1-always-meet-again',
  seasonNumber: 1,
  episodeNumber: 1,
};
await page.addInitScript(() => {
  // Disable service worker registration without a rejected promise in this isolated test.
  delete Object.getPrototypeOf(navigator).serviceWorker;
});
await page.route('**/api/**', async (route) => {
  const url = new URL(route.request().url());
  const path = url.pathname;
  allRequests.push([route.request().method(), path]);
  let result = {};
  if (path === '/api/auth/session')
    result = {
      user: { id: 'ui-test', name: 'Prueba', role: 'VISITOR' },
      expires: '2099-01-01T00:00:00.000Z',
    };
  else if (path === '/api/user/watch-date') {
    if (route.request().method() === 'PATCH') {
      dateWrite = route.request().postDataJSON();
      result = { watchedDate: dateWrite.watchedDate };
    } else result = { watchedDate: '2020-01-02T14:30:00.000Z' };
   } else if (path === '/api/user/library') result = items;
  else if (path === '/api/user/watching-preferences') {
    const method = route.request().method();
    if (method === 'POST' && preferences === null) preferences = route.request().postDataJSON();
    if (method === 'PATCH') {
      const change = route.request().postDataJSON();
      if (change.pin) {
        preferences.pinned = preferences.pinned.filter(id => id !== change.pin.id);
        if (change.pin.pinned) preferences.pinned.push(change.pin.id);
      } else preferences = {...preferences, ...change};
    }
    result = { preferences };
  }
  else if (path === '/api/user/tracking-history') {
    if (route.request().method() === 'DELETE') {
      historyCleared = true;
      result = { deleted: 2 };
    } else if (
      historyCleared ||
      url.searchParams.get('q') === 'missing-history'
    )
      result = { items: [], nextCursor: null };
    else if (url.searchParams.has('cursorId'))
      result = {
        items: [
          {
            ...historyItem,
            id: 'history-2',
            kind: 'SNAPSHOT',
            status: 'VISTA',
            watchedDate: null,
            previousStatus: null,
          },
        ],
        nextCursor: null,
      };
    else
      result = {
        items: [historyItem],
        nextCursor: { id: historyItem.id, recordedAt: historyItem.recordedAt },
      };
  } else if (path.endsWith('/notes-summary'))
    result = { seriesIds: [], episodeIds: [...notes.keys()] };
  else if (path.endsWith('/my-status')) {
    const item = items.find(
      (item) => String(item.series.id) === path.split('/')[3]
    );
    result = {
      seriesStatus: item.status,
      seasonStatus: {},
      episodeStatus: Object.fromEntries(
        item.series.seasons.flatMap((s) =>
          s.episodes
            .filter((e) => e.viewStatus[0]?.status === 'VISTA')
            .map((e) => [e.id, 'VISTA'])
        )
      ),
      favorite: false,
      subscribed: false,
    };
  } else if (path.endsWith('/watched')) {
    const data = route.request().postDataJSON();
    writes.push(data);
    for (const item of items)
      for (const s of item.series.seasons)
        for (const e of s.episodes) {
          if (data.episodeIds.includes(e.id))
            e.viewStatus = data.watched ? [{ status: 'VISTA' }] : [];
        }
    result = { ok: true };
  } else if (path.endsWith('/comments')) {
    if (route.request().method() === 'POST') {
      result = {
        ...route.request().postDataJSON(),
        id: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: 'ui-test',
        user: { id: 'ui-test', name: 'Prueba', image: null },
      };
      publicComments.push(result);
    } else result = publicComments;
  } else if (path === '/api/user/notes')
    result = {
      notes: [...notes].map(([id, note]) => ({
        key: `e:${id}`,
        kind: 'episode',
        body: note.body,
        seriesTitle: items[0].series.title,
        episodeLabel: 'T1·E1',
        href: '/series/1-always-meet-again',
        createdAt: note.updatedAt,
        updatedAt: note.updatedAt,
      })),
      total: notes.size,
      page: 1,
      pageSize: 10,
    };
  else if (path.endsWith('/note')) {
    noteRequests.push({ path, method: route.request().method() });
    const id = Number(path.split('/')[3]);
    if (route.request().method() === 'PUT') {
      notes.set(id, {
        id,
        ...route.request().postDataJSON(),
        updatedAt: new Date().toISOString(),
      });
    }
    result = notes.get(id) ?? null;
  } else if (path.includes('notifications'))
    result = { notifications: [], unreadCount: 0, total: 0 };
  else if (path.includes('novedades'))
    result = { items: [], unreadCount: 0, total: 0 };
  else if (path.includes('summary'))
    result = { unreadCount: 0, notifications: 0, total: 0 };
  await route.fulfill({ json: result });
});
try {
  await page.goto(`${origin}/watching`, {
    waitUntil: 'domcontentloaded',
    timeout: 120000,
  });
  await page
    .getByRole('heading', { name: 'Mi seguimiento', exact: true })
    .waitFor({ timeout: 120000 });
  await page
    .getByRole('heading', { name: 'Always Meet Again', exact: true })
    .waitFor();
  await mkdir('test-results/watching', { recursive: true });
  await page.screenshot({
    path: 'test-results/watching/desktop.png',
    fullPage: true,
  });
  assert.equal(await page.locator('.watching-series-card').count(), 2);
  // Ant Input.Search exposes a textbox on some browser versions.
  const searchInput = page.getByPlaceholder('Buscar en mis series');
  await searchInput.fill('no-existe');
  await page.getByText('No hay series con estos filtros.').waitFor();
  await searchInput.fill('');
  const series = page.locator('.watching-series-card').filter({
    has: page.getByRole('heading', {
      name: 'Always Meet Again',
      exact: true,
    }),
  });
  await series.getByRole('button', { name: /Vi el/ }).click();
  await series.getByText('4 de 8 capítulos vistos').waitFor();
  assert.deepEqual(writes[0], { episodeIds: [103], watched: true });
  const gl = page.locator('.watching-series-card').filter({
    has: page.getByRole('heading', {
      name: 'Una historia GL de prueba',
      exact: true,
    }),
  });
  await gl.getByRole('button', { name: /Vi el/ }).click();
  await gl.getByText('1 de 1 capítulos vistos').waitFor();
  assert.deepEqual(writes[1], { episodeIds: [201], watched: true });
  assert.match(
    await gl.getByRole('heading').getByRole('link').getAttribute('href'),
    /^\/ver\//
  );
  await gl.getByRole('button', { name: 'Fijar serie', exact: true }).click();
  assert.match(
    await page.locator('.watching-series-card').first().innerText(),
    /historia GL/
  );
  await page.getByText('Tarjetas', { exact: true }).click();
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('.watching-collection--grid').waitFor();
  assert.match(
    await page.locator('.watching-series-card').first().innerText(),
    /historia GL/
  );
  await series
    .getByRole('button', { name: 'Episodios y notas', exact: true })
    .click();
  const drawer = page.getByRole('dialog').filter({
    has: page.getByRole('tab', { name: 'Temporada 1', exact: true }),
  });
  await drawer
    .getByRole('button', { name: 'Nota privada', exact: true })
    .first()
    .waitFor();
  const progressBeforeDate = JSON.stringify(items);
  await drawer
    .getByRole('button', { name: 'Corregir fecha de visionado', exact: true })
    .first()
    .click();
  const dateDialog = page.getByRole('dialog', {
    name: 'Corregir fecha de visionado',
    exact: true,
  });
  await dateDialog
    .getByLabel('Fecha de visionado (UTC)', { exact: true })
    .fill('2020-01-01');
  await dateDialog
    .getByRole('button', { name: 'Guardar', exact: true })
    .click();
  await dateDialog.waitFor({ state: 'hidden' });
  assert.deepEqual(dateWrite, {
    episodeId: 100,
    watchedDate: '2020-01-01',
    expectedDate: '2020-01-02T14:30:00.000Z',
  });
  assert.equal(
    JSON.stringify(items),
    progressBeforeDate,
    'Date correction does not mutate chapter progress'
  );
  await drawer
    .getByRole('button', { name: 'Nota privada', exact: true })
    .first()
    .click();
  const modal = page
    .getByRole('dialog')
    .filter({ has: page.locator('textarea') });
  await modal.locator('textarea').fill('Una nota privada de prueba');
  await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().endsWith('/api/episodes/100/note') &&
        response.request().method() === 'PUT'
    ),
    modal.getByRole('button', { name: /Guardar/ }).click(),
  ]);
  await modal.waitFor({ state: 'hidden' });
  assert.equal(notes.get(100).body, 'Una nota privada de prueba');
  assert.equal(publicComments.length, 0);
  await drawer
    .getByRole('button', { name: 'Conversación pública', exact: true })
    .first()
    .click();
  await drawer.locator('textarea').waitFor();
  await drawer.locator('textarea').fill('Un comentario público de prueba');
  await drawer.getByText('31 / 2000', { exact: true }).waitFor();
  await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().endsWith('/api/episodes/100/comments') &&
        response.request().method() === 'POST',
      { timeout: 5000 }
    ),
    drawer.getByRole('button', { name: /Agregar$/ }).click(),
  ]);
  await drawer
    .getByText('Un comentario público de prueba', { exact: true })
    .waitFor();
  assert.equal(publicComments.length, 1);
  assert.equal(notes.get(100).body, 'Una nota privada de prueba');
  await page.screenshot({
    path: 'test-results/watching/episodes.png',
    fullPage: true,
  });
  await drawer.locator('.ant-drawer-close').click();
  await drawer.waitFor({ state: 'hidden' });
  await page.getByRole('tab', { name: 'Diario privado' }).click();
  await page.getByText('Una nota privada de prueba', { exact: true }).waitFor();
  await page.getByRole('tab', { name: 'Historial', exact: true }).click();
  await page.getByText('Fecha corregida', { exact: true }).waitFor();
  await page.getByText('Fecha de visionado: 21 sept 2026', { exact: true }).waitFor();
  await page.getByText('Fecha anterior: 20 sept 2026', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Cargar más', exact: true }).click();
  await page.getByText('Estado previo al historial', { exact: true }).waitFor();
  await page
    .getByText('Fecha de visionado: Desconocida', { exact: true })
    .waitFor();
  assert.equal(await page.locator('.tracking-history__list > li').count(), 2);
  await page.screenshot({
    path: 'test-results/watching/history.png',
    fullPage: true,
  });
  const stateBeforeClear = JSON.stringify(items);
  await page
    .locator('.tracking-history')
    .getByRole('button', { name: 'Borrar historial', exact: true })
    .click();
  await page
    .locator('.ant-popconfirm')
    .getByRole('button', { name: 'Cancelar', exact: true })
    .click();
  assert.equal(historyCleared, false);
  await page
    .locator('.tracking-history')
    .getByRole('button', { name: 'Borrar historial', exact: true })
    .click();
  await page
    .locator('.ant-popconfirm')
    .getByRole('button', { name: 'Borrar historial', exact: true })
    .click();
  await page
    .getByText('Todavía no hay cambios en tu historial', { exact: true })
    .waitFor();
  assert.equal(historyCleared, true);
  assert.equal(JSON.stringify(items), stateBeforeClear);
  assert.equal(notes.get(100).body, 'Una nota privada de prueba');
  await page.getByRole('tab', { name: 'Mi biblioteca' }).click();
  await page.getByText('Lista', { exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForFunction(
    () =>
      (document.querySelector('.watching-workspace')?.getBoundingClientRect()
        .width ?? 0) >= 300
  );
  const cookieDismiss = page.getByRole('button', { name: /Ok, entendido/ });
  if (await cookieDismiss.isVisible()) await cookieDismiss.click();
  await page.screenshot({
    path: 'test-results/watching/mobile.png',
    fullPage: true,
  });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth
    ),
    false
  );
  await page.evaluate(() => localStorage.setItem('theme', 'light'));
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page
    .getByRole('heading', { name: 'Mi seguimiento', exact: true })
    .waitFor();
  await page.screenshot({
    path: 'test-results/watching/light-mobile.png',
    fullPage: true,
  });
  assert.deepEqual(errors, []);
  console.log(
    'PASS: search, chapter marking, partial chapters, viewing links, pinning, persisted layout, private notes, public discussion, diary, mobile layout and light theme. All API responses simulated.'
  );
} catch (error) {
  console.log('Page errors:', errors);
  console.log('Notes:', [...notes], 'requests:', noteRequests);
  console.log('Public comments:', publicComments);
  console.log('API calls:', allRequests);
  console.log('Drawer text:', await page.getByRole('dialog').allTextContents());
  await page.screenshot({
    path: 'test-results/watching/failure.png',
    fullPage: true,
  });
  throw error;
} finally {
  await browser.close();
}
