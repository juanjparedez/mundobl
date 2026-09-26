'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  Card,
  Empty,
  Progress,
  Tag,
  Button,
  Tooltip,
  Select,
  Popconfirm,
} from 'antd';
import {
  PlayCircleOutlined,
  ClockCircleOutlined,
  CloseOutlined,
  EditOutlined,
  CheckOutlined,
  CalendarOutlined,
  FileTextOutlined,
  HistoryOutlined,
  FileTextFilled,
  InfoCircleOutlined,
} from '@ant-design/icons';
import Image from 'next/image';
import Link from 'next/link';
import { useMessage } from '@/hooks/useMessage';
import { isDirectServedImageUrl, cardImageUrl } from '@/lib/image-helpers';
import { SerieCardSkeleton } from '@/components/common/SerieCardSkeleton/SerieCardSkeleton';
import { SeriesNoteModal } from '@/components/series/SeriesNoteModal/SeriesNoteModal';
import { getSeriesUrl, getVerUrl } from '@/lib/slug';
import { findNextEpisode } from '@/lib/episode-progress';
import { chapterCode, groupIntoChapters } from '@/lib/episode-chapters';
import './CurrentlyWatchingDashboard.css';
import { useLocale } from '@/lib/providers/LocaleProvider';
import type { TranslationKey } from '@/i18n/messages';
import { interpolateMessage } from '@/lib/i18n-format';
import {
  getAirDayStatus,
  isAiringNow,
  type AirDayStatus,
  type AirDayStatusType,
} from '@/lib/airing-schedule';
import { PosterPlaceholder } from '@/components/common/PosterPlaceholder/PosterPlaceholder';

interface WatchingSeriesData {
  id: number;
  status: string;
  lastWatchedAt: Date | string | null;
  series: {
    id: number;
    title: string;
    originalTitle?: string | null;
    year?: number | null;
    type: string;
    imageUrl?: string | null;
    imageThumbUrl?: string | null;
    airDays?: string | null;
    hasWatchableEpisode?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    country?: {
      name: string;
    } | null;
    seasons?: Array<{
      id: number;
      seasonNumber: number;
      episodes?: Array<{
        id: number;
        episodeNumber: number;
        title?: string | null;
        viewStatus?: Array<{
          status: string;
        }>;
      }>;
    }>;
  };
}

type SortOption = 'lastWatched' | 'name' | 'start' | 'next';

// El semaforo de emision vive en `src/lib/airing-schedule.ts` y devuelve solo datos.
// Color y texto se resuelven aca: el color es presentacion y el texto va por i18n.
const AIR_STATUS_COLOR: Record<
  AirDayStatusType,
  'processing' | 'success' | 'warning' | 'error'
> = {
  up_to_date: 'processing',
  today: 'success',
  delayed_1: 'warning',
  delayed_2: 'warning',
  delayed_3_plus: 'error',
};

const STATUS_KEY = {
  up_to_date: 'airDayStatus.upToDate',
  today: 'airDayStatus.today',
  delayed_1: 'airDayStatus.delayed1',
  delayed_2: 'airDayStatus.delayed2',
  delayed_3_plus: 'airDayStatus.delayedMany',
} as const satisfies Record<AirDayStatusType, TranslationKey>;

const AIR_STATUS_DOT: Record<AirDayStatusType, string> = {
  up_to_date: '✅',
  today: '\u{1F7E2}',
  delayed_1: '\u{1F7E1}',
  delayed_2: '\u{1F7E1}',
  delayed_3_plus: '\u{1F534}',
};

const isChapterWatched = (chapter: { episodes: Array<{ watched: boolean }> }) =>
  chapter.episodes.every((episode) => episode.watched);

function buildChapters(series: WatchingSeriesData['series']) {
  return groupIntoChapters(
    (series.seasons ?? []).flatMap((season) =>
      (season.episodes ?? []).map((episode) => ({
        id: episode.id,
        seasonNumber: season.seasonNumber,
        episodeNumber: episode.episodeNumber,
        title: episode.title ?? null,
        watched: episode.viewStatus?.[0]?.status === 'VISTA',
      }))
    )
  );
}

// Por objeto: el orden "siguiente" pide los capitulos de cada serie varias
// veces por render, y un marcado optimista crea un objeto nuevo.
const chapterCache = new WeakMap<
  WatchingSeriesData['series'],
  ReturnType<typeof buildChapters>
>();

function chaptersOf(series: WatchingSeriesData['series']) {
  let cached = chapterCache.get(series);
  if (!cached) {
    cached = buildChapters(series);
    chapterCache.set(series, cached);
  }
  return cached;
}

export function CurrentlyWatchingDashboard() {
  const { data: session } = useSession();
  const message = useMessage();
  const { t } = useLocale();

  // Etiquetas del semaforo de emision. `airing-schedule.ts` devuelve solo `type` y
  // `daysDiff`; el texto se arma aca porque este componente esta traducido a 10 idiomas.
  const airStatusLabel = useCallback(
    (status: AirDayStatus) =>
      t(STATUS_KEY[status.type], { days: status.daysDiff }),
    [t]
  );

  const airStatusTag = useCallback(
    (status: AirDayStatus) => {
      if (status.type === 'up_to_date') return t('airDayStatus.tagUpToDate');
      if (status.type === 'today') return t('airDayStatus.tagToday');
      return t('airDayStatus.tagDelayed', { days: status.daysDiff });
    },
    [t]
  );
  const [loading, setLoading] = useState(true);
  const [notAuthenticated, setNotAuthenticated] = useState(false);
  const [watchingSeries, setWatchingSeries] = useState<WatchingSeriesData[]>(
    []
  );
  const [markingEpisode, setMarkingEpisode] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>(() => {
    if (typeof window === 'undefined') return 'lastWatched';
    return (
      (window.localStorage.getItem('watching-sort-by') as SortOption) ||
      'lastWatched'
    );
  });
  const [noteSeriesId, setNoteSeriesId] = useState<number | null>(null);
  // Marca local de que series tienen nota privada (para refrescar el icono
  // al crear/borrar sin recargar toda la lista).
  const [seriesWithNotes, setSeriesWithNotes] = useState<Set<number>>(
    new Set()
  );

  const isAdminOrMod =
    session?.user?.role === 'ADMIN' || session?.user?.role === 'MODERATOR';

  const loadWatchingSeries = useCallback(async () => {
    try {
      const response = await fetch('/api/currently-watching');
      if (response.status === 401) {
        setNotAuthenticated(true);
        return;
      }
      const data = await response.json();
      setWatchingSeries(data);
    } catch (error) {
      console.error('Error loading watching series:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadWatchingSeries();
  }, [loadWatchingSeries]);

  // Carga en bulk que series (de las que se estan viendo) tienen nota
  // privada, para pintar el icono sin una request por card.
  const userId = session?.user?.id;
  useEffect(() => {
    if (!userId || watchingSeries.length === 0) return;
    const ids = watchingSeries.map((w) => w.series.id).join(',');
    let cancelled = false;
    fetch(`/api/series/notes-summary?ids=${ids}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { seriesIds?: number[] } | null) => {
        if (!cancelled && data?.seriesIds) {
          setSeriesWithNotes(new Set(data.seriesIds));
        }
      })
      .catch(() => null);
    return () => {
      cancelled = true;
    };
    // Solo re-correr si cambia el usuario o la lista de series.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, watchingSeries.map((w) => w.series.id).join(',')]);

  const handleSortChange = (newSort: SortOption) => {
    setSortBy(newSort);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('watching-sort-by', newSort);
    }
  };

  // Por capitulos, no por filas: un capitulo de YouTube viene en partes.
  const calculateProgress = (series: WatchingSeriesData['series']) => {
    const { chapters } = chaptersOf(series);
    return {
      totalEpisodes: chapters.length,
      watchedEpisodes: chapters.filter(isChapterWatched).length,
    };
  };

  const getNextEpisode = (series: WatchingSeriesData['series']) => {
    const { chapters, byTitle } = chaptersOf(series);
    const next = findNextEpisode(chapters, isChapterWatched);
    if (!next) return null;
    const first = next.episodes[0];
    return {
      id: first.id,
      seasonNumber: next.seasonNumber,
      number: next.number,
      // El ?e= de /ver apunta a la primera parte.
      episodeNumber: first.episodeNumber,
      title: byTitle ? null : first.title,
      episodeIds: next.episodes.map((episode) => episode.id),
    };
  };

  const formatLastWatched = (date: Date | string | null) => {
    if (!date) return t('common.neverWatched');
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('common.justNow');
    if (diffMins < 60)
      return interpolateMessage(t('common.minutesAgo'), {
        n: String(diffMins),
      });
    if (diffHours < 24)
      return interpolateMessage(t('common.hoursAgo'), { n: String(diffHours) });
    if (diffDays === 1) return t('common.yesterday');
    if (diffDays < 7)
      return interpolateMessage(t('common.daysAgo'), { n: String(diffDays) });
    return d.toLocaleDateString();
  };

  const handleRemoveFromWatching = async (
    seriesId: number,
    seriesTitle: string
  ) => {
    try {
      const response = await fetch(`/api/series/${seriesId}/view-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'SIN_VER' }),
      });

      if (!response.ok) throw new Error(t('watchingDashboard.errorRemove'));

      setWatchingSeries((prev) =>
        prev.filter((item) => item.series.id !== seriesId)
      );
      message.success(
        interpolateMessage(t('watchingDashboard.removedMessage'), {
          title: seriesTitle,
        })
      );
    } catch (error) {
      message.error(t('watchingDashboard.errorRemove'));
      console.error(error);
    }
  };

  const handleMarkNextEpisode = async (
    episodeIds: number[],
    seriesId: number,
    label: string
  ) => {
    setMarkingEpisode(episodeIds[0]);
    const marked = new Set(episodeIds);

    // Optimista: marca el capitulo (todas sus partes) como VISTA en el estado
    // local antes de la respuesta, asi la card pasa al siguiente sin esperar.
    const previousSeries = watchingSeries;
    setWatchingSeries((prev) =>
      prev.map((item) =>
        item.series.id === seriesId
          ? {
              ...item,
              series: {
                ...item.series,
                seasons: item.series.seasons?.map((season) => ({
                  ...season,
                  episodes: season.episodes?.map((ep) =>
                    marked.has(ep.id)
                      ? { ...ep, viewStatus: [{ status: 'VISTA' }] }
                      : ep
                  ),
                })),
              },
            }
          : item
      )
    );

    try {
      const response = await fetch(`/api/series/${seriesId}/watched`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ episodeIds, watched: true }),
      });

      if (!response.ok)
        throw new Error(t('watchingDashboard.errorMarkEpisode'));

      // Marcar actualiza lastWatchedAt en el server (T03); aca se refleja
      // para que el orden "última actividad" suba la card sin recargar.
      const lastWatchedAt = new Date().toISOString();
      setWatchingSeries((prev) =>
        prev.map((item) =>
          item.series.id === seriesId ? { ...item, lastWatchedAt } : item
        )
      );

      message.success(
        interpolateMessage(t('watchingDashboard.episodeMarkedMessage'), {
          ep: label,
        })
      );
    } catch (error) {
      setWatchingSeries(previousSeries);
      message.error(t('watchingDashboard.errorMarkEpisode'));
      console.error(error);
    } finally {
      setMarkingEpisode(null);
    }
  };

  const handleMarkSeriesComplete = async (
    seriesId: number,
    seriesTitle: string
  ) => {
    const previousSeries = watchingSeries;
    setWatchingSeries((prev) =>
      prev.filter((item) => item.series.id !== seriesId)
    );

    try {
      const response = await fetch(`/api/series/${seriesId}/view-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'VISTA' }),
      });

      if (!response.ok)
        throw new Error(t('watchingDashboard.errorMarkEpisode'));

      message.success(
        interpolateMessage(t('watchingDashboard.completedMessage'), {
          title: seriesTitle,
        })
      );
    } catch (error) {
      setWatchingSeries(previousSeries);
      message.error(t('watchingDashboard.errorMarkEpisode'));
      console.error(error);
    }
  };

  // Ordenamiento dinámico
  const sortedWatchingSeries = useMemo(() => {
    const list = [...watchingSeries];

    switch (sortBy) {
      case 'name':
        return list.sort((a, b) =>
          a.series.title.localeCompare(b.series.title, undefined, {
            sensitivity: 'base',
          })
        );
      case 'start':
        return list.sort((a, b) => {
          const yearA = a.series.year ?? 0;
          const yearB = b.series.year ?? 0;
          if (yearA !== yearB) return yearB - yearA;
          const dateA = a.series.createdAt
            ? new Date(a.series.createdAt).getTime()
            : 0;
          const dateB = b.series.createdAt
            ? new Date(b.series.createdAt).getTime()
            : 0;
          return dateB - dateA;
        });
      case 'next':
        return list.sort((a, b) => {
          const nextA = getNextEpisode(a.series);
          const nextB = getNextEpisode(b.series);
          // Si una tiene próximo episodio y otra ya terminó, priorizar la que tiene pendiente
          if (nextA && !nextB) return -1;
          if (!nextA && nextB) return 1;

          // Si ambas tienen pendiente, priorizar por semáforo de emisión (hoy / atrasadas primero)
          const { totalEpisodes: totA, watchedEpisodes: watA } =
            calculateProgress(a.series);
          const { totalEpisodes: totB, watchedEpisodes: watB } =
            calculateProgress(b.series);
          const airA = getAirDayStatus(a.series, watA === totA);
          const airB = getAirDayStatus(b.series, watB === totB);
          if (airA && !airB) return -1;
          if (!airA && airB) return 1;

          return a.series.title.localeCompare(b.series.title);
        });
      case 'lastWatched':
      default:
        return list.sort((a, b) => {
          const timeA = a.lastWatchedAt
            ? new Date(a.lastWatchedAt).getTime()
            : 0;
          const timeB = b.lastWatchedAt
            ? new Date(b.lastWatchedAt).getTime()
            : 0;
          return timeB - timeA;
        });
    }
  }, [watchingSeries, sortBy]);

  if (loading) {
    return (
      <div className="watching-grid" aria-busy="true">
        <SerieCardSkeleton count={6} />
      </div>
    );
  }

  if (notAuthenticated) {
    return (
      <Empty
        description={t('watchingDashboard.loginPrompt')}
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }

  if (watchingSeries.length === 0) {
    return (
      <Empty
        description={t('watchingDashboard.emptyText')}
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      >
        <Link href="/catalogo">
          <Button type="primary">
            {t('watchingDashboard.exploreCatalog')}
          </Button>
        </Link>
      </Empty>
    );
  }

  return (
    <div className="watching-dashboard">
      {/* Barra de control: Contador + Ordenamiento */}
      <div className="watching-header">
        <div className="watching-header__lead">
          <Tag color="blue" className="watching-header__count-badge">
            📺{' '}
            {watchingSeries.length === 1
              ? t('watchingDashboard.countOne')
              : interpolateMessage(t('watchingDashboard.countMany'), {
                  n: String(watchingSeries.length),
                })}
          </Tag>
        </div>

        <div className="watching-header__controls">
          <span className="watching-header__sort-label">
            {t('watchingDashboard.sortLabel')}
          </span>
          <Select
            value={sortBy}
            onChange={handleSortChange}
            className="watching-header__sort-select"
            options={[
              {
                value: 'lastWatched',
                label: `🕒 ${t('watchingDashboard.sortLastWatched')}`,
              },
              { value: 'name', label: `🔤 ${t('watchingDashboard.sortName')}` },
              {
                value: 'start',
                label: `📅 ${t('watchingDashboard.sortStart')}`,
              },
              { value: 'next', label: `▶️ ${t('watchingDashboard.sortNext')}` },
            ]}
          />
        </div>
      </div>

      <div className="watching-grid">
        {sortedWatchingSeries.map((item) => {
          const { totalEpisodes, watchedEpisodes } = calculateProgress(
            item.series
          );
          const progress =
            totalEpisodes > 0 ? (watchedEpisodes / totalEpisodes) * 100 : 0;
          const isFullyWatched = progress === 100 && totalEpisodes > 0;
          const nextEp = getNextEpisode(item.series);
          const nextEpLabel = nextEp ? chapterCode(nextEp) : null;
          // Con una sola temporada "ep. 4" alcanza; con varias, "T2·E3".
          const multiSeason = (item.series.seasons?.length ?? 0) > 1;
          const markNextText = nextEp
            ? multiSeason
              ? interpolateMessage(t('watchingDashboard.markNextCode'), {
                  code: chapterCode(nextEp),
                })
              : interpolateMessage(t('watchingDashboard.markNextLabel'), {
                  n: String(nextEp.number),
                })
            : '';
          const airStatus = getAirDayStatus(item.series, isFullyWatched);
          // Si sigue saliendo, llegar al ultimo capitulo es estar al dia:
          // "Terminé la serie" queda disponible, pero deja de ser la accion
          // principal de la tarjeta.
          const airing = isAiringNow(item.series);

          return (
            <Card
              key={item.series.id}
              className="watching-card"
              hoverable
              cover={
                cardImageUrl(item.series) ? (
                  <div className="watching-card__image">
                    <Image
                      src={cardImageUrl(item.series)!}
                      alt={item.series.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
                      quality={65}
                      unoptimized={isDirectServedImageUrl(
                        cardImageUrl(item.series)
                      )}
                      className="watching-card__cover"
                    />
                  </div>
                ) : (
                  <div className="watching-card__image">
                    <PosterPlaceholder
                      title={item.series.title}
                      variant="card"
                    />
                  </div>
                )
              }
            >
              <Button
                type="text"
                danger
                icon={<CloseOutlined />}
                className="watching-card__remove-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  void handleRemoveFromWatching(
                    item.series.id,
                    item.series.title
                  );
                }}
                title={t('watchingDashboard.removeTitle')}
              />
              <Card.Meta
                title={
                  <Link href={getSeriesUrl(item.series.id, item.series.title)}>
                    <span className="watching-card__title">
                      {item.series.title}
                    </span>
                  </Link>
                }
                description={
                  <div className="watching-card__info">
                    <div className="watching-card__meta">
                      {item.status === 'RETOMAR' && (
                        <Tag color="orange" icon={<HistoryOutlined />}>
                          {t('viewStatus.retomar')}
                        </Tag>
                      )}
                      {item.series.year && (
                        <Tag color="blue">{item.series.year}</Tag>
                      )}
                      {item.series.country && (
                        <Tag>{item.series.country.name}</Tag>
                      )}
                      {airStatus && (
                        <Tooltip
                          title={t('airDayStatus.airDaysTooltip', {
                            days: item.series.airDays ?? '',
                            status: airStatusLabel(airStatus),
                          })}
                        >
                          <Tag
                            color={AIR_STATUS_COLOR[airStatus.type]}
                            className={`watching-card__air-tag watching-card__air-tag--${airStatus.type}`}
                          >
                            <CalendarOutlined />{' '}
                            {AIR_STATUS_DOT[airStatus.type]}{' '}
                            {airStatusTag(airStatus)}
                          </Tag>
                        </Tooltip>
                      )}
                    </div>

                    {totalEpisodes > 0 ? (
                      <Progress
                        percent={Math.round(progress)}
                        size="small"
                        status={progress === 100 ? 'success' : 'active'}
                        format={() => `${watchedEpisodes}/${totalEpisodes}`}
                        className="watching-card__progress"
                      />
                    ) : (
                      <div className="watching-card__next watching-card__next--hint">
                        <InfoCircleOutlined className="watching-card__icon" />
                        <span>{t('watchingDashboard.noEpisodesHint')}</span>
                      </div>
                    )}

                    {nextEp && (
                      <div className="watching-card__next">
                        <PlayCircleOutlined className="watching-card__icon" />
                        <span>
                          {t('watchingDashboard.nextLabel')}: {nextEpLabel}
                          {nextEp.title && ` — ${nextEp.title}`}
                        </span>
                      </div>
                    )}

                    <div className="watching-card__last-watched">
                      <ClockCircleOutlined className="watching-card__icon" />
                      <span>{formatLastWatched(item.lastWatchedAt)}</span>
                    </div>

                    {nextEp ? (
                      <Button
                        type="primary"
                        block
                        icon={<CheckOutlined />}
                        loading={markingEpisode === nextEp.id}
                        onClick={() =>
                          void handleMarkNextEpisode(
                            nextEp.episodeIds,
                            item.series.id,
                            nextEpLabel ?? ''
                          )
                        }
                        className="watching-card__primary-action"
                      >
                        {markNextText}
                      </Button>
                    ) : totalEpisodes > 0 ? (
                      <Popconfirm
                        title={interpolateMessage(
                          t('watchingDashboard.markCompleteConfirm'),
                          { title: item.series.title }
                        )}
                        onConfirm={() =>
                          void handleMarkSeriesComplete(
                            item.series.id,
                            item.series.title
                          )
                        }
                        okText={t('watchingDashboard.markCompleteLabel')}
                        cancelText={t('progressStepper.notYet')}
                      >
                        <Button
                          type={airing ? 'default' : 'primary'}
                          block
                          icon={<CheckOutlined />}
                          className="watching-card__primary-action"
                        >
                          {t('watchingDashboard.markCompleteLabel')}
                        </Button>
                      </Popconfirm>
                    ) : (
                      // Sin episodios cargados (cortos, peliculas): no hay
                      // progreso que perder, se marca completa de una vez.
                      <Button
                        type="primary"
                        block
                        icon={<CheckOutlined />}
                        className="watching-card__primary-action"
                        onClick={() =>
                          void handleMarkSeriesComplete(
                            item.series.id,
                            item.series.title
                          )
                        }
                      >
                        {t('watchingDashboard.markCompleteLabel')}
                      </Button>
                    )}

                    <div className="watching-card__actions">
                      {session?.user && (
                        <Tooltip title={t('seriesNote.tooltipOpen')}>
                          <Button
                            icon={
                              seriesWithNotes.has(item.series.id) ? (
                                <FileTextFilled />
                              ) : (
                                <FileTextOutlined />
                              )
                            }
                            shape="circle"
                            aria-label={t('seriesNote.tooltipOpen')}
                            onClick={() => setNoteSeriesId(item.series.id)}
                          />
                        </Tooltip>
                      )}
                      {item.series.hasWatchableEpisode && (
                        <Link
                          href={getVerUrl(
                            item.series.id,
                            item.series.title,
                            nextEp
                          )}
                          className="watching-card__action-link"
                        >
                          {/* Resume directo en /ver: no todas las series
                              tienen embed propio, por eso es condicional. */}
                          <Button
                            type="primary"
                            ghost
                            block
                            icon={<PlayCircleOutlined />}
                          >
                            {t('watchingDashboard.watchNow')}
                          </Button>
                        </Link>
                      )}
                      <Link
                        href={getSeriesUrl(item.series.id, item.series.title)}
                        className="watching-card__action-link"
                      >
                        {/* Es un link a la ficha, no una accion de tracking:
                            el boton dice exactamente eso. */}
                        <Button
                          type="default"
                          block
                          icon={<InfoCircleOutlined />}
                        >
                          {t('watchingDashboard.openSeries')}
                        </Button>
                      </Link>
                      {isAdminOrMod && (
                        <Tooltip title={t('watchingDashboard.editButton')}>
                          <Link href={`/admin/series/${item.series.id}/editar`}>
                            <Button
                              icon={<EditOutlined />}
                              shape="circle"
                              aria-label={t('watchingDashboard.editButton')}
                            />
                          </Link>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                }
              />
            </Card>
          );
        })}
      </div>

      <SeriesNoteModal
        seriesId={noteSeriesId}
        seriesLabel={
          watchingSeries.find((w) => w.series.id === noteSeriesId)?.series.title
        }
        open={noteSeriesId !== null}
        onClose={() => setNoteSeriesId(null)}
        onNoteChange={(hasNote) => {
          if (noteSeriesId === null) return;
          setSeriesWithNotes((prev) => {
            const next = new Set(prev);
            if (hasNote) next.add(noteSeriesId);
            else next.delete(noteSeriesId);
            return next;
          });
        }}
      />
    </div>
  );
}
