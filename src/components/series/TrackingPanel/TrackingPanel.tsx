'use client';

import { useEffect, useState } from 'react';
import { Select, Badge, Button } from 'antd';
import {
  EyeOutlined,
  CheckOutlined,
  UndoOutlined,
  RedoOutlined,
  LockOutlined,
  FileTextFilled,
  FileTextOutlined,
} from '@ant-design/icons';
import { useSession, signIn } from 'next-auth/react';
import { WATCH_STATUS, WATCH_STATUS_COLORS } from '@/constants/series';
import type { WatchStatusValue } from '@/constants/series';
import { useSeriesUserStatus } from '../SeriesUserStatusProvider';
import {
  WatchProgressStepper,
  episodeCode,
  type WatchProgressStepperEpisode,
} from '../WatchProgressStepper/WatchProgressStepper';
import { EpisodeNoteModal } from '../EpisodeNoteModal/EpisodeNoteModal';
import { SeriesNoteModal } from '../SeriesNoteModal/SeriesNoteModal';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { interpolateMessage } from '@/lib/i18n-format';
import { useMessage } from '@/hooks/useMessage';
import { savePendingTrack } from '@/lib/pending-track';
import { findFurthestWatchedIndex } from '@/lib/episode-progress';
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
  /** La serie sigue en emision (`isAiringNow`): ver WatchProgressStepper. */
  airing?: boolean;
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
  airing = false,
}: TrackingPanelProps) {
  const message = useMessage();
  const { t } = useLocale();
  const { data: session } = useSession();
  const { seriesStatus, episodeStatus, loaded, version, refetch } =
    useSeriesUserStatus();
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

  // ── Notas privadas (T29): del ultimo episodio visto y de la serie ────
  // El "ultimo visto" sale del provider, asi que despues de un "+" en el
  // stepper el boton pasa solo a "Nota del Ep. N+1".
  const furthestIndex = findFurthestWatchedIndex(
    orderedEpisodes,
    (ep) => episodeStatus[ep.id] === 'VISTA'
  );
  const lastWatched = orderedEpisodes[furthestIndex] ?? null;
  // Marcada como vista pero con capitulos despues del ultimo visto: le
  // llegaron capitulos nuevos (o la marco vista antes de terminarla). No se
  // le cambia el estado solo; se le ofrece volver a seguirla de un toque.
  const hasEpisodesAfterLast =
    furthestIndex >= 0 && furthestIndex < orderedEpisodes.length - 1;
  const [episodesWithNotes, setEpisodesWithNotes] = useState<Set<number>>(
    new Set()
  );
  const [seriesHasNote, setSeriesHasNote] = useState(false);
  const [noteEpisode, setNoteEpisode] =
    useState<WatchProgressStepperEpisode | null>(null);
  const [seriesNoteOpen, setSeriesNoteOpen] = useState(false);
  const loggedIn = !!session?.user;
  const episodeIdsKey = orderedEpisodes.map((ep) => ep.id).join(',');

  useEffect(() => {
    if (!loggedIn) return;
    let cancelled = false;
    if (episodeIdsKey) {
      fetch(`/api/episodes/notes-summary?ids=${episodeIdsKey}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data: { episodeIds?: number[] } | null) => {
          if (!cancelled && data?.episodeIds) {
            setEpisodesWithNotes(new Set(data.episodeIds));
          }
        })
        .catch(() => null);
    }
    fetch(`/api/series/notes-summary?ids=${seriesId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { seriesIds?: number[] } | null) => {
        if (!cancelled && data?.seriesIds) {
          setSeriesHasNote(data.seriesIds.includes(seriesId));
        }
      })
      .catch(() => null);
    return () => {
      cancelled = true;
    };
  }, [loggedIn, seriesId, episodeIdsKey]);

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

      {status === 'VISTA' && hasEpisodesAfterLast && (
        <div className="tracking-panel__resume">
          <p className="tracking-panel__hint">
            {t('trackingPanel.episodesAfterLast')}
          </p>
          <Button
            type="primary"
            block
            icon={<RedoOutlined />}
            disabled={isUpdating}
            onClick={() => void postStatus('VIENDO')}
          >
            {t('trackingPanel.followAgain')}
          </Button>
        </div>
      )}

      {hasEpisodes ? (
        <WatchProgressStepper
          seriesId={seriesId}
          seriesTitle={seriesTitle}
          episodes={orderedEpisodes}
          airing={airing}
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

      {/* Notas privadas: solo las ve el usuario. Distintas de los
          comentarios (publicos). Van pegadas al tracking porque el momento
          de anotar "en este capitulo se conocen" es justo despues de
          marcarlo como visto. */}
      <div className="tracking-panel__notes">
        <span className="tracking-panel__notes-title">
          <LockOutlined aria-hidden /> {t('trackingPanel.notesTitle')}
        </span>
        <div className="tracking-panel__notes-row">
          {lastWatched && (
            <Button
              className="tracking-panel__note-btn"
              icon={
                episodesWithNotes.has(lastWatched.id) ? (
                  <FileTextFilled />
                ) : (
                  <FileTextOutlined />
                )
              }
              onClick={() => setNoteEpisode(lastWatched)}
            >
              {interpolateMessage(t('trackingPanel.episodeNote'), {
                code: episodeCode(lastWatched),
              })}
            </Button>
          )}
          <Button
            className="tracking-panel__note-btn"
            icon={seriesHasNote ? <FileTextFilled /> : <FileTextOutlined />}
            onClick={() => setSeriesNoteOpen(true)}
          >
            {t('trackingPanel.seriesNote')}
          </Button>
        </div>
        {!lastWatched && hasEpisodes && (
          <p className="tracking-panel__hint">
            {t('trackingPanel.notesHintNoEpisode')}
          </p>
        )}
      </div>

      <EpisodeNoteModal
        episodeId={noteEpisode?.id ?? null}
        episodeLabel={
          noteEpisode
            ? noteEpisode.title
              ? `${episodeCode(noteEpisode)} — ${noteEpisode.title}`
              : episodeCode(noteEpisode)
            : undefined
        }
        open={noteEpisode !== null}
        onClose={() => setNoteEpisode(null)}
        onNoteChange={(hasNote) => {
          if (!noteEpisode) return;
          setEpisodesWithNotes((prev) => {
            const next = new Set(prev);
            if (hasNote) next.add(noteEpisode.id);
            else next.delete(noteEpisode.id);
            return next;
          });
        }}
      />
      <SeriesNoteModal
        seriesId={seriesNoteOpen ? seriesId : null}
        seriesLabel={seriesTitle}
        open={seriesNoteOpen}
        onClose={() => setSeriesNoteOpen(false)}
        onNoteChange={setSeriesHasNote}
      />
    </section>
  );
}
