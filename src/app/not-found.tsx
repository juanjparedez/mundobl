'use client';

import Link from 'next/link';
import { AppLayout } from '@/components/layout/AppLayout/AppLayout';
import { useLocale } from '@/lib/providers/LocaleProvider';

export default function NotFound() {
  const { t } = useLocale();

  return (
    <AppLayout>
      <div style={{ textAlign: 'center', padding: '80px 24px' }}>
        <h1>404</h1>
        <p style={{ fontSize: '18px', marginBottom: '24px' }}>
          {t('notFound.description')}
        </p>
        <Link
          href="/catalogo"
          style={{ color: 'var(--color-primary)', fontWeight: 600 }}
        >
          {t('notFound.backLink')}
        </Link>
      </div>
    </AppLayout>
  );
}
