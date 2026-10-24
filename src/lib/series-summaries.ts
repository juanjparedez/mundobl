import { prisma } from '@/lib/database';
import { isAiringNow } from '@/lib/airing-schedule';
import { groupIntoChapters } from '@/lib/episode-chapters';
import { getContentUrl, getVerUrl } from '@/lib/slug';
import { MAX_SUMMARY_IDS } from '@/lib/local-library';
import { cardImageUrl } from '@/lib/image-helpers';

export { MAX_SUMMARY_IDS };

export interface SummaryChapter {
  seasonNumber: number;
  number: number;
  /** Primer episodio del capitulo, para abrir /ver en el (?e=1x5). */
  episodeNumber: number;
  episodeIds: number[];
}

/** Lo publico de una serie que hace falta para una lista de seguimiento. */
export interface SeriesSummary {
  id: number;
  title: string;
  imageUrl: string | null;
  href: string;
  /** /ver si se mira aca; null si solo esta en el catalogo. */
  watchHref: string | null;
  airing: boolean;
  chapters: SummaryChapter[];
}

/**
 * Para las listas sin cuenta (Mi seguimiento, Seguir viendo): el progreso
 * esta en el navegador y aca solo se pide lo publico. Solo series visibles;
 * de las +18 no se manda la portada.
 */
export async function getSeriesSummaries(
  ids: number[]
): Promise<SeriesSummary[]> {
  const rows = await prisma.series.findMany({
    where: { id: { in: ids.slice(0, MAX_SUMMARY_IDS) }, visibility: 'VISIBLE' },
    select: {
      id: true,
      title: true,
      imageUrl: true,
      imageThumbUrl: true,
      origin: true,
      catalogScope: true,
      contentRating: true,
      airDays: true,
      year: true,
      createdAt: true,
      seasons: {
        select: {
          seasonNumber: true,
          episodes: {
            select: {
              id: true,
              episodeNumber: true,
              title: true,
              embedUrl: true,
            },
            orderBy: { episodeNumber: 'asc' },
          },
        },
        orderBy: { seasonNumber: 'asc' },
      },
    },
  });
  return rows.map((row) => {
    const episodes = row.seasons.flatMap((season) =>
      season.episodes.map((episode) => ({
        id: episode.id,
        seasonNumber: season.seasonNumber,
        episodeNumber: episode.episodeNumber,
        title: episode.title,
        playable: !!episode.embedUrl,
      }))
    );
    return {
      id: row.id,
      title: row.title,
      imageUrl: row.contentRating === 'ADULT18' ? null : cardImageUrl(row),
      href: getContentUrl(row),
      watchHref: episodes.some((episode) => episode.playable)
        ? getVerUrl(row.id, row.title)
        : null,
      airing: isAiringNow(row),
      chapters: groupIntoChapters(episodes).chapters.map((chapter) => ({
        seasonNumber: chapter.seasonNumber,
        number: chapter.number,
        episodeNumber: chapter.episodes[0].episodeNumber,
        episodeIds: chapter.episodes.map((episode) => episode.id),
      })),
    };
  });
}
