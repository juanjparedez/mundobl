'use client';

import { PlayCircleOutlined } from '@ant-design/icons';
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

/** Shelf horizontal de "Seguir viendo" alineado al style-guide my-.profile2.png:
 *  cards grandes con poster prominente, titulo, proximo episodio y barra
 *  de progreso. Scroll horizontal con scroll-snap para feel premium. */
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
    >
      <div className="mb-cw-shelf" role="list">
        {items.map(({ seriesId, series, progress, nextEpisode }) => {
          if (!series) return null;
          const pct =
            progress.totalEpisodes > 0
              ? Math.round(
                  (progress.watchedEpisodes / progress.totalEpisodes) * 100
                )
              : 0;
          return (
            <Link
              key={seriesId}
              href={`/series/${series.id}`}
              className="mb-cw-shelf__card"
              role="listitem"
            >
              <span className="mb-cw-shelf__cover">
                {series.imageUrl ? (
                  <Image
                    src={series.imageUrl}
                    alt=""
                    width={160}
                    height={90}
                    sizes="160px"
                    quality={70}
                    unoptimized={!isSupabaseImageUrl(series.imageUrl)}
                  />
                ) : (
                  <span className="mb-cw-shelf__cover-placeholder">
                    <PlayCircleOutlined />
                  </span>
                )}
                <span className="mb-cw-shelf__progress-bar">
                  <span
                    className="mb-cw-shelf__progress-fill"
                    style={{ width: `${pct}%` }}
                  />
                </span>
              </span>
              <span className="mb-cw-shelf__body">
                <span className="mb-cw-shelf__title" title={series.title}>
                  {series.title}
                </span>
                <span className="mb-cw-shelf__next">
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
              </span>
            </Link>
          );
        })}
      </div>
    </Widget>
  );
}
