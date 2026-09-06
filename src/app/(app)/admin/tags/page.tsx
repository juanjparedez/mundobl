import { Suspense } from 'react';
import type { Metadata } from 'next';
import { TagsAdminClient } from './TagsAdminClient';

export const metadata: Metadata = {
  title: 'Gestión de Metadatos (Tags y Géneros) | Admin MundoBL',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default function TagsPage() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: 24 }}>Cargando panel de metadatos...</div>
      }
    >
      <TagsAdminClient />
    </Suspense>
  );
}
