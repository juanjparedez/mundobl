'use client';

import { useEffect, useState } from 'react';
import {
  listLocalProgress,
  subscribeToLocalProgress,
} from '@/lib/local-progress';
import {
  buildLocalLibraryItem,
  MAX_SUMMARY_IDS,
  type LocalLibraryItem,
} from '@/lib/local-library';
import type { SeriesSummary } from '@/lib/series-summaries';

interface LocalLibraryState {
  items: LocalLibraryItem[];
  loading: boolean;
  failed: boolean;
}

/**
 * Lo seguido sin cuenta en este navegador, con titulo, portada y proximo
 * capitulo. El progreso nunca sale del navegador: solo se piden los datos
 * publicos de esas series (la respuesta la cachea la CDN).
 */
export function useLocalLibrary(enabled = true): LocalLibraryState {
  const [state, setState] = useState<LocalLibraryState>({
    items: [],
    loading: enabled,
    failed: false,
  });

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const summaries = new Map<number, SeriesSummary | null>();

    const build = () =>
      listLocalProgress().flatMap(({ seriesId, progress }) => {
        const summary = summaries.get(seriesId);
        return summary ? [buildLocalLibraryItem(summary, progress)] : [];
      });

    const load = async () => {
      const missing = listLocalProgress()
        .map(({ seriesId }) => seriesId)
        .filter((id) => !summaries.has(id))
        .sort((a, b) => a - b);
      try {
        if (missing.length > 0) {
          // Ordenados: la misma lista pega en la misma entrada de cache.
          const response = await fetch(
            `/api/series/summaries?ids=${missing.slice(0, MAX_SUMMARY_IDS).join(',')}`
          );
          if (!response.ok) throw new Error();
          // Una serie que ya no es visible queda en null: no se vuelve a pedir.
          for (const id of missing) summaries.set(id, null);
          for (const summary of (await response.json()) as SeriesSummary[])
            summaries.set(summary.id, summary);
        }
        if (!cancelled)
          setState({ items: build(), loading: false, failed: false });
      } catch {
        if (!cancelled)
          setState({ items: build(), loading: false, failed: true });
      }
    };

    void load();
    const unsubscribe = subscribeToLocalProgress(() => void load());
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [enabled]);

  return state;
}
