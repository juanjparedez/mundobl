export const revalidate = 600;

import type { Metadata } from 'next';
import { getProductionCompaniesIndex } from '@/lib/database';
import { isIndexableCompany } from '@/lib/person-completeness';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs/Breadcrumbs';
import { PeopleIndexShell } from '../actores/PeopleIndexShell';
import {
  parsePeopleSearchParams,
  buildPeopleHref,
  type PeopleSearchParams,
} from '@/lib/people-index-params';

const PER_PAGE = 48;

export const metadata: Metadata = {
  title: 'Productoras | Estudios del catálogo - MundoBL',
  description:
    'Las productoras y estudios detrás de las series del catálogo de MundoBL, con su catálogo completo.',
  alternates: { canonical: '/productoras' },
};

export default async function ProductorasPage({
  searchParams,
}: {
  searchParams: Promise<PeopleSearchParams>;
}) {
  const params = parsePeopleSearchParams(await searchParams);

  const { rows, total } = await getProductionCompaniesIndex({
    q: params.q,
    sort: params.sort,
    page: params.page,
    perPage: PER_PAGE,
  });

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

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
        total={total}
        page={params.page}
        totalPages={totalPages}
        prevHref={buildPeopleHref('/productoras', params, params.page - 1)}
        nextHref={buildPeopleHref('/productoras', params, params.page + 1)}
        items={rows.map((c) => ({
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
