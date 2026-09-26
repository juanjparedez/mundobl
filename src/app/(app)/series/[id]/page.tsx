import { getPublicUniverseSeries } from '@/lib/database';
import type { Metadata } from 'next';
import { cache } from 'react';
import { notFound } from 'next/navigation';
import { getSeriesById, prisma } from '@/lib/database';
import { stripPrivateNotes } from '@/lib/privacy';
import { SeriesHeader } from '@/components/series/SeriesHeader';
import { SeasonsList } from '@/components/series/SeasonsList';
import { SeriesInfo } from '@/components/series/SeriesInfo';
import { RatingSection } from '@/components/series/RatingSection';
import { CommentsSection } from '@/components/series/CommentsSection';
import { ReviewsSection } from '@/components/series/ReviewsSection/ReviewsSection';
import { TrackingPanel } from '@/components/series/TrackingPanel/TrackingPanel';
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
import { FavoriteButton } from '@/components/series/FavoriteButton/FavoriteButton';
import { WhereToWatchEmpty } from '@/components/series/WhereToWatchEmpty/WhereToWatchEmpty';
import { SeriesNews } from '@/components/series/SeriesNews/SeriesNews';
import { SeriesSuggestionButton } from '@/components/series/SuggestionModal/SeriesSuggestionButton';
import { SeriesUserStatusProvider } from '@/components/series/SeriesUserStatusProvider';
import { PendingTrackApplier } from '@/components/series/PendingTrackApplier/PendingTrackApplier';
import { EditSeriesFab } from './EditSeriesFab/EditSeriesFab';
import { getSeriesUrl, getVerUrl, parseIdFromSlug } from '@/lib/slug';
import { isAiringNow } from '@/lib/airing-schedule';
import { countChapters } from '@/lib/episode-chapters';
import { isWatchableEpisode } from '@/lib/watchable';
import { WatchHereBanner } from '@/components/series/WatchHereBanner/WatchHereBanner';
import type { TVSeries } from 'schema-dts';
import { ReadOutlined, CommentOutlined } from '@/lib/client-icons';
import './page.css';

const getSeriesByIdCached = cache(getSeriesById);

interface SeriesPageProps {
  params: Promise<{
    id: string;
  }>;
}

// ISR con revalidacion a demanda (ver src/lib/revalidate-series.ts): cada
// edicion de la serie invalida ESTA ficha al instante, asi que el TTL es
// solo red de seguridad, no el mecanismo de frescura. Con 900s, las ~650
// fichas se regeneraban hasta 96 veces por dia cada una mientras Googlebot
// las crawleaba — y cada regeneracion es un ISR write + el CPU de
// buildSeriesFullInclude (temporadas, episodios, reparto, ratings) mas los
// counts de abajo. Era el grueso de las dos cuotas que se pasaron de largo.
// Lo unico que queda viejo hasta 24h son los chips de conteo (reseñas,
// favoritos, "viendo"); las reseñas y comentarios en si son client-side.
export const revalidate = 86400;

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
  const [
    reviewCount,
    contentCount,
    favoriteCount,
    currentlyWatchingCount,
    seriesNews,
  ] = await Promise.all([
    prisma.review.count({
      where: { seriesId: serie.id, status: 'PUBLISHED' },
    }),
    prisma.embeddableContent.count({ where: { seriesId: serie.id } }),
    prisma.userFavorite.count({ where: { seriesId: serie.id } }),
    prisma.viewStatus.count({
      where: { seriesId: serie.id, status: 'VIENDO' },
    }),
    // Publicar una noticia revalida esta ficha (ver news-publish.ts).
    prisma.news.findMany({
      where: { relatedSeriesId: serie.id, status: 'PUBLISHED' },
      orderBy: [{ publishedAt: { sort: 'desc', nulls: 'last' } }],
      take: 3,
      select: { id: true, title: true, sourceName: true, publishedAt: true },
    }),
  ]);

  const universeSeries = serie.universeId
    ? await getPublicUniverseSeries(serie.universeId)
    : [];

  const seasonLabel =
    'seasonLabel' in config ? config.seasonLabel : 'Temporadas';

  const actors = serie.actors?.map((sa) => sa.actor.name) ?? [];
  const directors = serie.directors?.map((sd) => sd.director.name) ?? [];
  // Capitulos, no videos: GMMTV sube cada capitulo en partes.
  const totalEpisodes = countChapters(serie.seasons ?? []);
  // Mismo criterio que /ver/[id]: un trailer suelto no es "se ve aca" (antes
  // la ficha lo prometia y /ver devolvia 404).
  const hasOwnEmbeds = (serie.seasons ?? []).some((s) =>
    (s.episodes ?? []).some(isWatchableEpisode)
  );
  // Se puede mirar en /ver (propia o por un aporte linkeado): "dónde ver"
  // vacío no puede decir que no sabemos.
  const canWatchHere =
    hasOwnEmbeds || (serie.linkedFromUserEmbeds?.length ?? 0) > 0;

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
          <PendingTrackApplier seriesId={serie.id} seriesTitle={serie.title} />
          <BackToCatalogButton />
          <Breadcrumbs
            items={[
              { name: 'Inicio', href: '/' },
              { name: 'Catálogo', href: '/catalogo' },
              { name: serie.title },
            ]}
          />
          {hasOwnEmbeds ? (
            <WatchHereBanner href={getVerUrl(serie.id, serie.title)} />
          ) : serie.linkedFromUserEmbeds &&
            serie.linkedFromUserEmbeds.length > 0 ? (
            <WatchHereBanner
              href={getVerUrl(
                serie.linkedFromUserEmbeds[0].id,
                serie.linkedFromUserEmbeds[0].title
              )}
              contributions={serie.linkedFromUserEmbeds.length}
            />
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
                <TrackingPanel
                  seriesId={serie.id}
                  seriesTitle={serie.title}
                  seasons={serie.seasons}
                  airing={isAiringNow(serie)}
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
                  <SeriesSubscribeButton seriesId={serie.id} />
                  <FavoriteButton />
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

          {serie.watchLinks && serie.watchLinks.length > 0 ? (
            <WhereToWatch links={serie.watchLinks} variant="hero" />
          ) : (
            !canWatchHere && (
              <WhereToWatch
                links={[]}
                variant="hero"
                empty={
                  <WhereToWatchEmpty
                    seriesId={serie.id}
                    seriesTitle={serie.title}
                  />
                }
              />
            )
          )}

          <SeriesNews
            items={seriesNews.map((item) => ({
              ...item,
              publishedAt: item.publishedAt?.toISOString() ?? null,
            }))}
          />

          <SeriesDetailClient
            seriesId={serie.id}
            showSeasons={showSeasons}
            seasonLabel={seasonLabel}
            seasonCount={serie.seasons?.length || 0}
            infoSection={
              <SeriesInfo
                showWatchLinks={false}
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
