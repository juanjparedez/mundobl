import type { Metadata, Viewport } from 'next';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { App } from 'antd';
import { ThemeProvider } from '@/lib/providers/ThemeProvider';
import { SessionProvider } from '@/lib/providers/SessionProvider';
import { ServiceWorkerRegistrar } from '@/components/ServiceWorkerRegistrar/ServiceWorkerRegistrar';
import { JsonLd } from '@/components/seo/JsonLd';
import type { WebSite } from 'schema-dts';
import 'flag-icons/css/flag-icons.min.css';
import '@/styles/globals.css';
import '@/styles/dark-mode-fixes.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://mundobl.win'),
  title: {
    default: 'MundoBL - Catálogo de Series BL, GL y Doramas Asiáticos',
    template: '%s | MundoBL',
  },
  description:
    'Descubre y explora el catálogo más completo de series BL (Boys Love), GL (Girls Love) y doramas asiáticos. Reseñas, calificaciones, actores y más de series de Tailandia, Japón, Corea, China y Taiwán.',
  keywords: [
    'series BL',
    'Boys Love',
    'GL',
    'Girls Love',
    'doramas asiáticos',
    'doramas BL',
    'series tailandesas',
    'BL tailandés',
    'BL japonés',
    'BL coreano',
    'BL chino',
    'BL taiwanés',
    'catálogo BL',
    'reseñas doramas',
  ],
  verification: {
    google: 'Yp0Pjs7gScD3_wH8Za8VkiyA1tlnEIG6gjmKp_WcMyg',
  },
  openGraph: {
    type: 'website',
    locale: 'es_LA',
    siteName: 'MundoBL',
    title: 'MundoBL - Catálogo de Series BL, GL y Doramas Asiáticos',
    description:
      'Descubre y explora el catálogo más completo de series BL (Boys Love), GL (Girls Love) y doramas asiáticos.',
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'MundoBL - Catálogo de Series BL, GL y Doramas Asiáticos',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MundoBL - Catálogo de Series BL, GL y Doramas Asiáticos',
    description:
      'Descubre y explora el catálogo más completo de series BL (Boys Love), GL (Girls Love) y doramas asiáticos.',
    images: ['/images/og-image.png'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'MundoBL',
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
            __html: `(function(){var t=localStorage.getItem('theme');if(t)document.documentElement.setAttribute('data-theme',t)})()`,
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
            potentialAction: {
              '@type': 'SearchAction',
              target: 'https://mundobl.win/catalogo?q={search_term_string}',
            },
          }}
        />
        <ServiceWorkerRegistrar />
        <SessionProvider>
          <AntdRegistry>
            <ThemeProvider>
              <App>{children}</App>
            </ThemeProvider>
          </AntdRegistry>
        </SessionProvider>
      </body>
    </html>
  );
}
