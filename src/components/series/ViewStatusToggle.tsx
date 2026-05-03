'use client';

import { useState } from 'react';
import { Progress, Tooltip, Tag, Select, Badge } from 'antd';
import { useSession } from 'next-auth/react';
import { WATCH_STATUS, WATCH_STATUS_COLORS } from '@/constants/series';
import type { WatchStatusValue } from '@/constants/series';
import './ViewStatusToggle.css';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { interpolateMessage } from '@/lib/i18n-format';
import { useMessage } from '@/hooks/useMessage';

type AntStatusColor =
  | 'default'
  | 'processing'
  | 'success'
  | 'error'
  | 'warning';

interface ViewStatusToggleProps {
  seriesId: number;
  initialStatus: WatchStatusValue;
  seasons?: Array<{
    episodes?: Array<{
      viewStatus?: Array<{ status: string }>;
    }>;
  }>;
}

export function ViewStatusToggle({
  seriesId,
  initialStatus,
  seasons = [],
}: ViewStatusToggleProps) {
  const message = useMessage();
  const { t } = useLocale();
  const { data: session } = useSession();
  const [status, setStatus] = useState<WatchStatusValue>(initialStatus);
  const [isUpdating, setIsUpdating] = useState(false);

  const watchStatusLabels: Record<string, string> = {
    SIN_VER: t('viewStatus.sinVer'),
    VIENDO: t('viewStatus.viendo'),
    VISTA: t('viewStatus.vista'),
    ABANDONADA: t('viewStatus.abandonada'),
    RETOMAR: t('viewStatus.retomar'),
  };

  // Calcular progreso de episodios vistos
  const calculateProgress = () => {
    let totalEpisodes = 0;
    let watchedEpisodes = 0;

    seasons.forEach((season) => {
      if (season.episodes) {
        totalEpisodes += season.episodes.length;
        watchedEpisodes += season.episodes.filter(
          (ep) => ep.viewStatus?.[0]?.status === 'VISTA'
        ).length;
      }
    });

    return { totalEpisodes, watchedEpisodes };
  };

  const { totalEpisodes, watchedEpisodes } = calculateProgress();
  const progressPercent =
    totalEpisodes > 0 ? Math.round((watchedEpisodes / totalEpisodes) * 100) : 0;

  const handleStatusChange = async (newStatus: WatchStatusValue) => {
    const previous = status;
    setStatus(newStatus);
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/series/${seriesId}/view-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Error al actualizar');

      message.success(
        interpolateMessage(t('viewStatus.statusMessage'), {
          label: watchStatusLabels[newStatus] ?? newStatus,
        })
      );
    } catch (error) {
      setStatus(previous);
      message.error(t('viewStatus.errorUpdate'));
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  if (!session?.user) {
    return (
      <div className="view-status-toggle">
        <Tag color={WATCH_STATUS_COLORS[status]}>
          {watchStatusLabels[status] ?? status}
        </Tag>
        {totalEpisodes > 0 && (
          <div className="view-status-toggle__progress">
            <Progress
              percent={progressPercent}
              size="small"
              status={progressPercent === 100 ? 'success' : 'active'}
              format={() =>
                interpolateMessage(t('viewStatus.episodesUnit'), {
                  watched: String(watchedEpisodes),
                  total: String(totalEpisodes),
                })
              }
            />
          </div>
        )}
      </div>
    );
  }

  const statusOptions = Object.values(WATCH_STATUS).map((value) => ({
    value,
    label: (
      <span className="view-status-toggle__option">
        <Badge status={WATCH_STATUS_COLORS[value] as AntStatusColor} />
        {watchStatusLabels[value] ?? value}
      </span>
    ),
  }));

  return (
    <div className="view-status-toggle">
      <Select
        value={status}
        onChange={handleStatusChange}
        loading={isUpdating}
        disabled={isUpdating}
        options={statusOptions}
        className={`view-status-toggle__select view-status-toggle__select--${status.toLowerCase()}`}
        size="middle"
        aria-label={t('viewStatus.ariaLabel')}
      />

      {totalEpisodes > 0 && (
        <div className="view-status-toggle__progress">
          <Tooltip
            title={interpolateMessage(t('viewStatus.tooltipEpisodes'), {
              watched: String(watchedEpisodes),
              total: String(totalEpisodes),
            })}
          >
            <Progress
              percent={progressPercent}
              size="small"
              status={progressPercent === 100 ? 'success' : 'active'}
              format={() =>
                interpolateMessage(t('viewStatus.episodesUnit'), {
                  watched: String(watchedEpisodes),
                  total: String(totalEpisodes),
                })
              }
            />
          </Tooltip>
        </div>
      )}
    </div>
  );
}
