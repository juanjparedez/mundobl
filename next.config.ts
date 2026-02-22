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
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // allowedDevOrigins solo aplica en dev local
  ...(process.env.NODE_ENV === 'development' && {
    allowedDevOrigins: ['192.168.1.36'],
  }),
};

export default nextConfig;
