export const revalidate = 3600;

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { JsonLd } from '@/components/seo/JsonLd';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs/Breadcrumbs';
import type { Person } from 'schema-dts';
import { getDirectorById, findActorIdByName } from '@/lib/database';
import { isIndexablePerson } from '@/lib/person-completeness';
import { DirectorProfileClient } from './DirectorProfileClient';

interface DirectorPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: DirectorPageProps): Promise<Metadata> {
  const { id } = await params;
  const directorId = parseInt(id, 10);
  if (isNaN(directorId)) return {};

  const director = await getDirectorById(directorId);
  if (!director) return {};

  const seriesCount = director.series?.length ?? 0;
  const description = director.biography
    ? director.biography.slice(0, 160).replace(/\n/g, ' ')
    : `Perfil de ${director.name}. ${seriesCount} series BL dirigidas. Descubre su trabajo en MundoBL.`;

  // Mismo criterio que la ficha de actor: sin foto, sin bio y con un solo
  // credito no aporta nada propio — navegable, pero fuera del indice.
  const indexable = isIndexablePerson({
    imageUrl: director.imageUrl,
    biography: director.biography,
    creditCount: seriesCount,
  });

  return {
    title: `${director.name} | Series Dirigidas y Filmografía - Director BL`,
    description,
    alternates: {
      canonical: `/directores/${director.id}`,
    },
    robots: indexable ? undefined : { index: false, follow: true },
    openGraph: {
      title: director.name,
      description,
      url: `/directores/${director.id}`,
      ...(director.imageUrl && {
        images: [{ url: director.imageUrl, alt: director.name }],
      }),
    },
    twitter: {
      card: 'summary',
      title: director.name,
      description,
      ...(director.imageUrl && { images: [director.imageUrl] }),
    },
  };
}

export default async function DirectorPage({ params }: DirectorPageProps) {
  const { id } = await params;
  const directorId = parseInt(id, 10);

  if (isNaN(directorId)) {
    notFound();
  }

  const director = await getDirectorById(directorId);

  if (!director) {
    notFound();
  }

  // Hay personas que dirigen y actuan: cruzamos las dos fichas.
  const actorId = await findActorIdByName(director.name);

  return (
    <>
      <JsonLd<Person>
        data={{
          '@context': 'https://schema.org',
          '@type': 'Person',
          name: director.name,
          ...(director.imageUrl && { image: director.imageUrl }),
          ...(director.biography && { description: director.biography }),
          ...(director.nationality && {
            nationality: { '@type': 'Country', name: director.nationality },
          }),
          ...(director.aliases &&
            director.aliases.length > 0 && {
              alternateName: director.aliases,
            }),
          ...((director.imdbUrl || director.mdlUrl || director.wikiUrl) && {
            sameAs: [
              director.imdbUrl,
              director.mdlUrl,
              director.wikiUrl,
            ].filter((u): u is string => !!u),
          }),
          ...(director.birthYear && { birthDate: String(director.birthYear) }),
          ...(director.awards &&
            director.awards.length > 0 && {
              award: director.awards,
            }),
          url: `https://mundobl.com.ar/directores/${director.id}`,
        }}
      />
      <Breadcrumbs
        items={[
          { name: 'Inicio', href: '/' },
          { name: 'Directores', href: '/directores' },
          { name: director.name },
        ]}
      />
      <DirectorProfileClient director={director} actorId={actorId} />
    </>
  );
}
