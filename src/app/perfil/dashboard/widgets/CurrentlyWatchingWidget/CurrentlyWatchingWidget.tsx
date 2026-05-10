'use client';

import { PlayCircleOutlined } from '@ant-design/icons';
import { Progress } from 'antd';
import Image from 'next/image';
import Link from 'next/link';
import { Widget } from '@/components/dashboard';
import { EmptyState } from '@/components/design-system';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { interpolateMessage } from '@/lib/i18n-format';
import { isSupabaseImageUrl } from '@/lib/image-helpers';
import type { ProfileData } from '../../../types';
import './CurrentlyWatchingWidget.css';

export interface CurrentlyWatchingWidgetProps {
  items: ProfileData['currentlyWatching'];
}

export function CurrentlyWatchingWidget({
  items,
}: CurrentlyWatchingWidgetProps) {
  const { t } = useLocale();

  if (!items || items.length === 0) {
    return (
      <Widget
        title={t('profileDashboard.widgetCurrentlyWatching')}
        icon={<PlayCircleOutlined />}
      >
        <EmptyState
          title={t('profileDashboard.currentlyWatchingEmpty')}
          variant="soft"
          fullHeight={false}
        />
      </Widget>
    );
  }

  return (
    <Widget
      title={t('profileDashboard.widgetCurrentlyWatching')}
      icon={<PlayCircleOutlined />}
      noPadding
      fade={items.length > 3}
    >
      <ul className="mb-currently-watching">
        {items.map(({ seriesId, series, progress, nextEpisode }) => {
          if (!series) return null;
          const pct =
            progress.totalEpisodes > 0
              ? Math.round(
                  (progress.watchedEpisodes / progress.totalEpisodes) * 100
                )
              : 0;
          return (
            <li key={seriesId}>
              <Link
                href={`/series/${series.id}`}
                className="mb-currently-watching__item"
              >
                <span className="mb-currently-watching__cover">
                  {series.imageUrl ? (
                    <Image
                      src={series.imageUrl}
                      alt=""
                      width={44}
                      height={62}
                      unoptimized={!isSupabaseImageUrl(series.imageUrl)}
                    />
                  ) : (
                    <span className="mb-currently-watching__cover-placeholder" />
                  )}
                </span>
                <span className="mb-currently-watching__body">
                  <span className="mb-currently-watching__title">
                    {series.title}
                  </span>
                  <span className="mb-currently-watching__meta">
                    {nextEpisode
                      ? interpolateMessage(
                          t('profileDashboard.currentlyWatchingNext'),
                          {
                            season: nextEpisode.seasonNumber,
                            episode: nextEpisode.episodeNumber,
                          }
                        )
                      : interpolateMessage(
                          t('profileDashboard.currentlyWatchingProgress'),
                          {
                            watched: progress.watchedEpisodes,
                            total: progress.totalEpisodes,
                          }
                        )}
                  </span>
                  <Progress
                    percent={pct}
                    showInfo={false}
                    size="small"
                    strokeColor="var(--primary-color)"
                    trailColor="var(--bg-spotlight)"
                  />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </Widget>
  );
}
