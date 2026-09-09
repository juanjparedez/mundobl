import type { Metadata } from 'next';
import { cache } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getSeriesById, prisma } from '@/lib/database';
import { stripPrivateNotes } from '@/lib/privacy';
import { SeriesHeader } from '@/components/series/SeriesHeader';
import { SeasonsList } from '@/components/series/SeasonsList';
import { SeriesInfo } from '@/components/series/SeriesInfo';
import { RatingSection } from '@/components/series/RatingSection';
import { CommentsSection } from '@/components/series/CommentsSection';
import { ReviewsSection } from '@/components/series/ReviewsSection/ReviewsSection';
import { ViewStatusToggle } from '@/components/series/ViewStatusToggle';
import { SeriesDetailClient } from '@/components/series/SeriesDetailClient';
import { SeriesCompletenessBadge } from './SeriesCompletenessBadge/SeriesCompletenessBadge';
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
import { SeriesSuggestionButton } from '@/components/series/SuggestionModal/SeriesSuggestionButton';
import { SeriesUserStatusProvider } from '@/components/series/SeriesUserStatusProvider';
import { EditSeriesFab } from './EditSeriesFab/EditSeriesFab';
import { getSeriesUrl, getVerUrl, parseIdFromSlug } from '@/lib/slug';
import type { TVSeries } from 'schema-dts';
import { ReadOutlined, CommentOutlined } from '@/lib/client-icons';
import './page.css';

const getSeriesByIdCached = cache(getSeriesById);

interface SeriesPageProps {
  params: Promise<{
    id: string;
  }>;
}

// ISR con revalidación a demanda y fallback a 5 minutos
// buildSeriesFullInclude trae temporadas, episodios, reparto y ratings de
// la serie. Multiplicado por 637 fichas, revalidar cada 5 min era una
// fuente constante de egress de base.
export const revalidate = 900;

export async function generateMetadata({
  params,
}: SeriesPageProps): Promise<Metadata> {
  const { id } = await params;
  const seriesId = parseIdFromSlug(id);
  if (isNaN(seriesId)) return {};

  const serie = await getSeriesByIdCached(seriesId);
  if (!serie) return {};

  const typeLabel =
    ContentTypeConfig[serie.type as ContentTypeValue]?.label ?? 'Serie';
  const year = serie.year ? ` (${serie.year})` : '';
  const country = serie.country?.name ?? '';
  const origTitle =
    serie.originalTitle && serie.originalTitle.trim() !== serie.title.trim()
      ? ` (${serie.originalTitle.trim()})`
      : '';

  // Keyword-first + Intent keywords (Dónde ver / Reparto / Reseña) + Título original
  const title = `${serie.title}${origTitle}${year} | Dónde ver, Reparto y Reseña - ${typeLabel} BL | MundoBL`;

  const synopsis = serie.synopsis
    ? `${serie.title}${origTitle}. ${serie.synopsis.slice(0, 150).replace(/\n/g, ' ')}...`
    : `${serie.title}${origTitle}. ${typeLabel} BL${country ? ` de ${country}` : ''}${year}. Descubre dónde verla, reparto completo y reseñas en MundoBL.`;

  const canonicalUrl = getSeriesUrl(serie.id, serie.title);

  const keywords = [
    serie.title,
    serie.originalTitle,
    `${serie.title} donde ver`,
    `${serie.title} reparto`,
    `${serie.title} sub espanol`,
    `${serie.title} resena`,
    'serie BL',
    'drama BL',
    'Boys Love',
    country ? `BL ${country}` : null,
    ...(serie.tags?.map((st) => st.tag.name) ?? []),
    ...(serie.genres?.map((sg) => sg.genre.name) ?? []),
  ].filter(Boolean) as string[];

  return {
    title,
    description: synopsis,
    keywords,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${serie.title}${origTitle}${year}`,
      description: synopsis,
      type: 'video.tv_show',
      url: canonicalUrl,
      ...(serie.imageUrl && {
        images: [{ url: serie.imageUrl, alt: serie.title }],
      }),
    },
    twitter: {
      card: 'summary_large_image',
      title: `${serie.title}${origTitle}${year}`,
      description: synopsis,
      ...(serie.imageUrl && { images: [serie.imageUrl] }),
    },
  };
}

export default async function SeriesPage({ params }: SeriesPageProps) {
  const resolvedParams = await params;
  const seriesId = parseIdFromSlug(resolvedParams.id);

  if (isNaN(seriesId)) {
    notFound();
  }

  // Sin `await auth()`: el viewStatus (serie/temporadas/episodios), la
  // suscripcion y el rol de usuario ahora se piden client-side
  // (SeriesUserStatusProvider via /api/series/[id]/my-status, el rol via
  // useSession() en cada componente que lo necesita) para que esta pagina
  // no dependa de cookies — con `auth()` ahi el `revalidate` de mas abajo
  // quedaba muerto, la ruta se volvia 100% dinamica para todos los
  // visitantes (era, junto con /catalogo, la de mas trafico del sitio).
  const serieRaw = await getSeriesByIdCached(seriesId);

  if (!serieRaw) {
    notFound();
  }

  // La compuerta de notas privadas va ACA, en el servidor, SIEMPRE con
  // isAdmin=false: este HTML es estatico/cacheado por ISR y lo puede servir
  // a cualquier visitante, admin o no, asi que nunca puede llevar horneadas
  // las notas privadas (`review`/`observations` con `notesPrivate=true`).
  // El admin las ve igual: SeriesInfo las pide aparte via
  // GET /api/series/[id]/private-notes cuando useSession() dice ADMIN.
  const serie = stripPrivateNotes(serieRaw, false);

  const config = getContentTypeConfig(serie.type);
  const showSeasons = shouldShowSeasons(serie.type);

  // Quick counts para los chips de estado del header. Publicos (agregados,
  // no por-usuario), asi que quedan bien en el HTML estatico/cacheado.
  const [reviewCount, contentCount, favoriteCount, currentlyWatchingCount] =
    await Promise.all([
      prisma.review.count({
        where: { seriesId: serie.id, status: 'PUBLISHED' },
      }),
      prisma.embeddableContent.count({ where: { seriesId: serie.id } }),
      prisma.userFavorite.count({ where: { seriesId: serie.id } }),
      prisma.viewStatus.count({
        where: { seriesId: serie.id, status: 'VIENDO' },
      }),
    ]);

  const universeSeries = serie.universeId
    ? await prisma.series.findMany({
        where: {
          universeId: serie.universeId,
          id: { not: serie.id },
          origin: 'CURATED',
        },
        select: {
          id: true,
          title: true,
          imageUrl: true,
          imageThumbUrl: true,
          imagePosition: true,
          year: true,
          type: true,
        },
        orderBy: [{ year: 'asc' }, { title: 'asc' }],
      })
    : [];

  const seasonLabel =
    'seasonLabel' in config ? config.seasonLabel : 'Temporadas';

  const actors = serie.actors?.map((sa) => sa.actor.name) ?? [];
  const directors = serie.directors?.map((sd) => sd.director.name) ?? [];
  const totalEpisodes = (serie.seasons ?? []).reduce(
    (acc, s) => acc + (s.episodes?.length ?? 0),
    0
  );

  return (
    <>
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
          url: `https://mundobl.com.ar${getSeriesUrl(serie.id, serie.title)}`,
        }}
      />
      <div className="series-detail-page">
        <SeriesUserStatusProvider seriesId={serie.id}>
          <BackToCatalogButton />
          <Breadcrumbs
            items={[
              { name: 'Inicio', href: '/' },
              { name: 'Catálogo', href: '/catalogo' },
              { name: serie.title },
            ]}
          />
          {/* Banner cuando la serie se puede ver en /ver directamente o tiene aportes linkeados */}
          {(serie.seasons ?? []).some((s) =>
            (s.episodes ?? []).some((e) => !!e.embedUrl)
          ) ? (
            <div className="series-linked-from-user-embeds">
              <Link
                href={getVerUrl(serie.id, serie.title)}
                className="series-linked-from-user-embeds__link"
              >
                ▶ Ver episodios oficiales en el reproductor de MundoBL
              </Link>
            </div>
          ) : serie.linkedFromUserEmbeds &&
            serie.linkedFromUserEmbeds.length > 0 ? (
            <div className="series-linked-from-user-embeds">
              <Link
                href={getVerUrl(
                  serie.linkedFromUserEmbeds[0].id,
                  serie.linkedFromUserEmbeds[0].title
                )}
                className="series-linked-from-user-embeds__link"
              >
                ▶ También disponible para ver en /ver
                {serie.linkedFromUserEmbeds.length > 1 &&
                  ` (${serie.linkedFromUserEmbeds.length} aportes)`}
              </Link>
            </div>
          ) : null}
          <SeriesHeader
            series={{
              ...serie,
              directors: serie.directors,
              actors: serie.actors,
            }}
            hasReview={reviewCount > 0}
            hasContent={contentCount > 0}
            favoriteCount={favoriteCount}
            currentlyWatchingCount={currentlyWatchingCount}
            actionsSlot={
              <>
                <ViewStatusToggle seriesId={serie.id} seasons={serie.seasons} />
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
                  <SeriesSubscribeButton seriesId={serie.id} />
                  <SeriesSuggestionButton
                    seriesId={serie.id}
                    seriesTitle={serie.title}
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

          <SeriesCompletenessBadge seriesId={serie.id} series={serie} />

          {serie.watchLinks && serie.watchLinks.length > 0 && (
            <WhereToWatch links={serie.watchLinks} variant="hero" />
          )}

          <SeriesDetailClient
            seriesId={serie.id}
            showSeasons={showSeasons}
            seasonLabel={seasonLabel}
            seasonCount={serie.seasons?.length || 0}
            infoSection={
              <SeriesInfo
                series={{
                  ...serie,
                  universeSeries,
                }}
              />
            }
            contentSection={<SeriesContent seriesId={serie.id} />}
            seasonsSection={<SeasonsList seasons={serie.seasons || []} />}
            ratingsSection={
              <RatingSection
                seriesId={serie.id}
                existingRatings={serie.ratings || []}
              />
            }
            reviewsSection={<ReviewsSection seriesId={serie.id} />}
            commentsSection={<CommentsSection seriesId={serie.id} />}
          />

          <EditSeriesFab seriesId={serie.id} />
        </SeriesUserStatusProvider>
      </div>
    </>
  );
}
