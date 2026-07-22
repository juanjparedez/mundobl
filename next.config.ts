import type { NextConfig } from 'next';
import { execSync } from 'child_process';

const nextConfig: NextConfig = {
  generateBuildId: () => {
    try {
      return execSync('git rev-parse --short HEAD').toString().trim();
    } catch {
      return Date.now().toString(36);
    }
  },
  reactStrictMode: true,
  // /api/changelog lee CHANGELOG.md con fs en runtime (es la fuente de verdad
  // del changelog publico). Con `next start` el archivo esta en cwd, pero si
  // algun dia se pasa a output standalone/serverless este include garantiza
  // que el .md entre al bundle de esa ruta.
  outputFileTracingIncludes: {
    '/api/changelog': ['./CHANGELOG.md'],
  },
  // Reescribe `import { X } from 'antd'` / `'@ant-design/icons'` a imports
  // por-componente (antd/es/x, icons/es/icons/X). Cada módulo de icono va vía
  // AntdIcon (que tiene 'use client') → boundary client. Sin esto, el BARREL de
  // @ant-design/icons importa Context (createContext) sin 'use client' y, al
  // evaluarse en el grafo de Server Components (RSC no tiene createContext),
  // rompe el build ("createContext is not a function") — regresión de antd 6.5.
  // NOTA: NO poner antd/@ant-design/icons en transpilePackages: anula esta
  // optimización de barrel y reintroduce el crash.
  experimental: {
    optimizePackageImports: ['antd', '@ant-design/icons'],
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 2592000,
    deviceSizes: [360, 480, 640, 768, 1024, 1280, 1536],
    imageSizes: [48, 64, 96, 110, 160, 180, 230, 260, 320],
    // Next 15+ requires every <Image quality={n}> value to be whitelisted here,
    // otherwise the optimizer responds 400 INVALID_IMAGE_OPTIMIZE_REQUEST.
    qualities: [35, 50, 55, 60, 65, 70, 72, 75, 78],
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/**' },
      { protocol: 'https', hostname: 'i.ytimg.com' },
      { protocol: 'https', hostname: 'img.youtube.com' },
      // Avatares de Google: no solo lh3 (lh4/lh5/lh6, etc.) + fotos de perfil.
      { protocol: 'https', hostname: '*.googleusercontent.com' },
      { protocol: 'https', hostname: '*.ggpht.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      // Posters/thumbnails externos que quedan como imageUrl cruda cuando el
      // re-hosteo a Supabase falla (o se pegan a mano en el admin).
      { protocol: 'https', hostname: 'image.tmdb.org' },
      { protocol: 'https', hostname: 'i.vimeocdn.com' },
    ],
  },
  // Headers globales de seguridad + ajustes de Permissions-Policy para que
  // iframes legítimos (YouTube embed, etc.) no llenen la consola de warnings.
  async headers() {
    // Hosts de embeds soportados (embed-helpers.ts: 8 plataformas).
    const frameSrc = [
      "'self'",
      'https://www.youtube.com',
      'https://www.youtube-nocookie.com',
      'https://player.vimeo.com',
      'https://player.bilibili.com',
      'https://www.dailymotion.com',
      'https://geo.dailymotion.com',
      'https://www.tiktok.com',
      'https://www.instagram.com',
      'https://platform.twitter.com',
      'https://twitter.com',
      'https://x.com',
      'https://open.spotify.com',
    ].join(' ');
    const isDev = process.env.NODE_ENV === 'development';
    // Next.js inyecta scripts inline de bootstrap y antd inyecta estilos inline;
    // por eso 'unsafe-inline'. 'unsafe-eval' solo en dev (Next dev usa eval en HMR).
    // img-src: permitir cualquier https (las imágenes no ejecutan código → riesgo
    // bajo). Necesario porque cargamos favicons externos (Google S2:
    // www.google.com/s2/favicons via getFaviconUrl) y URLs de imagen externas
    // legacy. Restringirlo por host rompía logos/favicons (ej. /sitios).
    const csp = [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data: https:",
      "connect-src 'self' https:",
      "media-src 'self' https: blob:",
      `frame-src ${frameSrc}`,
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      'upgrade-insecure-requests',
    ].join('; ');

    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Permissions-Policy',
            value: [
              'compute-pressure=(self "https://www.youtube-nocookie.com" "https://www.youtube.com")',
              'accelerometer=()',
              'gyroscope=()',
              'magnetometer=()',
              'usb=()',
            ].join(', '),
          },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
    ];
  },
  // Redirects permanentes 301: rutas absorbidas por consolidaciones del
  // dashboard. /admin/dashboard y /perfil/dashboard ambas apuntan ahora
  // a /perfil que renderea el DashboardClient con layouts fijos por rol
  // y customizacion via CustomizeDrawer.
  async redirects() {
    return [
      {
        source: '/admin/dashboard',
        destination: '/perfil',
        permanent: true,
      },
      {
        source: '/perfil/dashboard',
        destination: '/perfil',
        permanent: true,
      },
    ];
  },
  // allowedDevOrigins solo aplica en dev local
  ...(process.env.NODE_ENV === 'development' && {
    allowedDevOrigins: ['192.168.1.36'],
  }),
};

export default nextConfig;
