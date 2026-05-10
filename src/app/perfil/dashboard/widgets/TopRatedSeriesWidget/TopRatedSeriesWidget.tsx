'use client';

import { TrophyOutlined } from '@ant-design/icons';
import Image from 'next/image';
import Link from 'next/link';
import { Widget } from '@/components/dashboard';
import { EmptyState } from '@/components/design-system';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { isSupabaseImageUrl } from '@/lib/image-helpers';
import type { ProfileData } from '../../../types';
import './TopRatedSeriesWidget.css';

export interface TopRatedSeriesWidgetProps {
  topRatedSeries: ProfileData['stats']['topRatedSeries'];
}

/** Top series mejor calificadas por el usuario. Lista compacta con
 *  cover thumbnail + titulo + nota visual con estrellas (escala 1-10
 *  mapeada a 0-5 estrellas). */
export function TopRatedSeriesWidget({
  topRatedSeries,
}: TopRatedSeriesWidgetProps) {
  const { t } = useLocale();

  if (!topRatedSeries || topRatedSeries.length === 0) {
    return (
      <Widget
        title={t('profileDashboard.widgetTopRated')}
        icon={<TrophyOutlined />}
      >
        <EmptyState
          title={t('profileDashboard.topRatedEmpty')}
          variant="soft"
          fullHeight={false}
        />
      </Widget>
    );
  }

  return (
    <Widget
      title={t('profileDashboard.widgetTopRated')}
      icon={<TrophyOutlined />}
      noPadding
      fade={topRatedSeries.length > 5}
    >
      <ol className="mb-top-rated-list">
        {topRatedSeries.slice(0, 8).map((s, idx) => {
          const filled = Math.round(s.rating / 2);
          return (
            <li key={s.seriesId}>
              <Link
                href={`/series/${s.seriesId}`}
                className="mb-top-rated-list__item"
              >
                <span className="mb-top-rated-list__rank">{idx + 1}</span>
                <span className="mb-top-rated-list__cover">
                  {s.imageUrl ? (
                    <Image
                      src={s.imageUrl}
                      alt=""
                      width={32}
                      height={44}
                      unoptimized={!isSupabaseImageUrl(s.imageUrl)}
                    />
                  ) : (
                    <span className="mb-top-rated-list__cover-placeholder" />
                  )}
                </span>
                <span className="mb-top-rated-list__body">
                  <span className="mb-top-rated-list__title">{s.title}</span>
                  <span className="mb-top-rated-list__stars" aria-hidden>
                    {'★'.repeat(filled)}
                    {'☆'.repeat(5 - filled)}
                  </span>
                </span>
                <span
                  className="mb-top-rated-list__score"
                  aria-label={`${s.rating}/10`}
                >
                  {s.rating.toFixed(1)}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </Widget>
  );
}
