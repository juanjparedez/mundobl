import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api', '/watching'],
      },
    ],
    sitemap: 'https://mundobl.win/sitemap.xml',
  };
}
