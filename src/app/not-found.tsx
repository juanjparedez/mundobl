import type { Metadata } from 'next';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/AppLayout/AppLayout';

export const metadata: Metadata = {
  title: 'Página no encontrada',
  description: 'La página que buscas no existe en MundoBL.',
};

export default function NotFound() {
  return (
    <AppLayout>
      <div style={{ textAlign: 'center', padding: '80px 24px' }}>
        <h1>404</h1>
        <p style={{ fontSize: '18px', marginBottom: '24px' }}>
          La página que buscas no existe o fue movida.
        </p>
        <Link
          href="/catalogo"
          style={{ color: 'var(--color-primary)', fontWeight: 600 }}
        >
          Volver al catálogo
        </Link>
      </div>
    </AppLayout>
  );
}
