import type { MetadataRoute } from 'next';

const BASE_URL = 'https://mundobl.com.ar';

// Estrategia:
// - Permitir todo el contenido publico (catalogo, series, actores,
//   directores, tags, noticias, ver, sitios, novedades, estadisticas).
// - Bloquear rutas privadas/admin: paneles, perfil del usuario,
//   notificaciones, watching dashboard, APIs.
// - Bloquear paths que solo buscan scanners (.php, /wp-, etc.)
//   para no contaminar el crawl budget.
// - Apuntar al sitemap-index en /sitemap.xml (Next.js lo genera
//   automaticamente cuando hay generateSitemaps).
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
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
