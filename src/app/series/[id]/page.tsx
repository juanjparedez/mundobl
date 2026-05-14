import type { Metadata } from 'next';
import { cache } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getSeriesById, prisma } from '@/lib/database';
import { AppLayout } from '@/components/layout/AppLayout/AppLayout';
import { SeriesHeader } from '@/components/series/SeriesHeader';
import { SeasonsList } from '@/components/series/SeasonsList';
import { SeriesInfo } from '@/components/series/SeriesInfo';
import { RatingSection } from '@/components/series/RatingSection';
import { CommentsSection } from '@/components/series/CommentsSection';
import { ReviewsSection } from '@/components/series/ReviewsSection/ReviewsSection';
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
import { Breadcrumbs } from '@/components/seo/Breadcrumbs/Breadcrumbs';
import { BackToCatalogButton } from '@/components/series/BackToCatalogButton/BackToCatalogButton';
import { ShareButton } from '@/components/common/ShareButton/ShareButton';
import { WhereToWatch } from '@/components/common/WhereToWatch/WhereToWatch';
import { SeriesSubscribeButton } from '@/components/series/SeriesSubscribeButton/SeriesSubscribeButton';
import { auth } from '@/lib/auth';
import type { TVSeries } from 'schema-dts';
import { FloatButton } from 'antd';
import { EditOutlined, ReadOutlined, CommentOutlined } from '@ant-design/icons';
import './page.css';

const getSeriesByIdCached = cache(getSeriesById);

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

  const serie = await getSeriesByIdCached(seriesId);
  if (!serie) return {};

  const typeLabel =
    ContentTypeConfig[serie.type as ContentTypeValue]?.label ?? 'Serie';
  const year = serie.year ? ` (${serie.year})` : '';
  const country = serie.country?.name ?? '';
  // Keyword-first: nombre + año + intent keywords (reseña/reparto) ANTES
  // del qualifier "Serie BL". Mejora CTR en busquedas como "bad buddy resena".
  const title = `${serie.title}${year} | Reseña, Reparto y Episodios - ${typeLabel} BL`;

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

  const serie = await getSeriesByIdCached(seriesId);

  if (!serie) {
    notFound();
  }

  const config = getContentTypeConfig(serie.type);
  const showSeasons = shouldShowSeasons(serie.type);

  const session = await auth();
  const userId = session?.user?.id ?? null;

  // Quick counts para los chips de estado del header. Hechos en paralelo
  // para no penalizar TTFB.
  const [reviewCount, contentCount, subscription] = await Promise.all([
    prisma.review.count({
      where: { seriesId: serie.id, status: 'PUBLISHED' },
    }),
    prisma.embeddableContent.count({ where: { seriesId: serie.id } }),
    userId
      ? prisma.seriesSubscription.findUnique({
          where: { userId_seriesId: { userId, seriesId: serie.id } },
          select: { id: true },
        })
      : Promise.resolve(null),
  ]);
  const isSubscribed = subscription !== null;

  const seasonLabel =
    'seasonLabel' in config ? config.seasonLabel : 'Temporadas';

  const actors = serie.actors?.map((sa) => sa.actor.name) ?? [];
  const directors = serie.directors?.map((sd) => sd.director.name) ?? [];
  const totalEpisodes = (serie.seasons ?? []).reduce(
    (acc, s) => acc + (s.episodes?.length ?? 0),
    0
  );

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
          ...(serie.originalLanguage?.name && {
            inLanguage: serie.originalLanguage.name,
          }),
          ...(serie.productionCompany?.name && {
            productionCompany: {
              '@type': 'Organization',
              name: serie.productionCompany.name,
            },
          }),
          ...(serie.seasons &&
            serie.seasons.length > 0 && {
              numberOfSeasons: serie.seasons.length,
            }),
          ...(totalEpisodes > 0 && { numberOfEpisodes: totalEpisodes }),
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
          ...(serie.genres &&
            serie.genres.length > 0 && {
              genre: serie.genres.map((g) => g.genre.name),
            }),
          ...(serie.tags &&
            serie.tags.length > 0 && {
              keywords: serie.tags.map((t) => t.tag.name).join(', '),
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
          url: `https://mundobl.com.ar/series/${serie.id}`,
        }}
      />
      <div className="series-detail-page">
        <BackToCatalogButton />
        <Breadcrumbs
          items={[
            { name: 'Inicio', href: '/' },
            { name: 'Catálogo', href: '/catalogo' },
            { name: serie.title },
          ]}
        />
        {/* Banner cuando hay aportes USER_EMBED linkeados a esta CURATED.
         * El user puede saltar a /ver/[id] para mirar la serie. */}
        {serie.linkedFromUserEmbeds &&
          serie.linkedFromUserEmbeds.length > 0 && (
            <div className="series-linked-from-user-embeds">
              <Link
                href={`/ver/${serie.linkedFromUserEmbeds[0].id}`}
                className="series-linked-from-user-embeds__link"
              >
                ▶ También disponible para ver en /ver
                {serie.linkedFromUserEmbeds.length > 1 &&
                  ` (${serie.linkedFromUserEmbeds.length} aportes)`}
              </Link>
            </div>
          )}
        <SeriesHeader
          series={{
            ...serie,
            directors: serie.directors,
            actors: serie.actors,
          }}
          hasReview={reviewCount > 0}
          hasContent={contentCount > 0}
          actionsSlot={
            <>
              <ViewStatusToggle
                seriesId={serie.id}
                initialStatus={serie.viewStatus?.[0]?.status ?? 'SIN_VER'}
                seasons={serie.seasons}
              />
              <div
                className="series-quick-actions"
                aria-label="Acciones rápidas"
              >
                <ShareButton
                  title={serie.title}
                  text={serie.synopsis ?? undefined}
                  path={`/series/${serie.id}`}
                  variant="compact"
                />
                <SeriesSubscribeButton
                  seriesId={serie.id}
                  initialSubscribed={isSubscribed}
                />
                <a
                  href="#series-section-reviews"
                  className="series-quick-actions__item"
                  title="Reseñas"
                  aria-label="Ir a reseñas"
                >
                  <ReadOutlined />
                </a>
                <a
                  href="#series-section-comments"
                  className="series-quick-actions__item"
                  title="Comentarios"
                  aria-label="Ir a comentarios"
                >
                  <CommentOutlined />
                </a>
              </div>
            </>
          }
        />

        {serie.watchLinks && serie.watchLinks.length > 0 && (
          <WhereToWatch links={serie.watchLinks} variant="hero" />
        )}

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
          reviewsSection={
            <ReviewsSection
              seriesId={serie.id}
              seriesWatched={
                serie.viewStatus?.[0]?.status === 'VISTA' ||
                serie.viewStatus?.[0]?.status === 'ABANDONADA'
              }
            />
          }
          commentsSection={
            <CommentsSection
              seriesId={serie.id}
              comments={serie.comments || []}
            />
          }
        />

        {/* Botón flotante para editar — solo admin/moderator. En user
         * regular apuntaba a /admin/series/X/editar y devolvia 403, asi
         * que ademas de tapar contenido (reportado por Flor en feedback
         * #98) era un dead-end. La posicion `bottom` la maneja CSS para
         * subirlo arriba del BottomNav en mobile y evitar la
         * superposicion sobre el ultimo comentario. */}
        {(session?.user?.role === 'ADMIN' ||
          session?.user?.role === 'MODERATOR') && (
          <Link href={`/admin/series/${serie.id}/editar`} prefetch={false}>
            <FloatButton
              icon={<EditOutlined />}
              type="primary"
              className="series-edit-fab"
              tooltip="Editar serie"
              aria-label="Editar serie"
            />
          </Link>
        )}
      </div>
    </AppLayout>
  );
}
