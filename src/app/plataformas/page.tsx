import type { Metadata } from 'next';
import { AppLayout } from '@/components/layout/AppLayout/AppLayout';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs/Breadcrumbs';
import { PlataformasClient } from './PlataformasClient';
import './plataformas.css';

export const metadata: Metadata = {
  title: 'Comparador de Plataformas de Streaming BL y Planes | MundoBL',
  description:
    'Guía comparativa oficial de plataformas para ver series BL: GagaOOLala, Rakuten Viki, YouTube Oficial, iQIYI, WeTV y Vimeo. Planes, precios, versiones sin censura y subtítulos en español.',
  alternates: {
    canonical: '/plataformas',
  },
};

export default function PlataformasPage() {
  return (
    <AppLayout>
      <div className="plataformas-page">
        <Breadcrumbs
          items={[
            { name: 'Inicio', href: '/' },
            { name: 'Comparador de Plataformas' },
          ]}
        />
        <PlataformasClient />
      </div>
    </AppLayout>
  );
}
