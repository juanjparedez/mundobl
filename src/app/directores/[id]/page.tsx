export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout/AppLayout';
import { JsonLd } from '@/components/seo/JsonLd';
import type { Person } from 'schema-dts';
import { getDirectorById } from '@/lib/database';
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

  return {
    title: `${director.name} - Director BL`,
    description,
    alternates: {
      canonical: `/directores/${director.id}`,
    },
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

  return (
    <AppLayout>
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
          url: `https://mundobl.win/directores/${director.id}`,
        }}
      />
      <DirectorProfileClient director={director} />
    </AppLayout>
  );
}
