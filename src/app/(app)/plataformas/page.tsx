import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs/Breadcrumbs';
import { PlataformasClient } from './PlataformasClient';
import './plataformas.css';

export const metadata: Metadata = {
  title: 'Comparador de Plataformas de Streaming BL y Planes | MundoBL',
  description:
    'Guía de plataformas para ver BL con precios de referencia, fecha de consulta, alcance regional y enlaces a fuentes oficiales. Verificá las condiciones antes de contratar.',
  alternates: {
    canonical: '/plataformas',
  },
};

export default function PlataformasPage() {
  return (
    <>
      <div className="plataformas-page">
        <Breadcrumbs
          items={[
            { name: 'Inicio', href: '/' },
            { name: 'Comparador de Plataformas' },
          ]}
        />
        <PlataformasClient />
      </div>
    </>
  );
}
