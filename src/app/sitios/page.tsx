import type { Metadata } from 'next';
import { prisma } from '@/lib/database';
import { JsonLd } from '@/components/seo/JsonLd';
import type { CollectionPage } from 'schema-dts';
import { SitiosPage } from './SitiosPage';

export const dynamic = 'force-dynamic';

const SITIOS_DESCRIPTION =
  'Lista de sitios y plataformas recomendadas para ver series BL (Boys Love), GL y doramas asiáticos online.';

export const metadata: Metadata = {
  title: 'Sitios Recomendados para Ver Series BL',
  description: SITIOS_DESCRIPTION,
  alternates: {
    canonical: '/sitios',
  },
};

export default async function Sitios() {
  const sites = await prisma.recommendedSite.findMany({
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  });

  return (
    <>
      <JsonLd<CollectionPage>
        data={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'Sitios Recomendados',
          description: SITIOS_DESCRIPTION,
          url: 'https://mundobl.com.ar/sitios',
          isPartOf: {
            '@type': 'WebSite',
            name: 'MundoBL',
            url: 'https://mundobl.com.ar',
          },
          mainEntity: {
            '@type': 'ItemList',
            numberOfItems: sites.length,
            itemListElement: sites.slice(0, 30).map((s, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              url: s.url,
              name: s.name,
            })),
          },
        }}
      />
      <SitiosPage sites={sites} />
    </>
  );
}
