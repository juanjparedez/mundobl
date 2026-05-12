import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout/AppLayout';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs/Breadcrumbs';
import { auth } from '@/lib/auth';
import { AgregarVerClient } from './AgregarVerClient';
import './agregar.css';

export const metadata: Metadata = {
  title: 'Agregar serie a /ver',
  description:
    'Pegá una URL de un canal oficial (YouTube, Vimeo, Bilibili, Dailymotion) y la IA autocompleta la metadata.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function AgregarVerPageRoute() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/api/auth/signin?callbackUrl=%2Fver%2Fagregar');
  }

  return (
    <AppLayout>
      <div className="ver-agregar-page">
        <Breadcrumbs
          items={[
            { name: 'Inicio', href: '/' },
            { name: 'Ver', href: '/ver' },
            { name: 'Agregar' },
          ]}
        />
        <AgregarVerClient />
      </div>
    </AppLayout>
  );
}
