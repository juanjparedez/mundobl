import type { Metadata } from 'next';
import type { CollectionPage } from 'schema-dts';
import { JsonLd } from '@/components/seo/JsonLd';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs/Breadcrumbs';
import { getAiringSchedule } from '@/lib/database';
import { EstrenosClient } from './EstrenosClient';
import './estrenos.css';

// La parrilla cambia cuando Flor carga o edita `airDays`, no sola. Una hora de
// ISR alcanza, y las rutas que escriben series revalidan esta ruta a mano.
export const revalidate = 3600;

const DESCRIPTION =
  'Qué serie BL sale cada día de la semana: parrilla de emisión de las series asiáticas que están al aire, con su día de estreno.';

export const metadata: Metadata = {
  title: 'Estrenos de la semana — series BL en emisión',
  description: DESCRIPTION,
  alternates: { canonical: '/estrenos' },
};

export default async function EstrenosPage() {
  const rows = await getAiringSchedule();

  return (
    <>
      <JsonLd<CollectionPage>
        data={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'Estrenos de la semana',
          description: DESCRIPTION,
          url: 'https://mundobl.com.ar/estrenos',
          isPartOf: {
            '@type': 'WebSite',
            name: 'MundoBL',
            url: 'https://mundobl.com.ar',
          },
          mainEntity: {
            '@type': 'ItemList',
            numberOfItems: rows.length,
            itemListElement: rows.slice(0, 30).map((s, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              url: `https://mundobl.com.ar/series/${s.id}`,
              name: s.title,
            })),
          },
        }}
      />
      <div className="estrenos-page">
        <Breadcrumbs
          items={[{ name: 'Inicio', href: '/' }, { name: 'Estrenos' }]}
        />
        <EstrenosClient rows={rows} />
      </div>
    </>
  );
}
