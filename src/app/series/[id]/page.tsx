import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getSeriesById } from '@/lib/database';
import { AppLayout } from '@/components/layout/AppLayout/AppLayout';
import { SeriesHeader } from '@/components/series/SeriesHeader';
import { SeasonsList } from '@/components/series/SeasonsList';
import { SeriesInfo } from '@/components/series/SeriesInfo';
import { RatingSection } from '@/components/series/RatingSection';
import { CommentsSection } from '@/components/series/CommentsSection';
import { ViewStatusToggle } from '@/components/series/ViewStatusToggle';
import { SeriesDetailClient } from '@/components/series/SeriesDetailClient';
import { SeriesContent } from '@/components/series/SeriesContent/SeriesContent';
import {
  shouldShowSeasons,
  getContentTypeConfig,
  ContentTypeConfig,
  ContentTypeValue,
} from '@/types/content';
import { JsonLd } from '@/components/seo/JsonLd';
import type { TVSeries } from 'schema-dts';
import { FloatButton } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import './page.css';

interface SeriesPageProps {
  params: Promise<{
    id: string;
  }>;
}

// Disable static generation for now (causes slow dev performance)
export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: SeriesPageProps): Promise<Metadata> {
  const { id } = await params;
  const seriesId = parseInt(id, 10);
  if (isNaN(seriesId)) return {};

  const serie = await getSeriesById(seriesId);
  if (!serie) return {};

  const typeLabel =
    ContentTypeConfig[serie.type as ContentTypeValue]?.label ?? 'Serie';
  const year = serie.year ? ` (${serie.year})` : '';
  const country = serie.country?.name ?? '';
  const title = `${serie.title}${year} - ${typeLabel} BL`;

  const synopsis = serie.synopsis
    ? serie.synopsis.slice(0, 160).replace(/\n/g, ' ')
    : `${typeLabel} BL${country ? ` de ${country}` : ''}. Descubre la ficha completa, calificaciones y reparto en MundoBL.`;

  return {
    title,
    description: synopsis,
    alternates: {
      canonical: `/series/${serie.id}`,
    },
    openGraph: {
      title: `${serie.title}${year}`,
      description: synopsis,
      type: 'video.tv_show',
      url: `/series/${serie.id}`,
      ...(serie.imageUrl && {
        images: [{ url: serie.imageUrl, alt: serie.title }],
      }),
    },
    twitter: {
      card: 'summary_large_image',
      title: `${serie.title}${year}`,
      description: synopsis,
      ...(serie.imageUrl && { images: [serie.imageUrl] }),
    },
  };
}

export default async function SeriesPage({ params }: SeriesPageProps) {
  const resolvedParams = await params;
  const seriesId = parseInt(resolvedParams.id, 10);

  if (isNaN(seriesId)) {
    notFound();
  }

  const serie = await getSeriesById(seriesId);

  if (!serie) {
    notFound();
  }

  const config = getContentTypeConfig(serie.type);
  const showSeasons = shouldShowSeasons(serie.type);

  const seasonLabel =
    'seasonLabel' in config ? config.seasonLabel : 'Temporadas';

  const actors = serie.actors?.map((sa) => sa.actor.name) ?? [];
  const directors = serie.directors?.map((sd) => sd.director.name) ?? [];

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
            countryOfOrigin: {
              '@type': 'Country',
              name: serie.country.name,
            },
          }),
          ...(actors.length > 0 && {
            actor: actors.map((name) => ({
              '@type': 'Person' as const,
              name,
            })),
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
              ratingCount: 1,
            },
          }),
          url: `https://mundobl.win/series/${serie.id}`,
        }}
      />
      <div className="series-detail-page">
        <SeriesHeader series={serie} />

        <div className="series-actions">
          <ViewStatusToggle
            seriesId={serie.id}
            initialStatus={serie.viewStatus?.[0]?.status ?? 'SIN_VER'}
            seasons={serie.seasons}
          />
        </div>

        <SeriesDetailClient
          seriesId={serie.id}
          showSeasons={showSeasons}
          seasonLabel={seasonLabel}
          seasonCount={serie.seasons?.length || 0}
          infoSection={<SeriesInfo series={serie} />}
          contentSection={<SeriesContent seriesId={serie.id} />}
          seasonsSection={<SeasonsList seasons={serie.seasons || []} />}
          ratingsSection={
            <RatingSection
              seriesId={serie.id}
              existingRatings={serie.ratings || []}
            />
          }
          commentsSection={
            <CommentsSection
              seriesId={serie.id}
              comments={serie.comments || []}
            />
          }
        />

        {/* Botón flotante para editar */}
        <Link href={`/admin/series/${serie.id}/editar`}>
          <FloatButton
            icon={<EditOutlined />}
            type="primary"
            style={{ right: 24, bottom: 24, zIndex: 100 }}
            tooltip="Editar serie"
            aria-label="Editar serie"
          />
        </Link>
      </div>
    </AppLayout>
  );
}
