import { ContentGate } from '@/components/content/ContentGate/ContentGate';
import { ContentNotice } from '@/components/content/ContentNotice/ContentNotice';
import { hasContentConsent } from '@/lib/content-consent';
import { getPublicWriterCredits } from '@/lib/database';
import { WriterCredits } from '@/components/series/WriterCredits/WriterCredits';
import { notFound, redirect } from 'next/navigation';
import { BackToCatalogButton } from '@/components/series/BackToCatalogButton/BackToCatalogButton';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs/Breadcrumbs';
import { JsonLd } from '@/components/seo/JsonLd';
import { isWatchableEpisode } from '@/lib/watchable';
import type { TVSeries } from 'schema-dts';
import { getWatchableSeriesByIdCached } from '@/lib/detail-loaders';
import { getAdultVariantUrl, getVerUrl } from '@/lib/slug';
import { isAiringNow, parseAirDays } from '@/lib/airing-schedule';
import { SeriesUserStatusProvider } from '@/components/series/SeriesUserStatusProvider';
import { PendingTrackApplier } from '@/components/series/PendingTrackApplier/PendingTrackApplier';
import { VerSerieClient } from '../VerSerieClient';
import './VerSerieView.css';

interface VerSerieViewProps {
  seriesId: number;
  /** true en /ver/[id]/adultos, la unica variante que lee la cookie. */
  adultRoute?: boolean;
}

export async function VerSerieView({
  seriesId,
  adultRoute = false,
}: VerSerieViewProps) {
  if (isNaN(seriesId)) notFound();

  const serie = await getWatchableSeriesByIdCached(seriesId);
  if (!serie) notFound();

  // Igual que /series/[id]: la pagina comun es ISR y no lee cookies; los +18
  // se resuelven en la variante dinamica /adultos.
  const url = getVerUrl(serie.id, serie.title);
  if (serie.contentRating === 'ADULT18') {
    if (!adultRoute) redirect(getAdultVariantUrl(url));
    if (!(await hasContentConsent()))
      return <ContentGate warnings={serie.contentWarnings} />;
  } else if (adultRoute) {
    redirect(url);
  }

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
      <ContentNotice
        rating={serie.contentRating}
        warnings={serie.contentWarnings}
      />
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
          <BackToCatalogButton fallback="/ver" />
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
              airWeekdays: isAiringNow(serie)
                ? parseAirDays(serie.airDays)
                : [],
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
              ratings: serie.ratings,
            }}
            seasons={seasons}
          />
          <WriterCredits credits={await getPublicWriterCredits(serie.id)} />
        </SeriesUserStatusProvider>
      </div>
    </>
  );
}
