import type { Metadata } from 'next';
import { AppLayout } from '@/components/layout/AppLayout/AppLayout';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs/Breadcrumbs';
import { AcercaClient } from './AcercaClient';
import './acerca.css';

export const metadata: Metadata = {
  title: 'Acerca de MundoBL | Equipo, Filosofía y Transparencia',
  description:
    'Conocé la historia de MundoBL, el equipo detrás del proyecto (Juan & Flor), nuestros principios de streaming 100% legal y el manifiesto de la comunidad.',
  alternates: {
    canonical: '/acerca',
  },
};

export default function AcercaPage() {
  return (
    <AppLayout>
      <div className="acerca-page">
        <Breadcrumbs
          items={[
            { name: 'Inicio', href: '/' },
            { name: 'Acerca de MundoBL' },
          ]}
        />
        <AcercaClient />
      </div>
    </AppLayout>
  );
}
