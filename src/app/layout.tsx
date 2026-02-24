import type { Metadata, Viewport } from 'next';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { App } from 'antd';
import { ThemeProvider } from '@/lib/providers/ThemeProvider';
import { SessionProvider } from '@/lib/providers/SessionProvider';
import { ServiceWorkerRegistrar } from '@/components/ServiceWorkerRegistrar/ServiceWorkerRegistrar';
import 'flag-icons/css/flag-icons.min.css';
import '@/styles/globals.css';
import '@/styles/dark-mode-fixes.css';

export const metadata: Metadata = {
  title: 'MundoBL - Catálogo de Series',
  description: 'Sistema de gestión de catálogo de series',
  verification: {
    google: 'Yp0Pjs7gScD3_wH8Za8VkiyA1tlnEIG6gjmKp_WcMyg',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'MundoBL',
  },
  icons: {
    icon: [
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
    <html lang="es" suppressHydrationWarning>
      <body>
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
