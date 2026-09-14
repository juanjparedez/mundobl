import type { MetadataRoute } from 'next';

const BASE_URL = 'https://mundobl.com.ar';

/**
 * Shards que expone src/app/sitemap.ts via generateSitemaps().
 * Si se agrega o saca uno alla, actualizar aca: son la unica forma que
 * tiene un crawler de encontrarlos.
 */
const SITEMAP_SHARDS = [0, 1, 2, 3, 4, 5, 6, 7] as const;

// Estrategia:
// - Permitir todo el contenido publico (catalogo, series, actores,
//   directores, tags, noticias, ver, sitios, novedades, estadisticas).
// - Bloquear rutas privadas/admin: paneles, perfil del usuario,
//   notificaciones, watching dashboard, APIs.
// - Bloquear paths que solo buscan scanners (.php, /wp-, etc.)
//   para no contaminar el crawl budget.
// - Anunciar los shards del sitemap UNO POR UNO.
//   Medido el 2026-09-14 en produccion: /sitemap.xml da 404. Con
//   generateSitemaps(), Next 16 sirve /sitemap/0.xml .. /sitemap/7.xml
//   pero NO genera el indice en /sitemap.xml, aunque este archivo lo
//   anunciaba igual. Resultado: Google pedia una URL inexistente y los
//   8 shards quedaban sin descubrir. robots.txt acepta varias lineas
//   Sitemap:, asi que se listan todos y no hace falta el indice.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          // Admin
          '/admin',
          '/admin/*',
          // APIs (no son paginas, no aportan SEO)
          '/api',
          '/api/*',
          // Privadas del usuario
          '/perfil',
          '/perfil/*',
          '/notificaciones',
          '/notificaciones/*',
          '/watching',
          '/watching/*',
          // Auth flows (no indexar callbacks)
          '/auth/*',
          // Paths comunes de scanners (tambien bloqueados a nivel
          // proxy.ts con 404, pero conviene reforzarlo aca)
          '/wp-*',
          '/wordpress/*',
          '/.env',
          '/.git/*',
          // Paths internos (no son rutas reales del app, pero algunos
          // crawlers prueban estas convenciones)
          '/scripts',
          '/data',
        ],
      },
    ],
    sitemap: SITEMAP_SHARDS.map((id) => `${BASE_URL}/sitemap/${id}.xml`),
    host: BASE_URL,
  };
}
