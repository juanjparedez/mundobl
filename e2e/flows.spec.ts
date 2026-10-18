import { test, expect } from '@playwright/test';

/**
 * 4 Tests E2E de flujos críticos de usuario para MundoBL.
 *
 * Diseñados para validar los flujos fundamentales del producto (Catálogo,
 * Fichas, Streaming Hub y Glosario Cultural) sin ensuciar la base de datos
 * de producción ni depender de credenciales de terceros.
 */

test.describe('Flujos Críticos de Usuario (E2E)', () => {
  test('1. Búsqueda y filtrado interactivo en el catálogo', async ({ page }) => {
    await page.goto('/catalogo');

    // La grilla debe montar al menos una tarjeta visible
    const cards = page.locator('.serie-card');
    await expect(cards.first()).toBeVisible({ timeout: 15_000 });
    const totalInicial = await cards.count();
    expect(totalInicial).toBeGreaterThan(0);

    // Si existe el campo de búsqueda de texto, ingresar una consulta y validar respuesta
    const searchInput = page.locator('input[type="search"], input[placeholder*="Buscar"], input[placeholder*="buscar"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('Love');
      await page.waitForTimeout(500); // debounce de UI
      await expect(page.locator('body')).not.toContainText('Application error');
    }
  });

  test('2. Navegación a ficha técnica y carga de metadatos de serie', async ({ page }) => {
    await page.goto('/catalogo');

    const firstCard = page.locator('.serie-card').first();
    await expect(firstCard).toBeVisible({ timeout: 15_000 });
    await firstCard.click();

    // Debe abrir la ficha técnica
    await page.waitForURL(/\/(series|catalogo)\/.+/, { timeout: 15_000 });
    await expect(page.locator('body')).not.toContainText('404');
    await expect(page.locator('body')).not.toContainText('Application error');

    // Debe renderizar el encabezado o título de la serie
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
    const titulo = await heading.innerText();
    expect(titulo.length).toBeGreaterThan(0);
  });

  test('3. Navegación en Streaming Hub (/ver) y verificación de reproductor', async ({ page }) => {
    await page.goto('/ver');

    // Debe existir al menos un enlace a un título con reproductor oficial
    const streamLink = page.locator('a[href*="/ver/"]').first();
    await expect(streamLink).toBeVisible({ timeout: 15_000 });

    const href = await streamLink.getAttribute('href');
    expect(href).toBeTruthy();

    // Navegar al reproductor de la serie
    const res = await page.goto(href!);
    expect(res?.status()).toBeLessThan(400);
    await expect(page.locator('body')).not.toContainText('Application error');
    await expect(page.locator('body')).not.toContainText('404');
  });

  test('4. Glosario cultural y verificación de integridad de términos', async ({ page }) => {
    const res = await page.goto('/glosario');
    expect(res?.status()).toBeLessThan(400);

    // Debe renderizar el glosario cultural sin errores
    await expect(page.locator('body')).not.toContainText('Application error');
    await expect(page.locator('body')).not.toContainText('404');

    // Debe existir contenido explicativo o listado de términos
    const terms = page.locator('article, .glosario-card, .term-card, [class*="term"], [class*="glossary"]');
    if (await terms.first().isVisible({ timeout: 5_000 }).catch(() => false)) {
      expect(await terms.count()).toBeGreaterThan(0);
    } else {
      // Si la UI usa tabla o acordeones, validar presencia de texto sustantivo
      await expect(page.locator('main, #__next, body')).toContainText(/(Glosario|Términos|Honoríficos|Cultural)/i);
    }
  });
});
