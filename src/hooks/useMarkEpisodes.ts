'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useSeriesUserStatus } from '@/components/series/SeriesUserStatusProvider';
import { useMessage } from '@/hooks/useMessage';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { setLocalEpisodesWatched } from '@/lib/local-progress';

/**
 * Marca o desmarca episodios de la serie del provider en un solo request y
 * refresca a todos los que lo leen (panel, listas). Sin sesion guarda la
 * intencion y manda al login: PendingTrackApplier la aplica al volver.
 *
 * `pendingKey` dice que boton esta esperando respuesta.
 */
export function useMarkEpisodes() {
  const { seriesId, refetch, storage } = useSeriesUserStatus();
  const { status } = useSession();
  const message = useMessage();
  const { t } = useLocale();
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  const setWatched = async (
    key: string,
    episodeIds: number[],
    watched: boolean
  ): Promise<boolean> => {
    if (seriesId === null || episodeIds.length === 0) return false;

    if (storage === 'local') {
      setLocalEpisodesWatched(seriesId, episodeIds, watched);
      await refetch();
      return true;
    }

    setPendingKey(key);
    try {
      const response = await fetch(`/api/series/${seriesId}/watched`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ episodeIds, watched }),
      });
      if (!response.ok) throw new Error();
      await refetch();
      return true;
    } catch {
      message.error(t('progressStepper.error'));
      return false;
    } finally {
      setPendingKey(null);
    }
  };

  return {
    setWatched,
    pendingKey,
    /** Mientras la sesion carga no se sabe si mandar al login o marcar. */
    ready: status !== 'loading',
  };
}
