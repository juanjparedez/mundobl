'use client';

import { useState } from 'react';
import { HeartOutlined } from '@ant-design/icons';
import Image from 'next/image';
import Link from 'next/link';
import { Widget } from '@/components/dashboard';
import { EmptyState } from '@/components/design-system';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { interpolateMessage } from '@/lib/i18n-format';
import { isSupabaseImageUrl } from '@/lib/image-helpers';
import type { ProfileData } from '../../../types';
import './FavoritesWidget.css';

const COLLAPSED_COUNT = 12;

export interface FavoritesWidgetProps {
  favorites: ProfileData['favorites'];
}

/** Grid de portadas de series favoritas. Mas visual que los list-widgets:
 *  prioriza el cover sobre el detalle. */
export function FavoritesWidget({ favorites }: FavoritesWidgetProps) {
  const { t } = useLocale();
  const [showAll, setShowAll] = useState(false);

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

  // Ya vienen todos cargados de una (no hay re-fetch) — "ver mas" solo
  // levanta el limite de cuantos se renderizan, evitando montar de una
  // decenas/cientos de covers si el usuario tiene muchos favoritos.
  const visible = showAll ? favorites : favorites.slice(0, COLLAPSED_COUNT);

  return (
    <Widget
      title={t('profileDashboard.widgetFavorites')}
      icon={<HeartOutlined />}
      noPadding
      fade={favorites.length > COLLAPSED_COUNT}
    >
      <div className="mb-favorites-grid__wrap">
        <ul className="mb-favorites-grid">
          {visible.map(({ seriesId, series }) => {
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
                  <span className="mb-favorites-grid__title">
                    {series.title}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>

        {favorites.length > COLLAPSED_COUNT && (
          <button
            type="button"
            className="mb-favorites-grid__toggle"
            onClick={() => setShowAll((v) => !v)}
          >
            {showAll
              ? t('profile.overviewViewLess')
              : interpolateMessage(t('profile.overviewViewAllCount'), {
                  count: String(favorites.length),
                })}
          </button>
        )}
      </div>
    </Widget>
  );
}
