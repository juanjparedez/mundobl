import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'MundoBL - Catálogo de Series BL, GL y Doramas Asiáticos',
    short_name: 'MundoBL',
    description:
      'Descubre y explora el catálogo más completo de series BL (Boys Love), GL (Girls Love) y doramas asiáticos. Reseñas, calificaciones, actores y más.',
    start_url: '/',
    display: 'standalone',
    background_color: '#141414',
    theme_color: '#141414',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
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
  };
}
