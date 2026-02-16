import '@ant-design/v5-patch-for-react-19';
import type { Metadata } from 'next';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { App } from 'antd';
import { ThemeProvider } from '@/lib/providers/ThemeProvider';
import '@/styles/globals.css';
import '@/styles/dark-mode-fixes.css';

export const metadata: Metadata = {
  title: 'MundoBL - Catálogo de Series',
  description: 'Sistema de gestión de catálogo de series',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        <AntdRegistry>
          <ThemeProvider>
            <App>{children}</App>
          </ThemeProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
