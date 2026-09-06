export const revalidate = 3600;

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { Person } from 'schema-dts';
import { JsonLd } from '@/components/seo/JsonLd';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs/Breadcrumbs';
import { getActorById, findDirectorIdByName } from '@/lib/database';
import { isPlaceholderActor } from '@/lib/placeholder-actor';
import { isIndexablePerson } from '@/lib/person-completeness';
import {
  ActorProfileClient,
  type FilmographyEntry,
} from './ActorProfileClient';

interface ActorPageProps {
  params: Promise<{ id: string }>;
}

async function loadActor(id: string) {
  const actorId = Number.parseInt(id, 10);
  if (Number.isNaN(actorId)) return null;
  const actor = await getActorById(actorId);
  // El placeholder "Actor no identificado" agrupa personajes sin interprete
  // conocido: no es una persona y no tiene ficha publica.
  if (!actor || isPlaceholderActor(actor)) return null;
  return actor;
}

type LoadedActor = NonNullable<Awaited<ReturnType<typeof loadActor>>>;

/**
 * Une los creditos a nivel serie y a nivel temporada en una sola entrada por
 * serie. Se hace en el SERVIDOR: antes corria en el navegador y se enviaba
 * como JS, aunque el resultado es siempre el mismo para todos.
 */
function buildFilmography(actor: LoadedActor): FilmographyEntry[] {
  const byS = new Map<number, FilmographyEntry>();

  const add = (
    series: {
      id: number;
      title: string;
      year: number | null;
      type: string;
      imageUrl: string | null;
      imageThumbUrl: string | null;
      synopsis: string | null;
      country: { name: string } | null;
    },
    character: string | null,
    isMain: boolean
  ) => {
    const existing = byS.get(series.id);
    if (existing) {
      if (character && !existing.characters.includes(character)) {
        existing.characters.push(character);
      }
      if (isMain) existing.isMain = true;
      return;
    }
    byS.set(series.id, {
      seriesId: series.id,
      title: series.title,
      year: series.year,
      type: series.type,
      imageUrl: series.imageUrl,
      imageThumbUrl: series.imageThumbUrl,
      synopsis: series.synopsis,
      countryName: series.country?.name ?? null,
      characters: character ? [character] : [],
      isMain,
    });
  };

  actor.series.forEach((e) => add(e.series, e.character, e.isMain));
  actor.seasons.forEach((e) => add(e.season.series, e.character, e.isMain));

  return [...byS.values()].sort((a, b) => {
    if (a.year && b.year) return b.year - a.year;
    if (a.year) return -1;
    if (b.year) return 1;
    return a.title.localeCompare(b.title);
  });
}

export async function generateMetadata({
  params,
}: ActorPageProps): Promise<Metadata> {
  const { id } = await params;
  const actor = await loadActor(id);
  if (!actor) return {};

  const displayName = actor.stageName ?? actor.name;
  const creditCount = actor.series.length + actor.seasons.length;
  const description = actor.biography
    ? actor.biography.slice(0, 160).replace(/\n/g, ' ')
    : `Perfil de ${displayName}. ${creditCount} títulos en su filmografía. Descubrí su trayectoria en MundoBL.`;

  // Sin foto, sin bio y con un solo credito la ficha no aporta nada propio:
  // se deja navegable pero fuera del indice de Google (thin content).
  const indexable = isIndexablePerson({
    imageUrl: actor.imageUrl,
    biography: actor.biography,
    creditCount,
  });

  return {
    title: `${displayName} | Filmografía y Series - Actor BL`,
    description,
    alternates: { canonical: `/actores/${actor.id}` },
    robots: indexable ? undefined : { index: false, follow: true },
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
  const actor = await loadActor(id);
  if (!actor) notFound();

  const filmography = buildFilmography(actor);
  // Hay personas que actuan y dirigen: si figura en ambas tablas, cruzamos
  // las fichas en vez de dejarlas incomunicadas.
  const directorId = await findDirectorIdByName(actor.name);
  const displayName = actor.stageName ?? actor.name;

  return (
    <>
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
          url: `https://mundobl.com.ar/actores/${actor.id}`,
        }}
      />
      <Breadcrumbs
        items={[
          { name: 'Inicio', href: '/' },
          { name: 'Actores', href: '/actores' },
          { name: displayName },
        ]}
      />
      <ActorProfileClient
        actor={{
          id: actor.id,
          name: actor.name,
          stageName: actor.stageName,
          // Date no cruza el limite RSC como Date: se serializa a ISO y el
          // cliente lo formatea segun el locale activo.
          birthDate: actor.birthDate ? actor.birthDate.toISOString() : null,
          nationality: actor.nationality,
          imageUrl: actor.imageUrl,
          biography: actor.biography,
          funFacts: actor.funFacts,
          aliases: actor.aliases,
          imdbUrl: actor.imdbUrl,
          mdlUrl: actor.mdlUrl,
          wikiUrl: actor.wikiUrl,
        }}
        filmography={filmography}
        directorId={directorId}
      />
    </>
  );
}
