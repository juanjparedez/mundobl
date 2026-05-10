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
  transpilePackages: ['antd', '@ant-design/icons'],
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
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
    ],
  },
  // Headers globales: ajustes de Permissions-Policy para que iframes
  // legítimos (YouTube embed, etc.) no llenen la consola de warnings.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
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
  // Redirects permanentes 301: /admin/dashboard fue absorbido por /perfil
  // (admin layout ya muestra alerts + quick actions). Se redirige para
  // bookmarks viejos y links externos.
  async redirects() {
    return [
      {
        source: '/admin/dashboard',
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
