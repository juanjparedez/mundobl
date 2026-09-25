'use client';

import { useEffect, useState } from 'react';
import { Select, Progress, Tooltip, Popconfirm } from 'antd';
import {
  MinusOutlined,
  PlusOutlined,
  PlayCircleOutlined,
  CheckCircleFilled,
} from '@ant-design/icons';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { interpolateMessage } from '@/lib/i18n-format';
import { findFurthestWatchedIndex } from '@/lib/episode-progress';
import { useMessage } from '@/hooks/useMessage';
import { useSeriesUserStatus } from '../SeriesUserStatusProvider';
import { trackFunnel } from '@/lib/analytics';
import './WatchProgressStepper.css';

export interface WatchProgressStepperEpisode {
  id: number;
  seasonNumber: number;
  episodeNumber: number;
  title?: string | null;
}

interface WatchProgressStepperProps {
  seriesId: number;
  /** Para el titulo del Popconfirm "¿Terminaste {title}?". */
  seriesTitle: string;
  episodes: WatchProgressStepperEpisode[];
  /** Para analytics (T01). */
  source: 'stepper' | 'onboarding';
  /** Reutilizable en onboarding/cards con controles mas chicos. */
  compact?: boolean;
  /**
   * Modo sin sesion (T07, CTA anonimo): no llama a la API ni al provider,
   * solo mueve un numero local y lo reporta via onLocalChange. Tampoco
   * ofrece "¿Terminaste?" — no hay estado real del servidor que confirmar.
   */
  localOnly?: boolean;
  onLocalChange?: (episodeId: number | null) => void;
  /** Linea "Siguiente: T1·E3 — titulo" debajo de la barra. */
  showNext?: boolean;
}

export function episodeCode(ep: WatchProgressStepperEpisode): string {
  return `T${ep.seasonNumber}·E${ep.episodeNumber}`;
}

export function WatchProgressStepper({
  seriesId,
  seriesTitle,
  episodes,
  source,
  compact = false,
  localOnly = false,
  onLocalChange,
  showNext = true,
}: WatchProgressStepperProps) {
  const { t } = useLocale();
  const message = useMessage();
  const { episodeStatus, version, refetch } = useSeriesUserStatus();

  const [index, setIndex] = useState(-1);
  const [pending, setPending] = useState(false);
  const [picking, setPicking] = useState(false);
  const [finishedOpen, setFinishedOpen] = useState(false);
  const [finishing, setFinishing] = useState(false);

  useEffect(() => {
    setIndex(
      findFurthestWatchedIndex(
        episodes,
        (ep) => episodeStatus[ep.id] === 'VISTA'
      )
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-derivar en cada version (refetch), no solo cuando cambia episodeStatus en si
  }, [version]);

  const total = episodes.length;
  const canGoPrev = index >= 0 && !pending;
  const canGoNext = index < total - 1 && !pending;
  const nextEpisode = index < total - 1 ? episodes[index + 1] : null;

  const goTo = async (targetIndex: number) => {
    if (targetIndex === index || pending || targetIndex >= total) return;
    // targetIndex -1 = "no vi ninguno": desmarcar desde el primero.
    const unmark = targetIndex < index;
    const target = unmark ? episodes[targetIndex + 1] : episodes[targetIndex];
    if (!target) return;

    if (localOnly) {
      setIndex(targetIndex);
      onLocalChange?.(targetIndex < 0 ? null : episodes[targetIndex].id);
      return;
    }

    const previous = index;
    setIndex(targetIndex);
    setPending(true);
    try {
      // Desmarcar: el endpoint deja en SIN_VER los episodios POSTERIORES al
      // objetivo, asi que para bajar a "targetIndex" se pasa ese episodio y
      // para bajar a -1 se desmarca todo (objetivo = primero, incluido).
      const body =
        unmark && targetIndex < 0
          ? {
              upToEpisodeId: episodes[0].id,
              direction: 'unmark',
              inclusive: true,
            }
          : unmark
            ? { upToEpisodeId: episodes[targetIndex].id, direction: 'unmark' }
            : { upToEpisodeId: target.id };
      const response = await fetch(`/api/series/${seriesId}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error();
      const data = (await response.json()) as { allWatched: boolean };
      trackFunnel('episode_marked', {
        source,
        status: unmark ? 'SIN_VER' : 'VISTA',
      });
      await refetch();
      if (!unmark && data.allWatched) setFinishedOpen(true);
    } catch {
      setIndex(previous);
      message.error(t('progressStepper.error'));
    } finally {
      setPending(false);
    }
  };

  const handleMarkComplete = async () => {
    setFinishing(true);
    try {
      const response = await fetch(`/api/series/${seriesId}/view-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'VISTA' }),
      });
      if (!response.ok) throw new Error();
      trackFunnel('series_status_set', { status: 'VISTA', source: 'toggle' });
      await refetch();
    } catch {
      message.error(t('progressStepper.error'));
    } finally {
      setFinishing(false);
      setFinishedOpen(false);
    }
  };

  const jumpOptions = [
    { value: -1, label: t('progressStepper.none') },
    ...episodes.map((ep, i) => ({
      value: i,
      label: ep.title ? `${episodeCode(ep)} — ${ep.title}` : episodeCode(ep),
    })),
  ];

  const displayNumber = index + 1;
  const longLabel = interpolateMessage(t('progressStepper.at'), {
    current: displayNumber,
    total,
  });
  const rootClassName = `watch-progress-stepper${compact ? ' watch-progress-stepper--compact' : ''}`;

  const nextButton = (
    <Tooltip title={t('progressStepper.next')}>
      <button
        type="button"
        className="watch-progress-stepper__btn watch-progress-stepper__btn--next"
        disabled={!canGoNext}
        onClick={() => void goTo(index + 1)}
        aria-label={t('progressStepper.ariaNext')}
      >
        <PlusOutlined />
      </button>
    </Tooltip>
  );

  return (
    <div className={rootClassName}>
      <div className="watch-progress-stepper__row">
        <Tooltip title={t('progressStepper.prev')}>
          <button
            type="button"
            className="watch-progress-stepper__btn"
            disabled={!canGoPrev}
            onClick={() => void goTo(index - 1)}
            aria-label={t('progressStepper.ariaPrev')}
          >
            <MinusOutlined />
          </button>
        </Tooltip>

        {picking ? (
          <Select
            autoFocus
            open
            size="small"
            className="watch-progress-stepper__picker"
            value={index}
            options={jumpOptions}
            onChange={(value: number) => {
              setPicking(false);
              void goTo(value);
            }}
            onOpenChange={(open) => {
              if (!open) setPicking(false);
            }}
          />
        ) : (
          <Tooltip title={t('progressStepper.jumpTo')}>
            <button
              type="button"
              className="watch-progress-stepper__label"
              onClick={() => setPicking(true)}
              disabled={pending || total === 0}
              aria-label={longLabel}
            >
              <span className="watch-progress-stepper__label-prefix">
                {t('progressStepper.epAbbr')}
              </span>
              <span className="watch-progress-stepper__label-current">
                {displayNumber}
              </span>
              <span className="watch-progress-stepper__label-total">
                / {total}
              </span>
            </button>
          </Tooltip>
        )}

        {localOnly ? (
          nextButton
        ) : (
          <Popconfirm
            title={interpolateMessage(t('progressStepper.finishedTitle'), {
              title: seriesTitle,
            })}
            open={finishedOpen}
            onConfirm={() => void handleMarkComplete()}
            onCancel={() => setFinishedOpen(false)}
            okText={t('progressStepper.markComplete')}
            cancelText={t('progressStepper.notYet')}
            okButtonProps={{ loading: finishing }}
          >
            {nextButton}
          </Popconfirm>
        )}
      </div>

      {total > 0 && (
        <Progress
          percent={Math.round((Math.max(displayNumber, 0) / total) * 100)}
          size="small"
          status={displayNumber === total ? 'success' : 'active'}
          showInfo={false}
          className="watch-progress-stepper__bar"
        />
      )}

      {showNext && total > 0 && (
        <div className="watch-progress-stepper__next">
          {nextEpisode ? (
            <>
              <PlayCircleOutlined aria-hidden />
              <span className="watch-progress-stepper__next-text">
                {interpolateMessage(t('progressStepper.nextUp'), {
                  label: episodeCode(nextEpisode),
                })}
                {nextEpisode.title && (
                  <span className="watch-progress-stepper__next-title">
                    {' '}
                    — {nextEpisode.title}
                  </span>
                )}
              </span>
            </>
          ) : (
            <>
              <CheckCircleFilled
                className="watch-progress-stepper__next-done"
                aria-hidden
              />
              <span className="watch-progress-stepper__next-text">
                {t('progressStepper.allWatched')}
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
