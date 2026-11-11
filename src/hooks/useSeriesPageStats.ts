'use client';

import { useEffect, useState } from 'react';
import type { PublicSeriesPageStats } from '@/lib/series-activity-stats';

const EMPTY: PublicSeriesPageStats = {
  chapters: null,
  views: null,
  reactions: {},
};

// Varios componentes de la misma pagina (pulso, visitas, reacciones) leen lo
// mismo: un solo pedido por serie mientras la pagina esta abierta.
const pending = new Map<number, Promise<PublicSeriesPageStats>>();

function parse(data: unknown): PublicSeriesPageStats {
  if (!data || typeof data !== 'object') return EMPTY;
  const { chapters, views, reactions } = data as Record<string, unknown>;
  const counts: PublicSeriesPageStats['reactions'] = {};
  if (reactions && typeof reactions === 'object') {
    for (const [key, value] of Object.entries(reactions)) {
      if (typeof value === 'number' && value > 0)
        (counts as Record<string, number>)[key] = value;
    }
  }
  return {
    chapters: typeof chapters === 'number' ? chapters : null,
    views: typeof views === 'number' ? views : null,
    reactions: counts,
  };
}

function loadStats(seriesId: number): Promise<PublicSeriesPageStats> {
  let request = pending.get(seriesId);
  if (!request) {
    request = fetch(`/api/series/${seriesId}/activity`)
      .then((response) => (response.ok ? response.json() : null))
      .then(parse)
      .catch(() => {
        pending.delete(seriesId);
        return EMPTY;
      });
    pending.set(seriesId, request);
  }
  return request;
}

/** Contadores publicos de la serie, o null mientras cargan. */
export function useSeriesPageStats(
  seriesId: number
): PublicSeriesPageStats | null {
  const [stats, setStats] = useState<{
    seriesId: number;
    value: PublicSeriesPageStats;
  } | null>(null);

  useEffect(() => {
    let alive = true;
    void loadStats(seriesId).then((value) => {
      if (alive) setStats({ seriesId, value });
    });
    return () => {
      alive = false;
    };
  }, [seriesId]);

  return stats?.seriesId === seriesId ? stats.value : null;
}
