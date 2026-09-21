'use client';

import { useEffect, useState } from 'react';
import { Select, Badge, Button } from 'antd';
import { EyeOutlined, CheckOutlined, UndoOutlined } from '@ant-design/icons';
import { useSession, signIn } from 'next-auth/react';
import { WATCH_STATUS, WATCH_STATUS_COLORS } from '@/constants/series';
import type { WatchStatusValue } from '@/constants/series';
import { useSeriesUserStatus } from '../SeriesUserStatusProvider';
import {
  WatchProgressStepper,
  type WatchProgressStepperEpisode,
} from '../WatchProgressStepper/WatchProgressStepper';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { interpolateMessage } from '@/lib/i18n-format';
import { useMessage } from '@/hooks/useMessage';
import { trackFunnel } from '@/lib/analytics';
import { savePendingTrack } from '@/lib/pending-track';
import './TrackingPanel.css';

type AntStatusColor =
  | 'default'
  | 'processing'
  | 'success'
  | 'error'
  | 'warning';

interface TrackingPanelProps {
  seriesId: number;
  /** Para el Popconfirm "¿Terminaste {title}?" y el mensaje post-login. */
  seriesTitle: string;
  seasons?: Array<{
    seasonNumber: number;
    episodes?: Array<{
      id: number;
      episodeNumber: number;
      title?: string | null;
    }>;
  }>;
}

/**
 * Bloque de tracking de la ficha: estado de la serie + progreso por
 * episodio. Es el mismo componente, en el mismo lugar y con el mismo
 * ancho, tenga o no episodios cargados la ficha y haya o no sesion.
 *
 * Con episodios: Select de estado + stepper "Ep. 2 / 8" + "Siguiente".
 * Sin episodios (cortos, peliculas, fichas incompletas): Select + boton
 * "Ya la vi", porque ahi la unidad de tracking es la serie entera.
 * Sin sesion: CTA que guarda la intencion y manda al login (T07).
 *
 * Todo lo que depende del usuario se hidrata en cliente via
 * SeriesUserStatusProvider: la ficha es ISR y no llama auth().
 */
export function TrackingPanel({
  seriesId,
  seriesTitle,
  seasons = [],
}: TrackingPanelProps) {
  const message = useMessage();
  const { t } = useLocale();
  const { data: session } = useSession();
  const { seriesStatus, loaded, version, refetch } = useSeriesUserStatus();
  const [status, setStatus] = useState<WatchStatusValue>('SIN_VER');
  const [isUpdating, setIsUpdating] = useState(false);
  const [pendingEpisodeId, setPendingEpisodeId] = useState<number | null>(null);

  useEffect(() => {
    if (loaded) setStatus(seriesStatus as WatchStatusValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-sembrar en cada version (refetch), no solo cuando cambia seriesStatus/loaded en si
  }, [version]);

  const watchStatusLabels: Record<string, string> = {
    SIN_VER: t('viewStatusToggle.sinVer'),
    VIENDO: t('viewStatusToggle.viendo'),
    VISTA: t('viewStatusToggle.vista'),
    ABANDONADA: t('viewStatusToggle.abandonada'),
    RETOMAR: t('viewStatusToggle.retomar'),
  };

  const orderedEpisodes: WatchProgressStepperEpisode[] = seasons
    .flatMap((season) =>
      (season.episodes ?? []).map((ep) => ({
        id: ep.id,
        seasonNumber: season.seasonNumber,
        episodeNumber: ep.episodeNumber,
        title: ep.title ?? null,
      }))
    )
    .sort((a, b) =>
      a.seasonNumber !== b.seasonNumber
        ? a.seasonNumber - b.seasonNumber
        : a.episodeNumber - b.episodeNumber
    );
  const hasEpisodes = orderedEpisodes.length > 0;

  const postStatus = async (
    newStatus: WatchStatusValue,
    successMessage?: string
  ) => {
    const previous = status;
    setStatus(newStatus);
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/series/${seriesId}/view-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) throw new Error(t('viewStatusToggle.errorUpdating'));
      trackFunnel('series_status_set', { status: newStatus, source: 'toggle' });
      await refetch();
      message.success(
        successMessage ??
          interpolateMessage(t('viewStatusToggle.statusUpdateSuccess'), {
            label: watchStatusLabels[newStatus] ?? newStatus,
          })
      );
    } catch (error) {
      setStatus(previous);
      message.error(t('viewStatusToggle.errorUpdate'));
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStartTracking = () => {
    trackFunnel('track_cta_click', { where: 'series_anon' });
    savePendingTrack({
      seriesId,
      upToEpisodeId: pendingEpisodeId,
      markWatched: !hasEpisodes,
      createdAt: Date.now(),
    });
    void signIn('google', { callbackUrl: window.location.pathname });
  };

  // ── Sin sesion: CTA (T07) ────────────────────────────────────────────
  if (!session?.user) {
    return (
      <section
        className="tracking-panel tracking-panel--anon"
        aria-label={t('trackCta.title')}
      >
        <header className="tracking-panel__header">
          <EyeOutlined aria-hidden />
          <span className="tracking-panel__title">{t('trackCta.title')}</span>
        </header>
        <p className="tracking-panel__hint">
          {hasEpisodes
            ? t('trackCta.subtitle')
            : t('trackCta.subtitleNoEpisodes')}
        </p>
        {hasEpisodes && (
          <div className="tracking-panel__anon-stepper">
            <span className="tracking-panel__label">
              {t('trackCta.chooseEpisode')}
            </span>
            <WatchProgressStepper
              seriesId={seriesId}
              seriesTitle={seriesTitle}
              episodes={orderedEpisodes}
              source="stepper"
              compact
              localOnly
              showNext={false}
              onLocalChange={setPendingEpisodeId}
            />
          </div>
        )}
        <Button
          type="primary"
          block
          size="large"
          icon={<CheckOutlined />}
          onClick={handleStartTracking}
          className="tracking-panel__cta"
        >
          {hasEpisodes ? t('trackCta.button') : t('trackCta.buttonNoEpisodes')}
        </Button>
      </section>
    );
  }

  // ── Con sesion ──────────────────────────────────────────────────────
  const statusOptions = Object.values(WATCH_STATUS).map((value) => ({
    value,
    label: (
      <span className="tracking-panel__option">
        <Badge status={WATCH_STATUS_COLORS[value] as AntStatusColor} />
        {watchStatusLabels[value] ?? value}
      </span>
    ),
  }));

  return (
    <section className="tracking-panel" aria-label={t('trackingPanel.title')}>
      <header className="tracking-panel__header">
        <EyeOutlined aria-hidden />
        <span className="tracking-panel__title">
          {t('trackingPanel.title')}
        </span>
      </header>

      <Select
        value={status}
        onChange={(value: WatchStatusValue) => void postStatus(value)}
        loading={isUpdating}
        disabled={isUpdating}
        options={statusOptions}
        className={`tracking-panel__select tracking-panel__select--${status.toLowerCase()}`}
        size="large"
        aria-label={t('viewStatusToggle.ariaLabel')}
      />

      {hasEpisodes ? (
        <WatchProgressStepper
          seriesId={seriesId}
          seriesTitle={seriesTitle}
          episodes={orderedEpisodes}
          source="stepper"
        />
      ) : (
        <div className="tracking-panel__no-episodes">
          {status === 'VISTA' ? (
            <Button
              block
              size="large"
              icon={<UndoOutlined />}
              disabled={isUpdating}
              onClick={() => void postStatus('SIN_VER')}
            >
              {t('trackingPanel.markUnwatched')}
            </Button>
          ) : (
            <Button
              type="primary"
              block
              size="large"
              icon={<CheckOutlined />}
              disabled={isUpdating}
              onClick={() =>
                void postStatus(
                  'VISTA',
                  interpolateMessage(t('trackingPanel.markedWatched'), {
                    title: seriesTitle,
                  })
                )
              }
            >
              {t('trackingPanel.markWatched')}
            </Button>
          )}
          <p className="tracking-panel__hint">
            {t('trackingPanel.noEpisodes')}
          </p>
        </div>
      )}
    </section>
  );
}
