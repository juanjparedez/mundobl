// Estatica: la pagina ya no lee searchParams, asi que este revalidate vuelve
// a aplicar de verdad. Busqueda y orden viven en el cliente.
export const revalidate = 604800;

import type { Metadata } from 'next';
import { getProductionCompaniesIndex } from '@/lib/database';
import { isIndexableCompany } from '@/lib/person-completeness';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs/Breadcrumbs';
import { PeopleIndexShell } from '../actores/PeopleIndexShell';

export const metadata: Metadata = {
  title: 'Productoras | Estudios del catálogo - MundoBL',
  description:
    'Las productoras y estudios detrás de las series del catálogo de MundoBL, con su catálogo completo.',
  alternates: { canonical: '/productoras' },
};

export default async function ProductorasPage() {
  const companies = await getProductionCompaniesIndex();

  return (
    <>
      <Breadcrumbs
        items={[{ name: 'Inicio', href: '/' }, { name: 'Productoras' }]}
      />
      <PeopleIndexShell
        titleKey="peopleIndex.companiesTitle"
        subtitleKey="peopleIndex.companiesSubtitle"
        countKey="peopleIndex.seriesCount"
        current="/productoras"
        avatarShape="square"
        items={companies.map((c) => ({
          id: c.id,
          href: `/productoras/${c.id}`,
          name: c.name,
          subtitle: c.countryName,
          imageUrl: c.imageUrl,
          count: c.seriesCount,
          indexable: isIndexableCompany({
            imageUrl: c.imageUrl,
            description: c.description,
            seriesCount: c.seriesCount,
          }),
        }))}
      />
    </>
  );
}
