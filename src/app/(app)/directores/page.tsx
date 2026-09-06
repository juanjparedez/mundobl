export const revalidate = 600;

import type { Metadata } from 'next';
import { getDirectorsIndex, getPeopleNationalities } from '@/lib/database';
import { isIndexablePerson } from '@/lib/person-completeness';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs/Breadcrumbs';
import { PeopleIndexShell } from '../actores/PeopleIndexShell';
import {
  parsePeopleSearchParams,
  buildPeopleHref,
  type PeopleSearchParams,
} from '@/lib/people-index-params';

const PER_PAGE = 48;

export const metadata: Metadata = {
  title: 'Directores | Catálogo BL - MundoBL',
  description:
    'Directores de las series del catálogo de MundoBL, ordenados por cantidad de títulos dirigidos.',
  alternates: { canonical: '/directores' },
};

export default async function DirectoresPage({
  searchParams,
}: {
  searchParams: Promise<PeopleSearchParams>;
}) {
  const params = parsePeopleSearchParams(await searchParams);

  const [{ rows, total }, nationalities] = await Promise.all([
    getDirectorsIndex({ ...params, perPage: PER_PAGE }),
    getPeopleNationalities(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

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
        total={total}
        page={params.page}
        totalPages={totalPages}
        prevHref={buildPeopleHref('/directores', params, params.page - 1)}
        nextHref={buildPeopleHref('/directores', params, params.page + 1)}
        nationalities={nationalities}
        items={rows.map((d) => ({
          id: d.id,
          href: `/directores/${d.id}`,
          name: d.name,
          subtitle: d.nationality,
          imageUrl: d.imageUrl,
          count: d.creditCount,
          indexable: isIndexablePerson({
            imageUrl: d.imageUrl,
            biography: d.biography,
            creditCount: d.creditCount,
          }),
        }))}
      />
    </>
  );
}
