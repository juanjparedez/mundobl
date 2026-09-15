import { defineConfig, devices } from '@playwright/test';

/**
 * Configuracion de los chequeos de humo (synthetic monitoring).
 *
 * Estos tests NO escriben nada: corren contra el sitio PUBLICO y solo leen.
 * Es deliberado — la propuesta de valor de MundoBL son estadisticas reales,
 * y un bot que marque episodios o comente en produccion las ensucia. Ver la
 * memoria del proyecto sobre no fingir actividad.
 *
 * Los tests que SI escriben (registro, comentarios, moderacion) van a vivir
 * aparte, corriendo contra una base descartable en CI. Este archivo es solo
 * la capa de "¿la app publica funciona?".
 */
const baseURL = process.env.SMOKE_BASE_URL ?? 'https://mundobl.com.ar';

export default defineConfig({
  testDir: './e2e',
  // Sin reintentos infinitos: si falla dos veces es una falla real y queremos
  // el aviso, no que el workflow queme minutos reintentando.
  retries: process.env.CI ? 1 : 0,
  // Tope duro por test. Un cuelgue no puede consumir el presupuesto del runner.
  timeout: 30_000,
  expect: { timeout: 10_000 },
  // En CI de a uno: son chequeos contra produccion, no queremos pegarle en
  // paralelo a un sitio con 437 visitantes/mes.
  workers: 1,
  fullyParallel: false,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL,
    // Solo guardamos evidencia cuando algo falla: los artifacts de un repo
    // publico son descargables por cualquiera, asi que cuanto menos guardemos
    // mejor (y ademas no gastamos storage).
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
    userAgent:
      'Mozilla/5.0 (compatible; MundoBL-SmokeTest/1.0; +https://mundobl.com.ar)',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
