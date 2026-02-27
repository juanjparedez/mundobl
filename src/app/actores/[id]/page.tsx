export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout/AppLayout';
import { JsonLd } from '@/components/seo/JsonLd';
import type { Person } from 'schema-dts';
import { getActorById } from '@/lib/database';
import { ActorProfileClient } from './ActorProfileClient';

interface ActorPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: ActorPageProps): Promise<Metadata> {
  const { id } = await params;
  const actorId = parseInt(id, 10);
  if (isNaN(actorId)) return {};

  const actor = await getActorById(actorId);
  if (!actor) return {};

  const displayName = actor.stageName ?? actor.name;
  const seriesCount = actor.series?.length ?? 0;
  const description = actor.biography
    ? actor.biography.slice(0, 160).replace(/\n/g, ' ')
    : `Perfil de ${displayName}. ${seriesCount} series BL en su filmografía. Descubre su trayectoria en MundoBL.`;

  return {
    title: `${displayName} - Actor BL`,
    description,
    alternates: {
      canonical: `/actores/${actor.id}`,
    },
    openGraph: {
      title: displayName,
      description,
      url: `/actores/${actor.id}`,
      ...(actor.imageUrl && {
        images: [{ url: actor.imageUrl, alt: displayName }],
      }),
    },
    twitter: {
      card: 'summary',
      title: displayName,
      description,
      ...(actor.imageUrl && { images: [actor.imageUrl] }),
    },
  };
}

export default async function ActorPage({ params }: ActorPageProps) {
  const { id } = await params;
  const actorId = parseInt(id, 10);

  if (isNaN(actorId)) {
    notFound();
  }

  const actor = await getActorById(actorId);

  if (!actor) {
    notFound();
  }

  const displayName = actor.stageName ?? actor.name;

  return (
    <AppLayout>
      <JsonLd<Person>
        data={{
          '@context': 'https://schema.org',
          '@type': 'Person',
          name: displayName,
          ...(actor.name !== displayName && { alternateName: actor.name }),
          ...(actor.imageUrl && { image: actor.imageUrl }),
          ...(actor.biography && { description: actor.biography }),
          ...(actor.nationality && {
            nationality: { '@type': 'Country', name: actor.nationality },
          }),
          ...(actor.birthDate && {
            birthDate: actor.birthDate.toISOString().split('T')[0],
          }),
          url: `https://mundobl.win/actores/${actor.id}`,
        }}
      />
      <ActorProfileClient actor={actor} />
    </AppLayout>
  );
}
