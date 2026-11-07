import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import type { NextConfig } from 'next';
import { getBuildMetadata } from './src/lib/build-metadata';
import { OPTIMIZED_IMAGE_HOSTS } from './src/lib/image-helpers';

// Actions pasa SHA y fecha al build remoto, donde no hay .git.
// En desarrollo se usa Git local; sin metadatos queda un fallback silencioso.
const buildMetadata = getBuildMetadata();

// Version de public/antd.css (scripts/generate-antd-css.ts) para el `?v=` de
// AntdStaticStyles: cambia solo si cambia la hoja, asi se puede cachear como
// inmutable. Sin el archivo (lint/tipos sin build) cae al buildId.
function getAntdCssVersion(): string {
  try {
    return createHash('sha1')
      .update(readFileSync('public/antd.css'))
      .digest('hex')
      .slice(0, 12);
  } catch {
    return buildMetadata.buildId;
  }
}

function readOptionalFile(path: string): string {
  try {
    return readFileSync(path, 'utf-8');
  } catch {
    return '';
  }
}

function readPackageVersion(): string {
  const pkg = JSON.parse(readOptionalFile('package.json') || '{}') as {
    version?: string;
  };
  return pkg.version ?? '0.0.0';
}

const nextConfig: NextConfig = {
  generateBuildId: () => buildMetadata.buildId,
  // En Cloudflare Workers no hay filesystem en runtime: lo que antes se leia
  // con fs (BUILD_ID, package.json, CHANGELOG.md, git log) viaja inlineado.
  env: {
    BUILD_COMMIT_DATE: buildMetadata.commitDate,
    MUNDOBL_BUILD_ID: buildMetadata.buildId,
    MUNDOBL_PACKAGE_VERSION: readPackageVersion(),
    MUNDOBL_CHANGELOG_MD: readOptionalFile('CHANGELOG.md'),
    MUNDOBL_RECENT_COMMITS: buildMetadata.recentCommits,
    NEXT_PUBLIC_ANTD_CSS_VERSION: getAntdCssVersion(),
  },
  reactStrictMode: true,
  // Cloudflare (OpenNext): el cliente de Prisma tiene que quedar como paquete
  // externo para que OpenNext lo cambie por su variante de workerd, que
  // importa el WASM del query compiler en vez de compilarlo en runtime
  // (prohibido en Workers). Ver open-next.config.ts.
  serverExternalPackages: ['@prisma/client', '.prisma/client'],
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
    // En Cloudflare el optimizador de next/image usa Cloudflare Images, que
    // en el plan gratis corta en 5.000 transformaciones unicas por mes (cada
    // ancho de cada miniatura cuenta) y despues la imagen falla. Las
    // miniaturas externas (YouTube, TMDB, avatares) se sirven directo y los
    // posters ya vienen optimizados de R2 (ver image-processing.ts).
    unoptimized: true,
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 2592000,
    deviceSizes: [360, 480, 640, 768, 1024, 1280, 1536],
    imageSizes: [48, 64, 96, 110, 160, 180, 230, 260, 320],
    // Next 15+ requires every <Image quality={n}> value to be whitelisted here,
    // otherwise the optimizer responds 400 INVALID_IMAGE_OPTIMIZE_REQUEST.
    qualities: [35, 50, 55, 60, 65, 70, 72, 75, 78],
    remotePatterns: [
      // Cloudflare R2 (posters). Van con `unoptimized` — ver
      // isDirectServedImageUrl — pero el patron queda igual como red: sin el,
      // cualquier <Image> que se olvide del flag tira error de runtime
      // ("hostname is not configured") en vez de degradarse.
      { protocol: 'https', hostname: 'img.mundobl.com.ar' },
      { protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/**' },
      ...OPTIMIZED_IMAGE_HOSTS.map((hostname) => ({
        protocol: 'https' as const,
        hostname,
      })),
    ],
  },
  // Headers globales de seguridad + ajustes de Permissions-Policy para que
  // iframes legítimos (YouTube embed, etc.) no llenen la consola de warnings.
  async headers() {
    // Hosts de embeds soportados (embed-helpers.ts: 5 plataformas).
    const frameSrcOrigins = [
      "'self'",
      'https://www.youtube.com',
      'https://www.youtube-nocookie.com',
      'https://player.vimeo.com',
      'https://player.bilibili.com',
      'https://www.dailymotion.com',
      'https://geo.dailymotion.com',
      'https://open.spotify.com',
    ];
    const frameSrc = frameSrcOrigins.join(' ');
    // Mismos hosts que frame-src, pero en la sintaxis de allowlist de
    // Permissions-Policy: 'self' (CSP) -> self (sin comillas), el resto
    // entre comillas dobles.
    const sensorAllowlist = frameSrcOrigins
      .map((origin) => (origin === "'self'" ? 'self' : `"${origin}"`))
      .join(' ');
    const isDev = process.env.NODE_ENV === 'development';
    // Next.js inyecta scripts inline de bootstrap y antd inyecta estilos inline;
    // por eso 'unsafe-inline'. 'unsafe-eval' solo en dev (Next dev usa eval en HMR).
    // img-src: permitir cualquier https (las imágenes no ejecutan código → riesgo
    // bajo). Necesario porque cargamos favicons externos (Google S2:
    // www.google.com/s2/favicons via getFaviconUrl) y URLs de imagen externas
    // legacy. Restringirlo por host rompía logos/favicons (ej. /sitios).
    const csp = [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline' https://www.youtube.com${isDev ? " 'unsafe-eval'" : ''}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data: https:",
      "connect-src 'self' https:",
      "media-src 'self' https: blob:",
      `frame-src ${frameSrc}`,
      "frame-ancestors 'self'",
      "base-uri 'self'",
      // La pagina generica /api/auth/signin postea un form a
      // /api/auth/signin/google, que responde 302 a Google. Chrome chequea
      // form-action en cada salto del redirect, asi que sin este host el
      // login desde ahi queda bloqueado.
      "form-action 'self' https://accounts.google.com",
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
              // EmbedPlayer.tsx pide accelerometer+gyroscope en el `allow`
              // del iframe para TODAS las plataformas (asi lo generan los
              // embeds oficiales, ej. YouTube). Una Permissions-Policy con
              // allowlist vacia (`=()`) no es "silenciar el warning": es
              // prohibir el feature a TODO el documento, y eso incluye
              // cualquier delegacion a un iframe hijo por mas que su propio
              // `allow` lo pida. Con eso denegado, YouTube no puede leer la
              // rotacion del telefono via sensores y el video en pantalla
              // completa se queda con el tamaño de antes de rotar en vez de
              // ocupar toda la pantalla. Se delega a los mismos hosts que
              // frame-src (ya son de confianza para el CSP).
              `accelerometer=(${sensorAllowlist})`,
              `gyroscope=(${sensorAllowlist})`,
              'magnetometer=()',
              'usb=()',
            ].join(', '),
          },
        ],
      },
      {
        // Versionada por contenido via `?v=` (ver AntdStaticStyles).
        source: '/antd.css',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
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
  // a /perfil, que ahora va en pestañas. /perfil/estadisticas paso a ser la
  // pestaña Estadisticas (no permanente: el destino depende de ?tab=).
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
      {
        source: '/perfil/estadisticas',
        destination: '/perfil?tab=estadisticas',
        permanent: false,
      },
    ];
  },
  // allowedDevOrigins solo aplica en dev local
  ...(process.env.NODE_ENV === 'development' && {
    allowedDevOrigins: ['192.168.1.36'],
  }),
};

export default nextConfig;
