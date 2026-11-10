import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'MundoBL - Catálogo de Series BL',
    short_name: 'MundoBL',
    description:
      'Catálogo de series BL. Reseñas, calificaciones y seguimiento.',
    // `id` fijo: si algun dia cambia start_url, Chrome sigue reconociendo
    // la app instalada como la misma en vez de ofrecer instalar otra.
    id: '/',
    start_url: '/',
    scope: '/',
    lang: 'es',
    dir: 'ltr',
    categories: ['entertainment', 'lifestyle'],
    display: 'standalone',
    background_color: '#141414',
    theme_color: '#141414',
    // 'any' en vez de 'portrait-primary': ese lock bloqueaba la rotacion a
    // horizontal al poner un video en pantalla completa desde el navegador
    // in-app (contextos standalone/PWA respetan este valor del manifest).
    orientation: 'any',
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-maskable-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: 'Catálogo',
        short_name: 'Catálogo',
        url: '/catalogo',
        icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }],
      },
      {
        name: 'Mi Lista',
        short_name: 'Mi Lista',
        url: '/watching',
        icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }],
      },
      {
        name: 'Sitios',
        short_name: 'Sitios',
        url: '/sitios',
        icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }],
      },
    ],
    screenshots: [
      {
        src: '/images/og-image.png',
        sizes: '1200x630',
        type: 'image/png',
        form_factor: 'wide',
      },
    ],
  };
}
