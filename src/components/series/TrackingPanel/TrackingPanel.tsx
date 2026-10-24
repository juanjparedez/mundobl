'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button, Dropdown, Popconfirm, type MenuProps } from 'antd';
import {
  EyeOutlined,
  CalendarOutlined,
  CheckOutlined,
  RedoOutlined,
  LockOutlined,
  FileTextFilled,
  FileTextOutlined,
  BulbOutlined,
  MoreOutlined,
  PlayCircleOutlined,
  BookOutlined,
  PauseCircleOutlined,
  StopOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { useSession, signIn } from 'next-auth/react';
import type { WatchStatusValue } from '@/constants/series';
import { useSeriesUserStatus } from '../SeriesUserStatusProvider';
import { WatchProgressStepper } from '../WatchProgressStepper/WatchProgressStepper';
import { EpisodeNoteModal } from '../EpisodeNoteModal/EpisodeNoteModal';
import { SeriesNoteModal } from '../SeriesNoteModal/SeriesNoteModal';
import { SignupNudge } from '../SignupNudge/SignupNudge';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { useMessage } from '@/hooks/useMessage';
import { useDismissedNotice } from '@/hooks/useDismissedNotice';
import { findFurthestWatchedIndex } from '@/lib/episode-progress';
import { toTrackedChapters, type TrackedChapter } from '@/lib/episode-chapters';
import { setLocalProgressThrough } from '@/lib/local-progress';
import { saveSeriesStatus } from '@/lib/series-status-client';
import { WatchDateEditor } from '../WatchDateEditor/WatchDateEditor';
import { SIMILAR_SERIES_ANCHOR } from '../SimilarSeries/SimilarSeries';
import './TrackingPanel.css';

interface TrackingPanelProps {
  seriesId: number;
  /** Para el "¿Terminaste {title}?" y los mensajes de confirmacion. */
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
  /** La ficha muestra "Si te gusto esta": al terminarla se ofrece el salto. */
  hasSimilar?: boolean;
}

/** Aviso de cuenta: una sola vez por navegador, despues de usar el panel. */
const SIGNUP_NUDGE_ID = 'tracking-signup-nudge';
/** Capitulos marcados sin cuenta antes de explicar para que sirve una. */
const SIGNUP_NUDGE_CHAPTERS = 2;

/**
 * "Mi seguimiento": el mismo panel en la ficha y en /ver, con o sin cuenta.
 *
 * Un solo progreso por serie, medido en capitulos. El estado sale de ese
 * progreso (el primer capitulo la pone en Viendo, el ultimo ofrece Vista,
 * como hace el servidor en tracking.ts); a mano solo se elige la intencion:
 * Quiero verla, En pausa, Abandonada. Sin cuenta todo funciona igual y se
 * guarda en este navegador (local-progress.ts); el pie dice donde.
 *
 * Todo lo que depende del usuario se hidrata en cliente via
 * SeriesUserStatusProvider: la ficha es ISR y no llama auth().
 */
export function TrackingPanel({
  seriesId,
  seriesTitle,
  seasons = [],
  airing = false,
  hasSimilar = false,
}: TrackingPanelProps) {
  const message = useMessage();
  const { t } = useLocale();
  const { data: session } = useSession();
  const { seriesStatus, episodeStatus, loaded, version, refetch, storage } =
    useSeriesUserStatus();
  const signupNudge = useDismissedNotice(SIGNUP_NUDGE_ID);
  const [status, setStatus] = useState<WatchStatusValue>('SIN_VER');
  const [isUpdating, setIsUpdating] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  // "La estoy viendo" sin capitulos marcados: abre el selector de capitulo
  // en vez de dejar la serie en la lista con progreso 0 para siempre.
  const [choosingEpisode, setChoosingEpisode] = useState(false);

  useEffect(() => {
    if (loaded) setStatus(seriesStatus as WatchStatusValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-sembrar en cada version (refetch), no solo cuando cambia seriesStatus/loaded en si
  }, [version]);

  const statusLabels: Record<WatchStatusValue, string> = {
    SIN_VER: t('viewStatusToggle.sinVer'),
    VIENDO: t('viewStatusToggle.viendo'),
    VISTA: t('viewStatusToggle.vista'),
    ABANDONADA: t('viewStatusToggle.abandonada'),
    RETOMAR: t('viewStatusToggle.retomar'),
    QUIERO_VER: t('viewStatusToggle.quieroVer'),
  };

  const rows = useMemo(
    () =>
      seasons.flatMap((season) =>
        (season.episodes ?? []).map((ep) => ({
          id: ep.id,
          seasonNumber: season.seasonNumber,
          episodeNumber: ep.episodeNumber,
          title: ep.title ?? null,
        }))
      ),
    [seasons]
  );
  // Capitulos, no filas: en YouTube un capitulo viene en varias partes.
  const chapters = useMemo(() => toTrackedChapters(rows), [rows]);
  const hasEpisodes = chapters.length > 0;
  const loggedIn = !!session?.user;
  const local = storage === 'local';

  const furthestIndex = findFurthestWatchedIndex(chapters, (chapter) =>
    chapter.episodeIds.every((id) => episodeStatus[id] === 'VISTA')
  );
  const watchedChapters = furthestIndex + 1;
  const hasProgress = watchedChapters > 0;
  const lastWatched = chapters[furthestIndex] ?? null;
  // Vista pero con capitulos despues del ultimo visto: le llegaron
  // capitulos nuevos (o la marco vista antes de terminarla). No se le cambia
  // el estado solo; se le ofrece volver a seguirla de un toque.
  const hasEpisodesAfterLast =
    furthestIndex >= 0 && furthestIndex < chapters.length - 1;
  // Todos los capitulos vistos pero la serie sigue en curso: se ofrece
  // cerrarla de un toque.
  const canFinish =
    hasEpisodes &&
    !airing &&
    furthestIndex === chapters.length - 1 &&
    (status === 'VIENDO' || status === 'RETOMAR');
  const manualIntent =
    status === 'QUIERO_VER' ||
    status === 'RETOMAR' ||
    status === 'ABANDONADA' ||
    status === 'VISTA';

  const saveStatus = async (next: WatchStatusValue, success?: string) => {
    const previous = status;
    setStatus(next);
    setIsUpdating(true);
    try {
      await saveSeriesStatus(seriesId, next, storage);
      await refetch();
      message.success(
        success ??
          t('viewStatusToggle.statusUpdateSuccess', {
            label: statusLabels[next],
          })
      );
    } catch {
      setStatus(previous);
      message.error(t('viewStatusToggle.errorUpdate'));
    } finally {
      setIsUpdating(false);
    }
  };

  /** "Ya la vi toda": todos los capitulos + Vista, en un paso. */
  const markAllWatched = async () => {
    if (!hasEpisodes) {
      await saveStatus(
        'VISTA',
        t('trackingPanel.markedWatched', { title: seriesTitle })
      );
      return;
    }
    const lastChapter = chapters[chapters.length - 1];
    const lastId = lastChapter.episodeIds[lastChapter.episodeIds.length - 1];
    setIsUpdating(true);
    try {
      if (local) {
        const ordered = chapters.flatMap((chapter) => chapter.episodeIds);
        setLocalProgressThrough(seriesId, ordered, ordered.length - 1);
        await saveSeriesStatus(seriesId, 'VISTA', 'local');
      } else {
        const response = await fetch(`/api/series/${seriesId}/progress`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ upToEpisodeId: lastId }),
        });
        if (!response.ok) throw new Error();
        await saveSeriesStatus(seriesId, 'VISTA', 'account');
      }
      await refetch();
      message.success(t('trackingPanel.markedWatched', { title: seriesTitle }));
    } catch {
      message.error(t('viewStatusToggle.errorUpdate'));
    } finally {
      setIsUpdating(false);
    }
  };

  // ── Notas privadas (T29), solo con cuenta ──────────────────────────
  const [episodesWithNotes, setEpisodesWithNotes] = useState<Set<number>>(
    new Set()
  );
  const [seriesHasNote, setSeriesHasNote] = useState(false);
  const [noteChapter, setNoteChapter] = useState<TrackedChapter | null>(null);
  const [seriesNoteOpen, setSeriesNoteOpen] = useState(false);
  const episodeIdsKey = rows.map((ep) => ep.id).join(',');

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

  const chapterShort = (chapter: { seasonNumber: number; number: number }) =>
    t('progressStepper.chapterShort', {
      season: chapter.seasonNumber,
      n: chapter.number,
    });

  // Una frase que dice donde esta: lo primero que se lee del panel.
  const summary =
    status === 'VISTA'
      ? t('tracking.summaryFinished')
      : status === 'QUIERO_VER'
        ? t('tracking.summaryWantToWatch')
        : status === 'ABANDONADA'
          ? t('tracking.summaryDropped')
          : status === 'RETOMAR'
            ? hasProgress
              ? t('tracking.summaryPausedAt', {
                  current: watchedChapters,
                  total: chapters.length,
                })
              : t('tracking.summaryPaused')
            : hasProgress
              ? t('tracking.summaryAt', {
                  current: watchedChapters,
                  total: chapters.length,
                })
              : hasEpisodes
                ? t('tracking.summaryEmpty')
                : t('tracking.summaryEmptyNoEpisodes');

  const menuItems: MenuProps['items'] = [
    status !== 'QUIERO_VER' && !hasProgress
      ? {
          key: 'QUIERO_VER',
          icon: <BookOutlined />,
          label: t('tracking.wantToWatch'),
        }
      : null,
    status !== 'VISTA'
      ? {
          key: 'ALL',
          icon: <CheckOutlined />,
          label: hasEpisodes
            ? t('tracking.markAllWatched')
            : t('trackingPanel.markWatched'),
        }
      : null,
    hasProgress && status !== 'RETOMAR' && status !== 'VISTA'
      ? {
          key: 'RETOMAR',
          icon: <PauseCircleOutlined />,
          label: t('tracking.pause'),
        }
      : null,
    status !== 'ABANDONADA'
      ? {
          key: 'ABANDONADA',
          icon: <StopOutlined />,
          label: t('tracking.drop'),
        }
      : null,
    manualIntent
      ? {
          key: 'CLEAR',
          icon: <CloseCircleOutlined />,
          label: t('tracking.clearIntent', { label: statusLabels[status] }),
        }
      : null,
  ].filter((item) => item !== null);

  const onMenu: MenuProps['onClick'] = ({ key }) => {
    if (key === 'ALL') void markAllWatched();
    else if (key === 'CLEAR')
      void saveStatus(
        hasProgress ? 'VIENDO' : 'SIN_VER',
        t('tracking.intentCleared')
      );
    else void saveStatus(key as WatchStatusValue);
  };

  const signInHere = () =>
    void signIn('google', {
      callbackUrl: window.location.pathname + window.location.search,
    });

  const showStepper =
    hasEpisodes &&
    (hasProgress ||
      choosingEpisode ||
      status === 'VIENDO' ||
      status === 'RETOMAR');
  const showStartButtons =
    !showStepper && status !== 'VISTA' && status !== 'ABANDONADA';
  const showSignupNudge =
    local &&
    !signupNudge.dismissed &&
    (watchedChapters >= SIGNUP_NUDGE_CHAPTERS ||
      status === 'QUIERO_VER' ||
      status === 'VISTA');

  return (
    <section className="tracking-panel" aria-label={t('trackingPanel.title')}>
      <header className="tracking-panel__header">
        <span className="tracking-panel__heading">
          <EyeOutlined aria-hidden />
          <span className="tracking-panel__title">
            {t('trackingPanel.title')}
          </span>
        </span>
        <Dropdown
          menu={{ items: menuItems, onClick: onMenu }}
          trigger={['click']}
          disabled={isUpdating || !loaded}
        >
          <Button
            type="text"
            size="small"
            icon={<MoreOutlined />}
            aria-label={t('tracking.moreOptions')}
            className="tracking-panel__more"
          />
        </Dropdown>
      </header>

      <p className="tracking-panel__summary" aria-live="polite">
        {summary}
      </p>

      {showStartButtons && (
        <div className="tracking-panel__start">
          {hasEpisodes ? (
            <Button
              type="primary"
              size="large"
              icon={<PlayCircleOutlined />}
              disabled={isUpdating || !loaded}
              onClick={() => setChoosingEpisode(true)}
              className="tracking-panel__cta"
            >
              {t('tracking.startWatching')}
            </Button>
          ) : (
            <Button
              type="primary"
              size="large"
              icon={<CheckOutlined />}
              disabled={isUpdating || !loaded}
              onClick={() => void markAllWatched()}
              className="tracking-panel__cta"
            >
              {t('trackingPanel.markWatched')}
            </Button>
          )}
          <Button
            size="large"
            icon={
              status === 'QUIERO_VER' ? <CheckOutlined /> : <BookOutlined />
            }
            disabled={isUpdating || !loaded}
            aria-pressed={status === 'QUIERO_VER'}
            onClick={() =>
              void saveStatus(
                status === 'QUIERO_VER' ? 'SIN_VER' : 'QUIERO_VER'
              )
            }
            className="tracking-panel__cta"
          >
            {status === 'QUIERO_VER'
              ? t('tracking.inWantList')
              : t('tracking.wantToWatch')}
          </Button>
        </div>
      )}

      {choosingEpisode && !hasProgress && (
        <p className="tracking-panel__hint">{t('trackCta.chooseEpisode')}</p>
      )}

      {showStepper && (
        <WatchProgressStepper
          seriesId={seriesId}
          seriesTitle={seriesTitle}
          chapters={chapters}
          airing={airing}
          localOnly={local}
          openPicker={choosingEpisode && !hasProgress}
        />
      )}

      {canFinish && (
        <div className="tracking-panel__resume">
          <p className="tracking-panel__hint">
            {t('progressStepper.finishedTitle', { title: seriesTitle })}
          </p>
          <Button
            type="primary"
            block
            icon={<CheckOutlined />}
            disabled={isUpdating}
            onClick={() => void saveStatus('VISTA')}
          >
            {t('progressStepper.markComplete')}
          </Button>
        </div>
      )}

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
            onClick={() => void saveStatus('VIENDO')}
          >
            {t('trackingPanel.followAgain')}
          </Button>
        </div>
      )}

      {status === 'VISTA' && (
        <div className="tracking-panel__finished">
          {!local && (
            <Button
              icon={<CalendarOutlined />}
              onClick={() => setDateOpen(true)}
              disabled={isUpdating}
            >
              {t('watchDateEditor.title')}
            </Button>
          )}
          {hasSimilar && (
            <a
              href={`#${SIMILAR_SERIES_ANCHOR}`}
              className="tracking-panel__next-link"
            >
              <BulbOutlined aria-hidden /> {t('recommendations.seeSimilar')}
            </a>
          )}
          {!hasEpisodes && (
            <Popconfirm
              title={t('tracking.unwatchConfirm')}
              onConfirm={() => void saveStatus('SIN_VER')}
              okText={t('trackingPanel.markUnwatched')}
              cancelText={t('progressStepper.notYet')}
            >
              <Button type="link" size="small" disabled={isUpdating}>
                {t('trackingPanel.markUnwatched')}
              </Button>
            </Popconfirm>
          )}
        </div>
      )}

      {showSignupNudge && (
        <SignupNudge
          title={t('tracking.signupTitle')}
          body={t('tracking.signupBody')}
          action={t('tracking.signupAction')}
          dismiss={t('tracking.signupDismiss')}
          onAction={signInHere}
          onDismiss={signupNudge.dismiss}
        />
      )}

      {local ? (
        <p className="tracking-panel__local-note">
          {t('tracking.localFooter')}{' '}
          <button
            type="button"
            className="tracking-panel__login-link"
            onClick={signInHere}
          >
            {t('tracking.localFooterAction')}
          </button>
        </p>
      ) : (
        /* Notas privadas: solo las ve el usuario. Distintas de los
           comentarios (publicos). Van pegadas al tracking porque el momento
           de anotar "en este capitulo se conocen" es justo despues de
           marcarlo como visto. */
        <div className="tracking-panel__notes">
          <span className="tracking-panel__notes-title">
            <LockOutlined aria-hidden /> {t('trackingPanel.notesTitle')}
          </span>
          <div className="tracking-panel__notes-row">
            {lastWatched && (
              <Button
                className="tracking-panel__note-btn"
                icon={
                  episodesWithNotes.has(lastWatched.episodeIds[0]) ? (
                    <FileTextFilled />
                  ) : (
                    <FileTextOutlined />
                  )
                }
                onClick={() => setNoteChapter(lastWatched)}
              >
                {t('trackingPanel.episodeNote', {
                  code: chapterShort(lastWatched),
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
      )}

      {loggedIn && (
        <>
          <EpisodeNoteModal
            episodeId={noteChapter?.episodeIds[0] ?? null}
            episodeLabel={
              noteChapter
                ? noteChapter.title
                  ? `${chapterShort(noteChapter)} — ${noteChapter.title}`
                  : chapterShort(noteChapter)
                : undefined
            }
            open={noteChapter !== null}
            onClose={() => setNoteChapter(null)}
            onNoteChange={(hasNote) => {
              if (!noteChapter) return;
              setEpisodesWithNotes((prev) => {
                const next = new Set(prev);
                if (hasNote) next.add(noteChapter.episodeIds[0]);
                else next.delete(noteChapter.episodeIds[0]);
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
        </>
      )}
      {dateOpen && session?.user && status === 'VISTA' && (
        <WatchDateEditor
          key={`${session.user.id}-${seriesId}`}
          options={[{ target: { seriesId }, label: seriesTitle }]}
          onClose={() => setDateOpen(false)}
          labels={{
            title: t('watchDateEditor.title'),
            date: t('watchDateEditor.date'),
            unknown: t('watchDateEditor.unknown'),
            save: t('watchDateEditor.save'),
            cancel: t('watchDateEditor.cancel'),
            error: t('watchDateEditor.error'),
            conflict: t('watchDateEditor.conflict'),
          }}
        />
      )}
    </section>
  );
}
