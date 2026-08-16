'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, Empty, Progress, Tag, Button, Tooltip, Select } from 'antd';
import {
  PlayCircleOutlined,
  ClockCircleOutlined,
  CloseOutlined,
  EditOutlined,
  CheckOutlined,
  CalendarOutlined,
  FileTextOutlined,
  FileTextFilled,
} from '@ant-design/icons';
import Image from 'next/image';
import Link from 'next/link';
import { useMessage } from '@/hooks/useMessage';
import { isSupabaseImageUrl } from '@/lib/image-helpers';
import { SerieCardSkeleton } from '@/components/common/SerieCardSkeleton/SerieCardSkeleton';
import { SeriesNoteModal } from '@/components/series/SeriesNoteModal/SeriesNoteModal';
import './CurrentlyWatchingDashboard.css';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { interpolateMessage } from '@/lib/i18n-format';

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
    airDays?: string | null;
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

interface AirDayStatus {
  type: 'today' | 'delayed_1' | 'delayed_2' | 'delayed_3_plus';
  label: string;
  color: 'success' | 'warning' | 'error';
  tagText: string;
  daysDiff: number;
}

const DAY_MAP: Record<string, number> = {
  domingo: 0,
  dom: 0,
  sunday: 0,
  sun: 0,
  lunes: 1,
  lun: 1,
  monday: 1,
  mon: 1,
  martes: 2,
  mar: 2,
  tuesday: 2,
  tue: 2,
  miercoles: 3,
  miércoles: 3,
  mie: 3,
  mié: 3,
  wednesday: 3,
  wed: 3,
  jueves: 4,
  jue: 4,
  thursday: 4,
  thu: 4,
  viernes: 5,
  vie: 5,
  friday: 5,
  fri: 5,
  sabado: 6,
  sábado: 6,
  sab: 6,
  sáb: 6,
  saturday: 6,
  sat: 6,
};

function getAirDayStatus(
  airDays: string | null | undefined,
  isFullyWatched: boolean
): AirDayStatus | null {
  if (!airDays || isFullyWatched) return null;

  const rawTokens = airDays
    .toLowerCase()
    .split(/[,;\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const targetDays: number[] = [];
  for (const token of rawTokens) {
    if (token in DAY_MAP) {
      targetDays.push(DAY_MAP[token]);
    }
  }

  if (targetDays.length === 0) return null;

  const today = new Date().getDay(); // 0 = Sunday .. 6 = Saturday

  // Calcular la menor cantidad de días transcurridos desde el día de emisión más reciente
  let minElapsed = 7;
  for (const day of targetDays) {
    const elapsed = (today - day + 7) % 7;
    if (elapsed < minElapsed) {
      minElapsed = elapsed;
    }
  }

  if (minElapsed === 0) {
    return {
      type: 'today',
      label: 'Hoy toca capítulo',
      color: 'success',
      tagText: '🟢 Hoy',
      daysDiff: 0,
    };
  }
  if (minElapsed === 1) {
    return {
      type: 'delayed_1',
      label: 'Ayer emitió (1d atrasado)',
      color: 'warning',
      tagText: '🟡 +1d',
      daysDiff: 1,
    };
  }
  if (minElapsed === 2) {
    return {
      type: 'delayed_2',
      label: '2 días atrasado',
      color: 'warning',
      tagText: '🟡 +2d',
      daysDiff: 2,
    };
  }
  return {
    type: 'delayed_3_plus',
    label: `${minElapsed} días atrasado`,
    color: 'error',
    tagText: `🔴 +${minElapsed}d`,
    daysDiff: minElapsed,
  };
}

export function CurrentlyWatchingDashboard() {
  const { data: session } = useSession();
  const message = useMessage();
  const { t } = useLocale();
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

  const calculateProgress = (series: WatchingSeriesData['series']) => {
    let totalEpisodes = 0;
    let watchedEpisodes = 0;

    series.seasons?.forEach((season) => {
      season.episodes?.forEach((episode) => {
        totalEpisodes++;
        if (episode.viewStatus?.[0]?.status === 'VISTA') {
          watchedEpisodes++;
        }
      });
    });

    return { totalEpisodes, watchedEpisodes };
  };

  const getNextEpisode = (series: WatchingSeriesData['series']) => {
    for (const season of series.seasons || []) {
      for (const episode of season.episodes || []) {
        if (episode.viewStatus?.[0]?.status !== 'VISTA') {
          return {
            id: episode.id,
            seasonNumber: season.seasonNumber,
            episodeNumber: episode.episodeNumber,
            title: episode.title,
          };
        }
      }
    }
    return null;
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
    episodeId: number,
    seriesId: number,
    label: string
  ) => {
    setMarkingEpisode(episodeId);
    try {
      const response = await fetch(`/api/episodes/${episodeId}/view-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'VISTA' }),
      });

      if (!response.ok)
        throw new Error(t('watchingDashboard.errorMarkEpisode'));

      message.success(
        interpolateMessage(t('watchingDashboard.episodeMarkedMessage'), {
          ep: label,
        })
      );
      // Reload to get updated progress
      await loadWatchingSeries();
    } catch (error) {
      message.error(t('watchingDashboard.errorMarkEpisode'));
      console.error(error);
    } finally {
      setMarkingEpisode(null);
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
          const airA = getAirDayStatus(a.series.airDays, watA === totA);
          const airB = getAirDayStatus(b.series.airDays, watB === totB);
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
            📺 Viendo {watchingSeries.length}{' '}
            {watchingSeries.length === 1 ? 'serie' : 'series'}
          </Tag>
        </div>

        <div className="watching-header__controls">
          <span className="watching-header__sort-label">Ordenar por:</span>
          <Select
            value={sortBy}
            onChange={handleSortChange}
            className="watching-header__sort-select"
            options={[
              { value: 'lastWatched', label: '🕒 Última actividad' },
              { value: 'name', label: '🔤 Nombre (A-Z)' },
              { value: 'start', label: '📅 Fecha de estreno' },
              { value: 'next', label: '▶️ Próxima por ver' },
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
          const nextEpLabel = nextEp
            ? `T${nextEp.seasonNumber}E${nextEp.episodeNumber}`
            : null;
          const airStatus = getAirDayStatus(
            item.series.airDays,
            isFullyWatched
          );

          return (
            <Card
              key={item.series.id}
              className="watching-card"
              hoverable
              cover={
                item.series.imageUrl ? (
                  <div className="watching-card__image">
                    <Image
                      src={item.series.imageUrl}
                      alt={item.series.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
                      quality={65}
                      unoptimized={isSupabaseImageUrl(item.series.imageUrl)}
                      className="watching-card__cover"
                    />
                  </div>
                ) : null
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
                  <Link href={`/series/${item.series.id}`}>
                    <span className="watching-card__title">
                      {item.series.title}
                    </span>
                  </Link>
                }
                description={
                  <div className="watching-card__info">
                    <div className="watching-card__meta">
                      {item.series.year && (
                        <Tag color="blue">{item.series.year}</Tag>
                      )}
                      {item.series.country && (
                        <Tag>{item.series.country.name}</Tag>
                      )}
                      {airStatus && (
                        <Tooltip
                          title={`Día(s) de emisión: ${item.series.airDays} (${airStatus.label})`}
                        >
                          <Tag
                            color={airStatus.color}
                            className={`watching-card__air-tag watching-card__air-tag--${airStatus.type}`}
                          >
                            <CalendarOutlined /> {airStatus.tagText}
                          </Tag>
                        </Tooltip>
                      )}
                    </div>

                    <Progress
                      percent={Math.round(progress)}
                      size="small"
                      status={progress === 100 ? 'success' : 'active'}
                      format={() => `${watchedEpisodes}/${totalEpisodes}`}
                      className="watching-card__progress"
                    />

                    {nextEp && (
                      <div className="watching-card__next">
                        <PlayCircleOutlined className="watching-card__icon" />
                        <span>
                          {t('watchingDashboard.nextLabel')}: {nextEpLabel}
                          {nextEp.title && ` - ${nextEp.title}`}
                        </span>
                      </div>
                    )}

                    <div className="watching-card__last-watched">
                      <ClockCircleOutlined className="watching-card__icon" />
                      <span>{formatLastWatched(item.lastWatchedAt)}</span>
                    </div>

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
                      {nextEp && (
                        <Tooltip
                          title={interpolateMessage(
                            t('watchingDashboard.markEpisodeTooltip'),
                            { ep: nextEpLabel ?? '' }
                          )}
                        >
                          <Button
                            icon={<CheckOutlined />}
                            loading={markingEpisode === nextEp.id}
                            onClick={() =>
                              void handleMarkNextEpisode(
                                nextEp.id,
                                item.series.id,
                                nextEpLabel ?? ''
                              )
                            }
                            className="watching-card__mark-btn"
                          >
                            {nextEpLabel}
                          </Button>
                        </Tooltip>
                      )}
                      <Link
                        href={`/series/${item.series.id}`}
                        className="watching-card__action-link"
                      >
                        <Button type="primary" block>
                          {progress === 100
                            ? t('watchingDashboard.detailsButton')
                            : t('watchingDashboard.continueButton')}
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
