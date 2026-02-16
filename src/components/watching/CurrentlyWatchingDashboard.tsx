'use client';

import { useEffect, useState } from 'react';
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

interface WatchingSeriesData {
  id: number;
  currentlyWatching: boolean;
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
          watched: boolean;
        }>;
      }>;
    }>;
  };
}

export function CurrentlyWatchingDashboard() {
  const message = useMessage();
  const [loading, setLoading] = useState(true);
  const [watchingSeries, setWatchingSeries] = useState<WatchingSeriesData[]>(
    []
  );

  useEffect(() => {
    loadWatchingSeries();
  }, []);

  const loadWatchingSeries = async () => {
    try {
      const response = await fetch('/api/currently-watching');
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
        if (episode.viewStatus?.[0]?.watched) {
          watchedEpisodes++;
        }
      });
    });

    return { totalEpisodes, watchedEpisodes };
  };

  const getNextEpisode = (series: WatchingSeriesData['series']) => {
    for (const season of series.seasons || []) {
      for (const episode of season.episodes || []) {
        if (!episode.viewStatus?.[0]?.watched) {
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
    if (!date) return 'Nunca';
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Justo ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
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
        body: JSON.stringify({ currentlyWatching: false }),
      });

      if (!response.ok) throw new Error('Error al actualizar');

      // Remover de la lista local
      setWatchingSeries((prev) =>
        prev.filter((item) => item.series.id !== seriesId)
      );
      message.success(`"${seriesTitle}" removida de "Viendo ahora"`);
    } catch (error) {
      message.error('Error al remover de la lista');
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '48px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (watchingSeries.length === 0) {
    return (
      <Empty
        description="No estás viendo ninguna serie actualmente"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      >
        <Link href="/catalogo">
          <Button type="primary">Explorar Catálogo</Button>
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
                      style={{
                        width: '100%',
                        height: 'auto',
                        objectFit: 'cover',
                      }}
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
                title="Remover de viendo ahora"
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
                      style={{ marginTop: '12px' }}
                    />

                    {nextEp && (
                      <div className="watching-card__next">
                        <PlayCircleOutlined style={{ marginRight: '8px' }} />
                        <span>
                          Siguiente: T{nextEp.seasonNumber}E
                          {nextEp.episodeNumber}
                          {nextEp.title && ` - ${nextEp.title}`}
                        </span>
                      </div>
                    )}

                    <div className="watching-card__last-watched">
                      <ClockCircleOutlined style={{ marginRight: '8px' }} />
                      <span>{formatLastWatched(item.lastWatchedAt)}</span>
                    </div>

                    <div className="watching-card__actions">
                      <Link
                        href={`/series/${item.series.id}`}
                        style={{ flex: 1 }}
                      >
                        <Button type="primary" block>
                          {progress === 100
                            ? 'Ver detalles'
                            : 'Continuar viendo'}
                        </Button>
                      </Link>
                      <Link href={`/admin/series/${item.series.id}/editar`}>
                        <Button
                          icon={<EditOutlined />}
                          title="Editar y agregar comentarios"
                        >
                          Editar
                        </Button>
                      </Link>
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
