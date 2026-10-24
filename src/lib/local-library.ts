import { findFurthestWatchedIndex } from '@/lib/episode-progress';
import type { LocalSeriesProgress } from '@/lib/local-progress';
import { localSeriesStatus } from '@/lib/local-progress';
import type { SeriesSummary, SummaryChapter } from '@/lib/series-summaries';
import { getVerUrl } from '@/lib/slug';

/** Tope de series por pedido a /api/series/summaries. */
export const MAX_SUMMARY_IDS = 60;

/** Una serie seguida en este navegador, lista para mostrar. */
export interface LocalLibraryItem {
  summary: SeriesSummary;
  status: string;
  /** Capitulos completos (todas sus partes vistas). */
  watched: number;
  total: number;
  next: SummaryChapter | null;
  /** /ver en el proximo capitulo si se mira aca; si no, la ficha. */
  nextHref: string;
  updatedAt: number;
}

/**
 * Cruza el progreso del navegador con lo publico de la serie. Puro: lo usan
 * la lista sin cuenta y "Seguir viendo", y se prueba sin navegador.
 */
export function buildLocalLibraryItem(
  summary: SeriesSummary,
  progress: LocalSeriesProgress
): LocalLibraryItem {
  const seen = new Set(progress.episodeIds);
  const isWatched = (chapter: SummaryChapter) =>
    chapter.episodeIds.every((id) => seen.has(id));
  const furthest = findFurthestWatchedIndex(summary.chapters, isWatched);
  const next = summary.chapters[furthest + 1] ?? null;
  return {
    summary,
    status: localSeriesStatus(progress),
    watched: summary.chapters.filter(isWatched).length,
    total: summary.chapters.length,
    next,
    nextHref:
      summary.watchHref && next
        ? getVerUrl(summary.id, summary.title, {
            seasonNumber: next.seasonNumber,
            episodeNumber: next.episodeNumber,
          })
        : (summary.watchHref ?? summary.href),
    updatedAt: progress.updatedAt,
  };
}
