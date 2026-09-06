export const revalidate = 600;

import type { Metadata } from 'next';
import { getActorsIndex, getPeopleNationalities } from '@/lib/database';
import { isIndexablePerson } from '@/lib/person-completeness';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs/Breadcrumbs';
import { PeopleIndexShell } from './PeopleIndexShell';
import {
  parsePeopleSearchParams,
  buildPeopleHref,
  type PeopleSearchParams,
} from '@/lib/people-index-params';

const PER_PAGE = 48;

export const metadata: Metadata = {
  title: 'Actores | Reparto del catálogo - MundoBL',
  description:
    'Todos los actores del catálogo de MundoBL, ordenados por cantidad de títulos. Explorá la filmografía completa de cada intérprete.',
  alternates: { canonical: '/actores' },
};

export default async function ActoresPage({
  searchParams,
}: {
  searchParams: Promise<PeopleSearchParams>;
}) {
  const params = parsePeopleSearchParams(await searchParams);

  const [{ rows, total }, nationalities] = await Promise.all([
    getActorsIndex({ ...params, perPage: PER_PAGE }),
    getPeopleNationalities(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

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
        total={total}
        page={params.page}
        totalPages={totalPages}
        prevHref={buildPeopleHref('/actores', params, params.page - 1)}
        nextHref={buildPeopleHref('/actores', params, params.page + 1)}
        nationalities={nationalities}
        items={rows.map((actor) => ({
          id: actor.id,
          href: `/actores/${actor.id}`,
          name: actor.name,
          subtitle: actor.stageName ?? actor.nationality,
          imageUrl: actor.imageUrl,
          count: actor.creditCount,
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
