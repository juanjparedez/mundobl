'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useMessage } from '@/hooks/useMessage';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { interpolateMessage } from '@/lib/i18n-format';
import {
  readPendingTrack,
  clearPendingTrack,
  type PendingTrack,
} from '@/lib/pending-track';
import { useSeriesUserStatus } from '../SeriesUserStatusProvider';

function pendingRequest(
  seriesId: number,
  pending: PendingTrack
): { url: string; body: Record<string, unknown> } {
  if (pending.episodeIds?.length) {
    return {
      url: `/api/series/${seriesId}/watched`,
      body: { episodeIds: pending.episodeIds, watched: true },
    };
  }
  if (pending.upToEpisodeId) {
    return {
      url: `/api/series/${seriesId}/progress`,
      body: { upToEpisodeId: pending.upToEpisodeId },
    };
  }
  // Ficha sin episodios: la intencion es "ya la vi" (VISTA), no "la estoy
  // viendo".
  return {
    url: `/api/series/${seriesId}/view-status`,
    body: { status: pending.markWatched ? 'VISTA' : 'VIENDO' },
  };
}

interface PendingTrackApplierProps {
  seriesId: number;
  seriesTitle: string;
}

/**
 * Sin UI propia. Al volver logueado de un CTA anónimo (T07), aplica la
 * intención guardada en sessionStorage para ESTA ficha y la borra.
 */
export function PendingTrackApplier({
  seriesId,
  seriesTitle,
}: PendingTrackApplierProps) {
  const { status: sessionStatus } = useSession();
  const { refetch } = useSeriesUserStatus();
  const message = useMessage();
  const { t } = useLocale();
  const appliedRef = useRef(false);

  useEffect(() => {
    if (sessionStatus !== 'authenticated' || appliedRef.current) return;

    const pending = readPendingTrack();
    if (!pending || pending.seriesId !== seriesId) return;

    appliedRef.current = true;

    const apply = async () => {
      try {
        const { url, body } = pendingRequest(seriesId, pending);
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (!response.ok) throw new Error();

        clearPendingTrack();
        await refetch();
        message.success(
          interpolateMessage(t('trackCta.applied'), { title: seriesTitle })
        );
      } catch {
        // Si falla, el usuario sigue pudiendo marcar a mano; no reintenta
        // solo ni borra la intención (se descarta sola a los 30 min).
      }
    };

    void apply();
  }, [sessionStatus, seriesId, seriesTitle, refetch, message, t]);

  return null;
}
