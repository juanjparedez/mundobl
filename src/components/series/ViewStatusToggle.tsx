'use client';

import { useEffect, useState } from 'react';
import { Progress, Tag, Select, Badge } from 'antd';
import { useSession } from 'next-auth/react';
import { WATCH_STATUS, WATCH_STATUS_COLORS } from '@/constants/series';
import type { WatchStatusValue } from '@/constants/series';
import { useSeriesUserStatus } from './SeriesUserStatusProvider';
import { WatchProgressStepper } from './WatchProgressStepper/WatchProgressStepper';
import './ViewStatusToggle.css';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { interpolateMessage } from '@/lib/i18n-format';
import { useMessage } from '@/hooks/useMessage';
import { trackFunnel } from '@/lib/analytics';

type AntStatusColor =
  | 'default'
  | 'processing'
  | 'success'
  | 'error'
  | 'warning';

interface ViewStatusToggleProps {
  seriesId: number;
  /** Para el Popconfirm "¿Terminaste {title}?" del stepper. */
  seriesTitle: string;
  seasons?: Array<{
    seasonNumber: number;
    episodes?: Array<{
      id: number;
      episodeNumber: number;
    }>;
  }>;
}

// El estado inicial (serie + episodios, para el progreso) ya no llega
// horneado desde el servidor: /series/[id] dejo de llamar `await auth()`
// (mataba el `revalidate`), asi que se hidrata aca via
// SeriesUserStatusProvider apenas resuelve el fetch a
// /api/series/[id]/my-status.
export function ViewStatusToggle({
  seriesId,
  seriesTitle,
  seasons = [],
}: ViewStatusToggleProps) {
  const message = useMessage();
  const { t } = useLocale();
  const { data: session } = useSession();
  const { seriesStatus, episodeStatus, loaded, version } =
    useSeriesUserStatus();
  const [status, setStatus] = useState<WatchStatusValue>('SIN_VER');
  const [isUpdating, setIsUpdating] = useState(false);

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

  // Calcular progreso de episodios vistos
  const calculateProgress = () => {
    let totalEpisodes = 0;
    let watchedEpisodes = 0;

    seasons.forEach((season) => {
      if (season.episodes) {
        totalEpisodes += season.episodes.length;
        watchedEpisodes += season.episodes.filter(
          (ep) => episodeStatus[ep.id] === 'VISTA'
        ).length;
      }
    });

    return { totalEpisodes, watchedEpisodes };
  };

  const { totalEpisodes, watchedEpisodes } = calculateProgress();
  const progressPercent =
    totalEpisodes > 0 ? Math.round((watchedEpisodes / totalEpisodes) * 100) : 0;

  // Aplanado y ordenado para el stepper (T06): las temporadas ya vienen
  // ordenadas por seasonNumber y los episodios por episodeNumber desde
  // buildSeriesFullInclude, pero no asumimos el orden acá.
  const orderedEpisodes = seasons
    .flatMap((season) =>
      (season.episodes ?? []).map((ep) => ({
        id: ep.id,
        seasonNumber: season.seasonNumber,
        episodeNumber: ep.episodeNumber,
      }))
    )
    .sort((a, b) =>
      a.seasonNumber !== b.seasonNumber
        ? a.seasonNumber - b.seasonNumber
        : a.episodeNumber - b.episodeNumber
    );

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

      if (!response.ok) throw new Error(t('viewStatusToggle.errorUpdating'));

      trackFunnel('series_status_set', { status: newStatus, source: 'toggle' });

      message.success(
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
                interpolateMessage(t('viewStatusToggle.episodesUnit'), {
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
        aria-label={t('viewStatusToggle.ariaLabel')}
      />

      {orderedEpisodes.length > 0 && (
        <WatchProgressStepper
          seriesId={seriesId}
          seriesTitle={seriesTitle}
          episodes={orderedEpisodes}
          source="stepper"
        />
      )}
    </div>
  );
}
