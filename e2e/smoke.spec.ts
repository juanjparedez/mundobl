import { test, expect } from '@playwright/test';

/**
 * Chequeos de humo contra el sitio publico.
 *
 * REGLA: solo lectura. Ninguno de estos tests puede registrarse, comentar,
 * calificar ni marcar nada. Corren contra produccion y la actividad falsa
 * ensucia las estadisticas reales, que son el diferencial del producto.
 *
 * Lo que buscan no es "el server responde 200" (eso lo hace cualquier uptime
 * monitor) sino "la app renderiza contenido real": que el catalogo traiga
 * series, que /ver traiga algo mirable, que el sitemap tenga URLs.
 */

test('la landing carga y muestra contenido real', async ({ page }) => {
  const response = await page.goto('/');
  expect(response?.status()).toBeLessThan(400);

  // El titulo tiene que existir y no ser el fallback de error de Next.
  await expect(page).toHaveTitle(/.+/);
  await expect(page.locator('body')).not.toContainText(
    'Application error'
  );

  // La franja de stats sale de COUNTs reales sobre la base. Si la query
  // fallara, la landing cae al catch y muestra ceros: eso es una falla.
  const stats = page.locator('.landing__stat-value');
  await expect(stats.first()).toBeVisible();
  const valores = await stats.allInnerTexts();
  const algunoNoCero = valores.some((v) => /[1-9]/.test(v));
  expect(algunoNoCero, `stats de la landing en cero: ${valores.join(', ')}`).toBe(true);
});

test('el catalogo renderiza series', async ({ page }) => {
  await page.goto('/catalogo');
  const cards = page.locator('.serie-card');
  await expect(cards.first()).toBeVisible({ timeout: 15_000 });
  expect(await cards.count()).toBeGreaterThan(5);
});

test('/ver muestra series mirables y la ficha abre', async ({ page }) => {
  await page.goto('/ver');
  const link = page.locator('a[href*="/ver/"]').first();
  await expect(link).toBeVisible({ timeout: 15_000 });

  const href = await link.getAttribute('href');
  expect(href).toBeTruthy();

  const response = await page.goto(href!);
  expect(response?.status()).toBeLessThan(400);
  await expect(page.locator('body')).not.toContainText('404');
});

test('una ficha de serie del catalogo abre', async ({ page }) => {
  await page.goto('/catalogo');

  // OJO: las cards de /catalogo NO son <a href>, son <div role="button"> con
  // onClick (ver renderSingleCard en CatalogoClient.tsx). Por eso hay que
  // clickear en vez de leer el href. Efecto colateral conocido: un crawler no
  // puede seguirlas y no se pueden abrir en pestania nueva.
  const card = page.locator('.serie-card').first();
  await expect(card).toBeVisible({ timeout: 15_000 });
  await card.click();

  await page.waitForURL(/\/(series|catalogo)\/.+/, { timeout: 15_000 });
  await expect(page.locator('body')).not.toContainText('404');
});

test('el sitemap que anuncia robots.txt existe', async ({ request }) => {
  // robots.txt publica `Sitemap: /sitemap.xml`, asi que ESA es la URL que
  // Google va a pedir. Si da 404, los shards (/sitemap/0.xml ... 6.xml)
  // existen pero nadie los descubre.
  const robots = await request.get('/robots.txt');
  const texto = await robots.text();
  const anunciados = [...texto.matchAll(/Sitemap:\s*(\S+)/g)].map((m) => m[1]);
  expect(anunciados.length, 'robots.txt no anuncia ningun sitemap').toBeGreaterThan(0);

  // TODOS tienen que resolver, no solo el primero: un shard roto es contenido
  // que Google no descubre nunca.
  for (const url of anunciados) {
    const res = await request.get(url);
    expect(res.status(), `robots.txt apunta a ${url} y da ${res.status()}`).toBe(200);
    expect(await res.text()).toContain('mundobl.com.ar');
  }
});

test('robots.txt apunta al sitemap', async ({ request }) => {
  const res = await request.get('/robots.txt');
  expect(res.status()).toBe(200);
  expect(await res.text()).toContain('Sitemap');
});

test('las rutas privadas no se sirven sin sesion', async ({ page }) => {
  // No es un test de auth completo: es el guardrail de que un deploy no
  // exponga el panel por accidente.
  const res = await page.goto('/admin');
  const url = page.url();
  const bloqueado = (res?.status() ?? 0) >= 400 || !url.includes('/admin');
  expect(bloqueado, `/admin quedo accesible sin sesion (${url})`).toBe(true);
});
