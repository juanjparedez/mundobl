'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, Empty, Spin, Progress, Tag, Button } from 'antd';
import {
  PlayCircleOutlined,
  ClockCircleOutlined,
  CloseOutlined,
  EditOutlined,
} from '@ant-design/icons';
import Image from 'next/image';
import Link from 'next/link';
import { useMessage } from '@/hooks/useMessage';
import './CurrentlyWatchingDashboard.css';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { interpolateMessage } from '@/lib/i18n-format';

interface WatchingSeriesData {
  id: number;
  status: string;
  lastWatchedAt: Date | null;
  series: {
    id: number;
    title: string;
    originalTitle?: string | null;
    year?: number | null;
    type: string;
    imageUrl?: string | null;
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

export function CurrentlyWatchingDashboard() {
  const { data: session } = useSession();
  const message = useMessage();
  const { t } = useLocale();
  const [loading, setLoading] = useState(true);
  const [notAuthenticated, setNotAuthenticated] = useState(false);
  const [watchingSeries, setWatchingSeries] = useState<WatchingSeriesData[]>(
    []
  );

  const isAdminOrMod =
    session?.user?.role === 'ADMIN' || session?.user?.role === 'MODERATOR';

  useEffect(() => {
    loadWatchingSeries();
  }, []);

  const loadWatchingSeries = async () => {
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
            seasonNumber: season.seasonNumber,
            episodeNumber: episode.episodeNumber,
            title: episode.title,
          };
        }
      }
    }
    return null;
  };

  const formatLastWatched = (date: Date | null) => {
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

      if (!response.ok) throw new Error('Error al actualizar');

      // Remover de la lista local
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

  if (loading) {
    return (
      <div className="watching-dashboard__loading">
        <Spin size="large" />
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
      <div className="watching-grid">
        {watchingSeries.map((item) => {
          const { totalEpisodes, watchedEpisodes } = calculateProgress(
            item.series
          );
          const progress =
            totalEpisodes > 0 ? (watchedEpisodes / totalEpisodes) * 100 : 0;
          const nextEp = getNextEpisode(item.series);

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
                      width={400}
                      height={225}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
                      quality={65}
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
                  handleRemoveFromWatching(item.series.id, item.series.title);
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
                          {t('watchingDashboard.nextLabel')}: T
                          {nextEp.seasonNumber}E{nextEp.episodeNumber}
                          {nextEp.title && ` - ${nextEp.title}`}
                        </span>
                      </div>
                    )}

                    <div className="watching-card__last-watched">
                      <ClockCircleOutlined className="watching-card__icon" />
                      <span>{formatLastWatched(item.lastWatchedAt)}</span>
                    </div>

                    <div className="watching-card__actions">
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
                        <Link href={`/admin/series/${item.series.id}/editar`}>
                          <Button
                            icon={<EditOutlined />}
                            title={t('watchingDashboard.editButton')}
                          >
                            {t('watchingDashboard.editButton')}
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                }
              />
            </Card>
          );
        })}
      </div>
    </div>
  );
}
