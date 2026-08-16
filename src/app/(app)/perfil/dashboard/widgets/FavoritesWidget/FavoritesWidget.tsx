'use client';

import { HeartOutlined } from '@ant-design/icons';
import Image from 'next/image';
import Link from 'next/link';
import { Widget } from '@/components/dashboard';
import { AutoFitList, EmptyState } from '@/components/design-system';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { interpolateMessage } from '@/lib/i18n-format';
import { isSupabaseImageUrl } from '@/lib/image-helpers';
import type { ProfileData } from '../../../types';
import './FavoritesWidget.css';

export interface FavoritesWidgetProps {
  favorites: ProfileData['favorites'];
}

/** Grid de portadas de series favoritas. Mas visual que los list-widgets:
 *  prioriza el cover sobre el detalle. */
export function FavoritesWidget({ favorites }: FavoritesWidgetProps) {
  const { t } = useLocale();

  if (!favorites || favorites.length === 0) {
    return (
      <Widget
        title={t('profileDashboard.widgetFavorites')}
        icon={<HeartOutlined />}
      >
        <EmptyState
          title={t('profileDashboard.favoritesEmpty')}
          variant="soft"
          fullHeight={false}
        />
      </Widget>
    );
  }

  return (
    <Widget
      title={t('profileDashboard.widgetFavorites')}
      icon={<HeartOutlined />}
      noPadding
    >
      <AutoFitList
        as="ul"
        listClassName="mb-favorites-grid"
        viewLessLabel={t('profile.overviewViewLess')}
        viewMoreLabel={(count) =>
          interpolateMessage(t('profile.overviewViewAllCount'), {
            count: String(count),
          })
        }
      >
        {favorites.map(({ seriesId, series }) => {
          if (!series) return null;
          return (
            <li key={seriesId}>
              <Link
                href={`/series/${series.id}`}
                className="mb-favorites-grid__item"
                title={series.title}
              >
                <span className="mb-favorites-grid__cover">
                  {series.imageUrl ? (
                    <Image
                      src={series.imageUrl}
                      alt={series.title}
                      width={64}
                      height={96}
                      unoptimized={isSupabaseImageUrl(series.imageUrl)}
                    />
                  ) : (
                    <span className="mb-favorites-grid__cover-placeholder">
                      <HeartOutlined />
                    </span>
                  )}
                </span>
                <span className="mb-favorites-grid__title">{series.title}</span>
              </Link>
            </li>
          );
        })}
      </AutoFitList>
    </Widget>
  );
}
