'use client';

import { useState } from 'react';
import { Progress, Tooltip, Tag, Select } from 'antd';
import { useSession } from 'next-auth/react';
import {
  WATCH_STATUS,
  WATCH_STATUS_LABELS,
  WATCH_STATUS_COLORS,
} from '@/constants/series';
import type { WatchStatusValue } from '@/constants/series';
import './ViewStatusToggle.css';
import { useMessage } from '@/hooks/useMessage';

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
  const { data: session } = useSession();
  const [status, setStatus] = useState<WatchStatusValue>(initialStatus);
  const [isUpdating, setIsUpdating] = useState(false);

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
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/series/${seriesId}/view-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Error al actualizar');

      setStatus(newStatus);
      message.success(`Estado: ${WATCH_STATUS_LABELS[newStatus]}`);
    } catch (error) {
      message.error('Error al actualizar el estado');
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  if (!session?.user) {
    return (
      <div className="view-status-toggle">
        <Tag color={WATCH_STATUS_COLORS[status]}>
          {WATCH_STATUS_LABELS[status]}
        </Tag>
        {totalEpisodes > 0 && (
          <div style={{ marginTop: '12px' }}>
            <Progress
              percent={progressPercent}
              size="small"
              status={progressPercent === 100 ? 'success' : 'active'}
              format={() => `${watchedEpisodes}/${totalEpisodes} episodios`}
            />
          </div>
        )}
      </div>
    );
  }

  const statusOptions = Object.values(WATCH_STATUS).map((value) => ({
    value,
    label: WATCH_STATUS_LABELS[value],
  }));

  return (
    <div className="view-status-toggle">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        <Select
          value={status}
          onChange={handleStatusChange}
          loading={isUpdating}
          disabled={isUpdating}
          options={statusOptions}
          style={{ minWidth: 160 }}
          size="middle"
        />
        <Tag color={WATCH_STATUS_COLORS[status]} style={{ margin: 0 }}>
          {WATCH_STATUS_LABELS[status]}
        </Tag>
      </div>

      {totalEpisodes > 0 && (
        <div style={{ marginTop: '12px' }}>
          <Tooltip
            title={`${watchedEpisodes} de ${totalEpisodes} episodios vistos`}
          >
            <Progress
              percent={progressPercent}
              size="small"
              status={progressPercent === 100 ? 'success' : 'active'}
              format={() => `${watchedEpisodes}/${totalEpisodes} episodios`}
            />
          </Tooltip>
        </div>
      )}
    </div>
  );
}
