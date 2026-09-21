// Estatica: la pagina ya no lee searchParams, asi que este revalidate vuelve
// a aplicar de verdad. Busqueda, orden y filtro viven en el cliente.
export const revalidate = 604800;

import type { Metadata } from 'next';
import { getDirectorsIndex, getPeopleNationalities } from '@/lib/database';
import { isIndexablePerson } from '@/lib/person-completeness';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs/Breadcrumbs';
import { PeopleIndexShell } from '../actores/PeopleIndexShell';

export const metadata: Metadata = {
  title: 'Directores | Catálogo BL - MundoBL',
  description:
    'Directores de las series del catálogo de MundoBL, ordenados por cantidad de títulos dirigidos.',
  alternates: { canonical: '/directores' },
};

export default async function DirectoresPage() {
  const [directors, nationalities] = await Promise.all([
    getDirectorsIndex(),
    getPeopleNationalities(),
  ]);

  return (
    <>
      <Breadcrumbs
        items={[{ name: 'Inicio', href: '/' }, { name: 'Directores' }]}
      />
      <PeopleIndexShell
        titleKey="peopleIndex.directorsTitle"
        subtitleKey="peopleIndex.directorsSubtitle"
        countKey="peopleIndex.creditsCount"
        current="/directores"
        nationalities={nationalities}
        items={directors.map((director) => ({
          id: director.id,
          href: `/directores/${director.id}`,
          name: director.name,
          subtitle: director.nationality,
          imageUrl: director.imageUrl,
          count: director.creditCount,
          nationality: director.nationality,
          // `biography` se colapsa a un booleano ACA y no viaja al cliente:
          // el texto largo no se muestra en el indice.
          indexable: isIndexablePerson({
            imageUrl: director.imageUrl,
            biography: director.biography,
            creditCount: director.creditCount,
          }),
        }))}
      />
    </>
  );
}
