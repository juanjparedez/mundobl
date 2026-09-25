'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useMessage } from '@/hooks/useMessage';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { interpolateMessage } from '@/lib/i18n-format';
import { readPendingTrack, clearPendingTrack } from '@/lib/pending-track';
import { useSeriesUserStatus } from '../SeriesUserStatusProvider';

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
        const response = pending.upToEpisodeId
          ? await fetch(`/api/series/${seriesId}/progress`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ upToEpisodeId: pending.upToEpisodeId }),
            })
          : await fetch(`/api/series/${seriesId}/view-status`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              // Ficha sin episodios: la intencion es "ya la vi" (VISTA), no
              // "la estoy viendo".
              body: JSON.stringify({
                status: pending.markWatched ? 'VISTA' : 'VIENDO',
              }),
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
