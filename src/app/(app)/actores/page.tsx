// Estatica: la pagina ya no lee searchParams, asi que este revalidate vuelve
// a aplicar de verdad. Busqueda, orden y filtro viven en el cliente.
export const revalidate = 604800;

import type { Metadata } from 'next';
import { getActorsIndex, getPeopleNationalities } from '@/lib/database';
import { isIndexablePerson } from '@/lib/person-completeness';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs/Breadcrumbs';
import { PeopleIndexShell } from './PeopleIndexShell';

export const metadata: Metadata = {
  title: 'Actores | Reparto del catálogo - MundoBL',
  description:
    'Todos los actores del catálogo de MundoBL, ordenados por cantidad de títulos. Explorá la filmografía completa de cada intérprete.',
  alternates: { canonical: '/actores' },
};

export default async function ActoresPage() {
  const [actors, nationalities] = await Promise.all([
    getActorsIndex(),
    getPeopleNationalities(),
  ]);

  return (
    <>
      <Breadcrumbs
        items={[{ name: 'Inicio', href: '/' }, { name: 'Actores' }]}
      />
      <PeopleIndexShell
        titleKey="peopleIndex.actorsTitle"
        subtitleKey="peopleIndex.actorsSubtitle"
        countKey="peopleIndex.creditsCount"
        current="/actores"
        nationalities={nationalities}
        items={actors.map((actor) => ({
          id: actor.id,
          href: `/actores/${actor.id}`,
          name: actor.name,
          subtitle: actor.stageName ?? actor.nationality,
          imageUrl: actor.imageUrl,
          count: actor.creditCount,
          nationality: actor.nationality,
          // `biography` se colapsa a un booleano ACA y no viaja al cliente:
          // el texto largo no se muestra en el indice.
          indexable: isIndexablePerson({
            imageUrl: actor.imageUrl,
            biography: actor.biography,
            creditCount: actor.creditCount,
          }),
        }))}
      />
    </>
  );
}
