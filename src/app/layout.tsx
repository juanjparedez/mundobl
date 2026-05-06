import type { Metadata, Viewport } from 'next';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { App } from 'antd';
import { ThemeProvider } from '@/lib/providers/ThemeProvider';
import { SessionProvider } from '@/lib/providers/SessionProvider';
import { LocaleProvider } from '@/lib/providers/LocaleProvider';
import { SpoilerFreeProvider } from '@/lib/providers/SpoilerFreeProvider';
import { ServiceWorkerRegistrar } from '@/components/ServiceWorkerRegistrar/ServiceWorkerRegistrar';
import { JsonLd } from '@/components/seo/JsonLd';
import type { WebSite, Organization } from 'schema-dts';
import 'flag-icons/css/flag-icons.min.css';
import '@/styles/globals.css';
import '@/styles/dark-mode-fixes.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://mundobl.win'),
  title: {
    default: 'MundoBL - Catálogo de Series BL',
    template: '%s | MundoBL',
  },
  description:
    'Catálogo de series BL. Reseñas, calificaciones, episodios y seguimiento de series.',
  keywords: [
    'series BL',
    'Boys Love',
    'catálogo BL',
    'reseñas series',
    'tailandés',
    'coreano',
    'japonés',
  ],
  verification: {
    google: 'Yp0Pjs7gScD3_wH8Za8VkiyA1tlnEIG6gjmKp_WcMyg',
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  category: 'entertainment',
  authors: [{ name: 'MundoBL' }],
  creator: 'MundoBL',
  publisher: 'MundoBL',
  openGraph: {
    type: 'website',
    locale: 'es_LA',
    siteName: 'MundoBL',
    title: 'MundoBL - Catálogo de Series BL',
    description:
      'Catálogo de series BL. Reseñas, calificaciones y seguimiento.',
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'MundoBL - Catálogo de Series BL',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MundoBL - Catálogo de Series BL',
    description:
      'Catálogo de series BL. Reseñas, calificaciones y seguimiento.',
    images: ['/images/og-image.png'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'MundoBL',
  },
  alternates: {
    canonical: '/',
    languages: {
      'es-LA': '/',
      es: '/',
      'x-default': '/',
    },
    types: {
      'application/rss+xml': [
        { url: '/noticias/rss.xml', title: 'MundoBL - Noticias BL/GL' },
      ],
    },
  },
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      {
        url: '/icons/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: '#141414',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" data-theme="dark" suppressHydrationWarning>
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var d=document.documentElement;var ls=window.localStorage;function s(k,v,def){var raw=ls.getItem(k);if(raw&&v.indexOf(raw)>-1&&raw!==def){d.setAttribute('data-'+k.replace('theme-',''),raw)}}var t=ls.getItem('theme');if(t==='light'||t==='dark')d.setAttribute('data-theme',t);s('theme-tone',['default','warm','cool','contrast'],'default');s('theme-font',['system','serif','mono','dyslexic'],'system');s('theme-scale',['sm','md','lg','xl'],'md');s('theme-density',['compact','comfortable','spacious'],'comfortable');s('theme-motion',['auto','reduce'],'auto');s('theme-saver',['off','on'],'off')}catch(e){}})()`,
          }}
        />
        <JsonLd<WebSite>
          data={{
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'MundoBL',
            url: 'https://mundobl.win',
            description:
              'Catálogo de series BL (Boys Love), GL (Girls Love) y doramas asiáticos.',
            inLanguage: ['es', 'en'],
            potentialAction: {
              '@type': 'SearchAction',
              target: 'https://mundobl.win/catalogo?q={search_term_string}',
            },
          }}
        />
        <JsonLd<Organization>
          data={{
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'MundoBL',
            url: 'https://mundobl.win',
            logo: 'https://mundobl.win/icons/icon-512x512.png',
            description:
              'Comunidad y catálogo de series BL (Boys Love) y GL (Girls Love) con reseñas, calificaciones y seguimiento.',
          }}
        />
        <ServiceWorkerRegistrar />
        <SessionProvider>
          <AntdRegistry>
            <LocaleProvider>
              <ThemeProvider>
                <SpoilerFreeProvider>
                  <App>{children}</App>
                </SpoilerFreeProvider>
              </ThemeProvider>
            </LocaleProvider>
          </AntdRegistry>
        </SessionProvider>
      </body>
    </html>
  );
}
