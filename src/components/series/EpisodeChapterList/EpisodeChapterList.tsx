'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button, Tooltip } from 'antd';
import {
  CommentOutlined,
  FileTextFilled,
  FileTextOutlined,
} from '@ant-design/icons';
import { useSession } from 'next-auth/react';
import { CommentsList } from '@/components/common/CommentsList';
import { SpoilerGate } from '@/components/common/SpoilerGate/SpoilerGate';
import { EpisodeNoteModal } from '../EpisodeNoteModal/EpisodeNoteModal';
import { WatchedToggle } from '../WatchedToggle/WatchedToggle';
import { useSeriesUserStatus } from '../SeriesUserStatusProvider';
import { useMarkEpisodes } from '@/hooks/useMarkEpisodes';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { chapterCode, groupIntoChapters } from '@/lib/episode-chapters';
import './EpisodeChapterList.css';

interface ChapterListEpisode {
  id: number;
  episodeNumber: number;
  title?: string | null;
  duration?: number | null;
  synopsis?: string | null;
  _count?: { comments: number };
}

interface EpisodeChapterListProps {
  seasonNumber: number;
  episodes: ChapterListEpisode[];
}

/**
 * Los episodios de una temporada en la ficha, contados por capitulo como en
 * /ver y en el seguimiento. Un capitulo de YouTube viene en partes: se marca
 * entero, y sus comentarios y notas van en la primera parte.
 */
export function EpisodeChapterList({
  seasonNumber,
  episodes,
}: EpisodeChapterListProps) {
  const { t } = useLocale();
  const { data: session } = useSession();
  const { episodeStatus } = useSeriesUserStatus();
  const { setWatched, pendingKey, ready } = useMarkEpisodes();
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [noteEpisode, setNoteEpisode] = useState<{
    id: number;
    label: string;
  } | null>(null);
  const [episodesWithNotes, setEpisodesWithNotes] = useState<Set<number>>(
    new Set()
  );

  const { chapters, extras, byTitle } = useMemo(
    () =>
      groupIntoChapters(
        episodes.map((episode) => ({ ...episode, seasonNumber }))
      ),
    [episodes, seasonNumber]
  );

  const userId = session?.user?.id;
  const anchorIds = chapters.map((chapter) => chapter.episodes[0].id).join(',');
  useEffect(() => {
    if (!userId || !anchorIds) return;
    let cancelled = false;
    fetch(`/api/episodes/notes-summary?ids=${anchorIds}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { episodeIds?: number[] } | null) => {
        if (!cancelled && data?.episodeIds) {
          setEpisodesWithNotes(new Set(data.episodeIds));
        }
      })
      .catch(() => null);
    return () => {
      cancelled = true;
    };
  }, [userId, anchorIds]);

  if (chapters.length === 0) {
    return (
      <div className="episode-chapters">
        <p className="episode-chapters__empty">
          {t('episodesList.emptyTextUser')}
        </p>
      </div>
    );
  }

  return (
    <div className="episode-chapters">
      <h5 className="season-section-title">
        {t('episodesList.headerTitle', { n: chapters.length })}
      </h5>

      <ol className="episode-chapters__list">
        {chapters.map((chapter) => {
          const key = `${chapter.seasonNumber}-${chapter.number}`;
          const anchor = chapter.episodes[0];
          const ids = chapter.episodes.map((episode) => episode.id);
          const watched = ids.every((id) => episodeStatus[id] === 'VISTA');
          // En videos de YouTube el titulo es el de la serie: no suma.
          const title = byTitle ? null : anchor.title;
          const parts = chapter.episodes.length;
          const minutes = chapter.episodes.every((episode) => episode.duration)
            ? chapter.episodes.reduce((sum, ep) => sum + (ep.duration ?? 0), 0)
            : null;
          const comments = chapter.episodes.reduce(
            (sum, episode) => sum + (episode._count?.comments ?? 0),
            0
          );
          const markLabel = t('verSerie.markChapter', { n: chapter.number });
          const expanded = expandedKey === key;
          const hasNote = episodesWithNotes.has(anchor.id);

          return (
            <li
              key={key}
              className={`episode-chapters__item${
                watched ? ' episode-chapters__item--watched' : ''
              }`}
            >
              <div className="episode-chapters__row">
                <WatchedToggle
                  label={String(chapter.number)}
                  ariaLabel={markLabel}
                  hint={
                    watched
                      ? t('verSerie.unmarkChapter', { n: chapter.number })
                      : markLabel
                  }
                  watched={watched}
                  loading={pendingKey === key}
                  disabled={!ready}
                  onToggle={() => void setWatched(key, ids, !watched)}
                />

                <div className="episode-chapters__info">
                  {title && (
                    <span className="episode-chapters__title">{title}</span>
                  )}
                  {(parts > 1 || minutes) && (
                    <span className="episode-chapters__meta">
                      {parts > 1 && t('episodesList.parts', { n: parts })}
                      {parts > 1 && minutes ? ' · ' : ''}
                      {minutes ? `${minutes} min` : ''}
                    </span>
                  )}
                </div>

                <div className="episode-chapters__actions">
                  <Tooltip
                    title={t('episodesList.tooltipComments', { n: comments })}
                  >
                    <Button
                      type="text"
                      size="small"
                      icon={<CommentOutlined />}
                      aria-expanded={expanded}
                      aria-label={t('episodesList.tooltipComments', {
                        n: comments,
                      })}
                      className={
                        expanded ? 'episode-chapters__action--active' : ''
                      }
                      onClick={() => setExpandedKey(expanded ? null : key)}
                    >
                      {comments > 0 ? comments : null}
                    </Button>
                  </Tooltip>
                  {session?.user && (
                    <Tooltip title={t('episodeNote.tooltipOpen')}>
                      <Button
                        type="text"
                        size="small"
                        icon={
                          hasNote ? <FileTextFilled /> : <FileTextOutlined />
                        }
                        aria-label={t('episodeNote.tooltipOpen')}
                        className={
                          hasNote ? 'episode-chapters__action--active' : ''
                        }
                        onClick={() =>
                          setNoteEpisode({
                            id: anchor.id,
                            label: title
                              ? `${chapterCode(chapter)} — ${title}`
                              : chapterCode(chapter),
                          })
                        }
                      />
                    </Tooltip>
                  )}
                </div>
              </div>

              {anchor.synopsis && (
                <SpoilerGate
                  hide={!watched}
                  cacheKey={`ep-synopsis-${anchor.id}`}
                  reason={t('episodesList.spoilerGateReasonEpisodeNotWatched')}
                >
                  <p
                    className={`episode-chapters__synopsis${
                      expanded ? '' : ' episode-chapters__synopsis--clamped'
                    }`}
                  >
                    {anchor.synopsis}
                  </p>
                </SpoilerGate>
              )}

              {expanded && (
                <div className="episode-chapters__comments">
                  <CommentsList
                    episodeId={anchor.id}
                    placeholder={t('episodesList.commentsPlaceholder')}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {extras.length > 0 && (
        <p className="episode-chapters__extras">
          {t('episodesList.extrasNote', { n: extras.length })}
        </p>
      )}

      <EpisodeNoteModal
        episodeId={noteEpisode?.id ?? null}
        episodeLabel={noteEpisode?.label}
        open={noteEpisode !== null}
        onClose={() => setNoteEpisode(null)}
        onNoteChange={(saved) => {
          if (!noteEpisode) return;
          setEpisodesWithNotes((prev) => {
            const next = new Set(prev);
            if (saved) next.add(noteEpisode.id);
            else next.delete(noteEpisode.id);
            return next;
          });
        }}
      />
    </div>
  );
}
