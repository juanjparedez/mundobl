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
import { chapterCode, type TrackedChapter } from '@/lib/episode-chapters';
import { useMessage } from '@/hooks/useMessage';
import { useSeriesUserStatus } from '../SeriesUserStatusProvider';
import './WatchProgressStepper.css';

interface WatchProgressStepperProps {
  seriesId: number;
  /** Para el titulo del Popconfirm "¿Terminaste {title}?". */
  seriesTitle: string;
  /** Capitulos, no filas: un capitulo de YouTube viene en varias partes. */
  chapters: TrackedChapter[];
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
  /**
   * La serie sigue en emision (`isAiringNow`). Llegar al ultimo episodio
   * cargado es estar al dia, no terminarla: no se pregunta "¿Terminaste?".
   */
  airing?: boolean;
}

const lastEpisodeId = (chapter: TrackedChapter) =>
  chapter.episodeIds[chapter.episodeIds.length - 1];

export function WatchProgressStepper({
  seriesId,
  seriesTitle,
  chapters,
  compact = false,
  localOnly = false,
  onLocalChange,
  showNext = true,
  airing = false,
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
      findFurthestWatchedIndex(chapters, (chapter) =>
        chapter.episodeIds.every((id) => episodeStatus[id] === 'VISTA')
      )
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-derivar en cada version (refetch), no solo cuando cambia episodeStatus en si
  }, [version]);

  const total = chapters.length;
  const canGoPrev = index >= 0 && !pending;
  const canGoNext = index < total - 1 && !pending;
  const nextChapter = index < total - 1 ? chapters[index + 1] : null;

  const goTo = async (targetIndex: number) => {
    if (targetIndex === index || pending || targetIndex >= total) return;
    // targetIndex -1 = "no vi ninguno": desmarcar desde el primero.
    const unmark = targetIndex < index;

    if (localOnly) {
      setIndex(targetIndex);
      onLocalChange?.(
        targetIndex < 0 ? null : lastEpisodeId(chapters[targetIndex])
      );
      return;
    }

    const previous = index;
    setIndex(targetIndex);
    setPending(true);
    try {
      // El endpoint trabaja por fila: marca hasta la ultima parte del
      // capitulo, o desmarca todo lo que viene despues de ella. Para volver
      // a -1 se desmarca desde la primera fila, incluida.
      const body =
        unmark && targetIndex < 0
          ? {
              upToEpisodeId: chapters[0].episodeIds[0],
              direction: 'unmark',
              inclusive: true,
            }
          : unmark
            ? {
                upToEpisodeId: lastEpisodeId(chapters[targetIndex]),
                direction: 'unmark',
              }
            : { upToEpisodeId: lastEpisodeId(chapters[targetIndex]) };
      const response = await fetch(`/api/series/${seriesId}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error();
      const data = (await response.json()) as {
        episodeStatus: Record<number, string>;
        seriesStatus: string;
      };
      await refetch();
      // El allWatched del server cuenta traileres y extras: "terminar" se
      // mide por capitulos. Si ya esta marcada como vista, no se pregunta.
      const finished = chapters.every((chapter) =>
        chapter.episodeIds.every((id) => data.episodeStatus[id] === 'VISTA')
      );
      if (!unmark && finished && !airing && data.seriesStatus !== 'VISTA') {
        setFinishedOpen(true);
      }
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

  const jumpOptions = [
    { value: -1, label: t('progressStepper.none') },
    ...chapters.map((chapter, i) => ({
      value: i,
      label: chapter.title
        ? `${chapterCode(chapter)} — ${chapter.title}`
        : chapterCode(chapter),
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
          {nextChapter ? (
            <>
              <PlayCircleOutlined aria-hidden />
              <span className="watch-progress-stepper__next-text">
                {interpolateMessage(t('progressStepper.nextUp'), {
                  label: chapterCode(nextChapter),
                })}
                {nextChapter.title && (
                  <span className="watch-progress-stepper__next-title">
                    {' '}
                    — {nextChapter.title}
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
                {airing
                  ? t('airDayStatus.upToDate')
                  : t('progressStepper.allWatched')}
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
