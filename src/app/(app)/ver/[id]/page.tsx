import { cache } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from 'antd';
import { LeftOutlined } from '@/lib/client-icons';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs/Breadcrumbs';
import { JsonLd } from '@/components/seo/JsonLd';
import { isWatchableEpisode } from '@/lib/watchable';
import type { TVSeries } from 'schema-dts';
import { getWatchableSeriesById } from '@/lib/database';
import { getVerUrl, parseIdFromSlug } from '@/lib/slug';
import { isAiringNow } from '@/lib/airing-schedule';
import { SeriesUserStatusProvider } from '@/components/series/SeriesUserStatusProvider';
import { PendingTrackApplier } from '@/components/series/PendingTrackApplier/PendingTrackApplier';
import { VerSerieClient } from './VerSerieClient';
import './ver-serie.css';

// generateMetadata y el componente piden la misma serie. Sin memoizar eran
// DOS consultas completas (temporadas + episodios + embeds) por render, y el
// render se repite en cada regeneracion ISR. `cache` las colapsa en una,
// igual que ya hace /series/[id] con getSeriesByIdCached.
const getWatchableSeriesByIdCached = cache(getWatchableSeriesById);

interface PageProps {
  params: Promise<{ id: string }>;
}

// Igual que /series/[id]: el contenido (embeds de los episodios) solo cambia
// cuando lo edita un admin/colaborador, y esas rutas ya invalidan esta ficha
// por URL. A 120s, las ~650 paginas se regeneraban cada 2 minutos mientras
// hubiera crawl — por lejos el mayor generador de ISR writes del proyecto.
export const revalidate = 86400;

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const seriesId = parseIdFromSlug(id);
  if (isNaN(seriesId)) return {};
  const serie = await getWatchableSeriesByIdCached(seriesId);
  if (!serie) return {};

  const origTitle =
    serie.originalTitle && serie.originalTitle.trim() !== serie.title.trim()
      ? ` (${serie.originalTitle.trim()})`
      : '';
  const yearPart = serie.year ? ` (${serie.year})` : '';

  const title = `Ver ${serie.title}${origTitle}${yearPart} Online Sub Español | MundoBL`;
  const description =
    serie.synopsis?.slice(0, 160) ??
    `Mirá todos los episodios de ${serie.title}${origTitle} en línea, con subtítulos en español y reproducción oficial en MundoBL.`;

  const canonicalUrl = getVerUrl(serie.id, serie.title);

  const keywords = [
    serie.title,
    serie.originalTitle,
    `ver ${serie.title}`,
    `${serie.title} sub espanol`,
    `${serie.title} capitulos completos`,
    `${serie.title} online`,
    'ver serie BL online',
    'serie BL sub espanol',
    'doramas BL',
    serie.country?.name ? `BL ${serie.country.name}` : null,
  ].filter(Boolean) as string[];

  return {
    title,
    description,
    keywords,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      ...(serie.imageUrl && { images: [{ url: serie.imageUrl }] }),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(serie.imageUrl && { images: [serie.imageUrl] }),
    },
  };
}

export default async function VerSeriePage({ params }: PageProps) {
  const { id } = await params;
  const seriesId = parseIdFromSlug(id);
  if (isNaN(seriesId)) notFound();

  const serie = await getWatchableSeriesByIdCached(seriesId);
  if (!serie) notFound();

  const seasons = serie.seasons
    .map((s) => ({
      id: s.id,
      seasonNumber: s.seasonNumber,
      title: s.title,
      episodes: s.episodes.filter(isWatchableEpisode).map((e) => ({
        id: e.id,
        episodeNumber: e.episodeNumber,
        title: e.title,
        synopsis: e.synopsis,
        duration: e.duration,
        embedUrl: e.embedUrl,
        embedPlatform: e.embedPlatform,
        embedVideoId: e.embedVideoId,
        embedChannelName: e.embedChannelName,
        embedChannelUrl: e.embedChannelUrl,
        playback: e.playback,
        playbackBlockedMarkets: e.playbackBlockedMarkets,
      })),
    }))
    .filter((s) => s.episodes.length > 0);

  if (seasons.length === 0) {
    notFound();
  }

  const totalEpisodes = seasons.reduce((acc, s) => acc + s.episodes.length, 0);

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
          ...(serie.genres &&
            serie.genres.length > 0 && {
              genre: serie.genres.map((sg) => sg.genre.name),
            }),
          numberOfSeasons: seasons.length,
          numberOfEpisodes: totalEpisodes,
          potentialAction: {
            '@type': 'WatchAction',
            target: `https://mundobl.com.ar${getVerUrl(serie.id, serie.title)}`,
          },
          url: `https://mundobl.com.ar${getVerUrl(serie.id, serie.title)}`,
        }}
      />
      <div className="ver-serie-page">
        <Breadcrumbs
          items={[
            { name: 'Inicio', href: '/' },
            { name: 'Ver', href: '/ver' },
            { name: serie.title },
          ]}
        />
        <div className="ver-serie-back">
          <Link href="/ver">
            <Button icon={<LeftOutlined />} type="link">
              Volver al catálogo de series mirables
            </Button>
          </Link>
        </div>
        <SeriesUserStatusProvider seriesId={serie.id}>
          <PendingTrackApplier seriesId={serie.id} seriesTitle={serie.title} />
          <VerSerieClient
            series={{
              id: serie.id,
              title: serie.title,
              originalTitle: serie.originalTitle,
              year: serie.year,
              airing: isAiringNow(serie),
              synopsis: serie.synopsis,
              imageUrl: serie.imageUrl,
              catalogScope: serie.catalogScope,
              origin: serie.origin,
              geoRestrictedCore: serie.geoRestrictedCore,
              productionCompanyName: serie.productionCompany?.name ?? null,
              submittedByName:
                serie.submittedBy?.nickname ?? serie.submittedBy?.name ?? null,
              submittedByIsCollaborator:
                serie.submittedBy?.role === 'COLLABORATOR',
              country: serie.country
                ? { name: serie.country.name, code: serie.country.code }
                : null,
              tags: serie.tags.map((st) => st.tag.name),
              genres: serie.genres.map((sg) => sg.genre.name),
              directors: serie.directors.map((sd) => sd.director.name),
              actors: serie.actors.map((sa) => ({
                id: sa.actor.id,
                name: sa.actor.name,
                stageName: sa.actor.stageName,
                imageUrl: sa.actor.imageUrl,
              })),
              linkedSeries: serie.linkedSeries
                ? {
                    id: serie.linkedSeries.id,
                    title: serie.linkedSeries.title,
                    imageUrl: serie.linkedSeries.imageUrl,
                  }
                : null,
            }}
            seasons={seasons}
          />
        </SeriesUserStatusProvider>
      </div>
    </>
  );
}
