import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
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
