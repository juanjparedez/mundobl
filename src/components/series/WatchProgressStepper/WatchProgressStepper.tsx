'use client';

import { useEffect, useState } from 'react';
import { Select, Progress, Tooltip, Popconfirm } from 'antd';
import { MinusOutlined, PlusOutlined } from '@ant-design/icons';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { interpolateMessage } from '@/lib/i18n-format';
import { useMessage } from '@/hooks/useMessage';
import { useSeriesUserStatus } from '../SeriesUserStatusProvider';
import { trackFunnel } from '@/lib/analytics';
import './WatchProgressStepper.css';

export interface WatchProgressStepperEpisode {
  id: number;
  seasonNumber: number;
  episodeNumber: number;
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
}

/** Ultimo episodio en VISTA (el de mayor indice, aunque haya huecos antes). */
function findCurrentIndex(
  episodes: WatchProgressStepperEpisode[],
  episodeStatus: Record<number, string>
): number {
  let last = -1;
  episodes.forEach((ep, i) => {
    if (episodeStatus[ep.id] === 'VISTA') last = i;
  });
  return last;
}

export function WatchProgressStepper({
  seriesId,
  seriesTitle,
  episodes,
  source,
  compact = false,
  localOnly = false,
  onLocalChange,
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
    setIndex(findCurrentIndex(episodes, episodeStatus));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-derivar en cada version (refetch), no solo cuando cambia episodeStatus en si
  }, [version]);

  const total = episodes.length;
  const canGoPrev = index > 0 && !pending;
  const canGoNext = index < total - 1 && !pending;

  const goTo = async (targetIndex: number) => {
    if (
      targetIndex === index ||
      pending ||
      targetIndex < 0 ||
      targetIndex >= total
    ) {
      return;
    }
    const target = episodes[targetIndex];
    const unmark = targetIndex < index;

    if (localOnly) {
      setIndex(targetIndex);
      onLocalChange?.(target.id);
      return;
    }

    const previous = index;
    setIndex(targetIndex);
    setPending(true);
    try {
      const response = await fetch(`/api/series/${seriesId}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          unmark
            ? { upToEpisodeId: target.id, direction: 'unmark' }
            : { upToEpisodeId: target.id }
        ),
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
      await refetch();
    } catch {
      message.error(t('progressStepper.error'));
    } finally {
      setFinishing(false);
      setFinishedOpen(false);
    }
  };

  const jumpOptions = episodes.map((ep, i) => ({
    value: i,
    label: `T${ep.seasonNumber}·E${ep.episodeNumber}`,
  }));

  const displayNumber = index + 1;
  const rootClassName = `watch-progress-stepper${compact ? ' watch-progress-stepper--compact' : ''}`;

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
          <button
            type="button"
            className="watch-progress-stepper__label"
            onClick={() => setPicking(true)}
            disabled={pending || total === 0}
          >
            {interpolateMessage(t('progressStepper.at'), {
              current: displayNumber,
              total,
            })}
          </button>
        )}

        {localOnly ? (
          <Tooltip title={t('progressStepper.next')}>
            <button
              type="button"
              className="watch-progress-stepper__btn"
              disabled={!canGoNext}
              onClick={() => void goTo(index + 1)}
              aria-label={t('progressStepper.ariaNext')}
            >
              <PlusOutlined />
            </button>
          </Tooltip>
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
            <Tooltip title={t('progressStepper.next')}>
              <button
                type="button"
                className="watch-progress-stepper__btn"
                disabled={!canGoNext}
                onClick={() => void goTo(index + 1)}
                aria-label={t('progressStepper.ariaNext')}
              >
                <PlusOutlined />
              </button>
            </Tooltip>
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
    </div>
  );
}
