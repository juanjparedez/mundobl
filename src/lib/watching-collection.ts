import { groupIntoChapters, chapterCode } from './episode-chapters';
import { findNextEpisode } from './episode-progress';
import { getSeriesUrl, getVerUrl } from './slug';

export interface WatchingItem {
  id: number;
  status: string;
  lastWatchedAt: string | null;
  series: {
    id: number;
    title: string;
    originalTitle?: string | null;
    origin: string;
    catalogScope: string;
    year?: number | null;
    imageUrl?: string | null;
    imageThumbUrl?: string | null;
    airDays?: string | null;
    hasWatchableEpisode: boolean;
    country?: { name: string } | null;
    seasons: Array<{
      id: number;
      seasonNumber: number;
      episodes: Array<{
        id: number;
        episodeNumber: number;
        title?: string | null;
        viewStatus?: Array<{ status: string }>;
      }>;
    }>;
  };
}

export type WatchingFilter = 'all' | 'VIENDO' | 'RETOMAR';
export type WatchingSort = 'recent' | 'name' | 'remaining';
export interface WatchingPreferences {
  view: 'list' | 'grid';
  sort: WatchingSort;
  pinned: number[];
}
export const DEFAULT_WATCHING_PREFERENCES: WatchingPreferences = {
  view: 'list',
  sort: 'recent',
  pinned: [],
};

export function readWatchingPreferences(value: unknown): WatchingPreferences {
  const raw = value && typeof value === 'object' ? value : {};
  return {
    view: 'view' in raw && raw.view === 'grid' ? 'grid' : 'list',
    sort:
      'sort' in raw && (raw.sort === 'name' || raw.sort === 'remaining')
        ? raw.sort
        : 'recent',
    pinned:
      'pinned' in raw && Array.isArray(raw.pinned)
        ? [
            ...new Set(
              raw.pinned.filter(
                (id: unknown): id is number =>
                  typeof id === 'number' && Number.isSafeInteger(id) && id > 0
              )
            ),
          ].slice(0, 100)
        : [],
  };
}

export function watchingProgress(item: WatchingItem) {
  const { chapters } = groupIntoChapters(
    item.series.seasons.flatMap((season) =>
      season.episodes.map((episode) => ({
        ...episode,
        seasonNumber: season.seasonNumber,
        watched: episode.viewStatus?.[0]?.status === 'VISTA',
      }))
    )
  );
  const watched = (chapter: (typeof chapters)[number]) =>
    chapter.episodes.every((episode) => episode.watched);
  const next = findNextEpisode(chapters, watched);
  return {
    total: chapters.length,
    watched: chapters.filter(watched).length,
    next: next
      ? {
          label: chapterCode(next),
          episodeIds: next.episodes
            .filter((episode) => !episode.watched)
            .map((episode) => episode.id),
          seasonNumber: next.seasonNumber,
          episodeNumber: next.episodes[0].episodeNumber,
        }
      : null,
  };
}

/** A viewing-only contribution must not link to a catalog detail that returns 404. */
export function watchingDetailsUrl(item: WatchingItem): string {
  return item.series.origin === 'USER_EMBED'
    ? getVerUrl(item.series.id, item.series.title)
    : getSeriesUrl(item.series.id, item.series.title);
}

export function selectWatchingItems(
  items: WatchingItem[],
  search: string,
  filter: WatchingFilter,
  preferences: WatchingPreferences
): WatchingItem[] {
  const query = search.trim().toLocaleLowerCase();
  return items
    .filter(
      (item) =>
        (filter === 'all' || item.status === filter) &&
        `${item.series.title} ${item.series.originalTitle ?? ''}`
          .toLocaleLowerCase()
          .includes(query)
    )
    .sort((a, b) => {
      const pin =
        Number(preferences.pinned.includes(b.series.id)) -
        Number(preferences.pinned.includes(a.series.id));
      if (pin) return pin;
      if (preferences.sort === 'name')
        return a.series.title.localeCompare(b.series.title);
      if (preferences.sort === 'remaining') {
        const pa = watchingProgress(a);
        const pb = watchingProgress(b);
        // Unknown chapter totals should not look like zero remaining.
        return (
          (pa.total ? pa.total - pa.watched : Infinity) -
            (pb.total ? pb.total - pb.watched : Infinity) ||
          a.series.id - b.series.id
        );
      }
      return (
        (Date.parse(b.lastWatchedAt ?? '') || 0) -
          (Date.parse(a.lastWatchedAt ?? '') || 0) || a.series.id - b.series.id
      );
    });
}
