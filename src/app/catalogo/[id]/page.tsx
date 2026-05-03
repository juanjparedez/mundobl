import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout/AppLayout';
import { getSeriesById } from '@/lib/database';
import { SerieDetailClient } from './SerieDetailClient';
import { ContentTypeConfig, ContentTypeValue } from '@/types/content';
import { JsonLd } from '@/components/seo/JsonLd';
import type { TVSeries } from 'schema-dts';

interface SerieDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: SerieDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const serieId = parseInt(id, 10);
  if (isNaN(serieId)) return {};

  const serie = await getSeriesById(serieId);
  if (!serie) return {};

  const typeLabel =
    ContentTypeConfig[serie.type as ContentTypeValue]?.label ?? 'Serie';
  const year = serie.year ? ` (${serie.year})` : '';

  const synopsis = serie.synopsis
    ? serie.synopsis.slice(0, 160).replace(/\n/g, ' ')
    : `${typeLabel} BL. Descubre la ficha completa en MundoBL.`;

  return {
    title: `${serie.title}${year} - ${typeLabel} BL`,
    description: synopsis,
    alternates: {
      canonical: `/series/${serie.id}`,
    },
    openGraph: {
      title: `${serie.title}${year}`,
      description: synopsis,
      url: `/series/${serie.id}`,
      ...(serie.imageUrl && {
        images: [{ url: serie.imageUrl, alt: serie.title }],
      }),
    },
  };
}

export default async function SerieDetailPage({
  params,
}: SerieDetailPageProps) {
  const { id } = await params;
  const serieId = parseInt(id, 10);

  if (isNaN(serieId)) {
    notFound();
  }

  const serie = await getSeriesById(serieId);

  if (!serie) {
    notFound();
  }

  const actors = serie.actors?.map((sa) => sa.actor.name) ?? [];
  const directors = serie.directors?.map((sd) => sd.director.name) ?? [];
  const genres = serie.genres?.map((g) => g.genre.name) ?? [];

  return (
    <AppLayout>
      <JsonLd<TVSeries>
        data={{
          '@context': 'https://schema.org',
          '@type': 'TVSeries',
          name: serie.title,
          ...(serie.originalTitle && { alternateName: serie.originalTitle }),
          ...(serie.synopsis && { description: serie.synopsis }),
          ...(serie.imageUrl && { image: serie.imageUrl }),
          ...(serie.year && { datePublished: String(serie.year) }),
          ...(serie.country?.name && {
            countryOfOrigin: { '@type': 'Country', name: serie.country.name },
          }),
          ...(genres.length > 0 && { genre: genres }),
          ...(actors.length > 0 && {
            actor: actors.map((name) => ({ '@type': 'Person' as const, name })),
          }),
          ...(directors.length > 0 && {
            director: directors.map((name) => ({
              '@type': 'Person' as const,
              name,
            })),
          }),
          ...(serie.overallRating && {
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: serie.overallRating,
              bestRating: 10,
              worstRating: 1,
              ratingCount: Math.max(serie.ratings?.length ?? 1, 1),
            },
          }),
          url: `https://mundobl.win/series/${serie.id}`,
        }}
      />
      <SerieDetailClient serie={serie} />
    </AppLayout>
  );
}
