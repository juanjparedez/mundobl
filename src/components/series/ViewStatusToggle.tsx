'use client';

import { useState } from 'react';
import { Switch, Progress, Tooltip, Button } from 'antd';
import {
  EyeOutlined,
  EyeInvisibleOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import './ViewStatusToggle.css';
import { useMessage } from '@/hooks/useMessage';

interface ViewStatusToggleProps {
  seriesId: number;
  initialStatus: boolean;
  initialCurrentlyWatching?: boolean;
  seasons?: Array<{
    viewStatus?: Array<{ watched: boolean }>;
    episodes?: Array<{
      viewStatus?: Array<{ watched: boolean }>;
    }>;
  }>;
}

export function ViewStatusToggle({
  seriesId,
  initialStatus,
  initialCurrentlyWatching = false,
  seasons = [],
}: ViewStatusToggleProps) {
  const message = useMessage();
  const [watched, setWatched] = useState(initialStatus);
  const [currentlyWatching, setCurrentlyWatching] = useState(
    initialCurrentlyWatching
  );
  const [isUpdating, setIsUpdating] = useState(false);

  // Calcular progreso de episodios vistos
  const calculateProgress = () => {
    let totalEpisodes = 0;
    let watchedEpisodes = 0;

    seasons.forEach((season) => {
      if (season.episodes) {
        totalEpisodes += season.episodes.length;
        watchedEpisodes += season.episodes.filter(
          (ep) => ep.viewStatus?.[0]?.watched
        ).length;
      }
    });

    return { totalEpisodes, watchedEpisodes };
  };

  const { totalEpisodes, watchedEpisodes } = calculateProgress();
  const progressPercent =
    totalEpisodes > 0 ? Math.round((watchedEpisodes / totalEpisodes) * 100) : 0;

  const handleToggle = async (checked: boolean) => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/series/${seriesId}/view-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ watched: checked }),
      });

      if (!response.ok) throw new Error('Error al actualizar');

      setWatched(checked);
      message.success(checked ? 'Marcada como vista' : 'Marcada como no vista');
    } catch (error) {
      message.error('Error al actualizar el estado');
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCurrentlyWatchingToggle = async () => {
    setIsUpdating(true);
    try {
      const newStatus = !currentlyWatching;
      const response = await fetch(`/api/series/${seriesId}/view-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentlyWatching: newStatus }),
      });

      if (!response.ok) throw new Error('Error al actualizar');

      setCurrentlyWatching(newStatus);
      message.success(
        newStatus
          ? '📺 Agregada a "Viendo ahora"'
          : 'Removida de "Viendo ahora"'
      );
    } catch (error) {
      message.error('Error al actualizar el estado');
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Switch
            checked={watched}
            onChange={handleToggle}
            loading={isUpdating}
            checkedChildren={<EyeOutlined />}
            unCheckedChildren={<EyeInvisibleOutlined />}
            size="default"
          />
          <span className="view-status-toggle__label">
            {watched ? 'Vista' : 'No vista'}
          </span>
        </div>

        <Button
          type={currentlyWatching ? 'primary' : 'default'}
          icon={<PlayCircleOutlined />}
          onClick={handleCurrentlyWatchingToggle}
          loading={isUpdating}
          size="middle"
        >
          {currentlyWatching ? '▶️ Viendo ahora' : 'Agregar a "Viendo ahora"'}
        </Button>
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
