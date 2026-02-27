import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout/AppLayout';
import { getSeriesById } from '@/lib/database';
import { SerieDetailClient } from './SerieDetailClient';
import { ContentTypeConfig, ContentTypeValue } from '@/types/content';

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

  return (
    <AppLayout>
      <SerieDetailClient serie={serie} />
    </AppLayout>
  );
}
