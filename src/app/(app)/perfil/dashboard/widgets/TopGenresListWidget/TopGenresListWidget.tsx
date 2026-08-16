'use client';

import { useState } from 'react';
import { TagsOutlined } from '@ant-design/icons';
import { Widget } from '@/components/dashboard';
import { EmptyState } from '@/components/design-system';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { interpolateMessage } from '@/lib/i18n-format';
import type { ProfileData } from '../../../types';
import './TopGenresListWidget.css';

const COLLAPSED_COUNT = 5;

export interface TopGenresListWidgetProps {
  topGenres: ProfileData['stats']['topGenres'];
}

/** Lista compacta de top generos del usuario, con barra de progreso
 *  proporcional al maximo. Complemento del DonutChart (mas denso). */
export function TopGenresListWidget({ topGenres }: TopGenresListWidgetProps) {
  const { t } = useLocale();
  const [showAll, setShowAll] = useState(false);

  if (!topGenres || topGenres.length === 0) {
    return (
      <Widget
        title={t('profileDashboard.widgetTopGenresList')}
        icon={<TagsOutlined />}
      >
        <EmptyState
          title={t('profileDashboard.genresEmpty')}
          variant="soft"
          fullHeight={false}
        />
      </Widget>
    );
  }

  const max = Math.max(1, ...topGenres.map((g) => g.count));
  const visible = showAll ? topGenres : topGenres.slice(0, COLLAPSED_COUNT);

  return (
    <Widget
      title={t('profileDashboard.widgetTopGenresList')}
      icon={<TagsOutlined />}
      noPadding
    >
      <div className="mb-top-genres-list__wrap">
        <ul className="mb-top-genres-list">
          {visible.map((g) => {
            const pct = Math.round((g.count / max) * 100);
            return (
              <li key={g.name} className="mb-top-genres-list__item">
                <div className="mb-top-genres-list__row">
                  <span className="mb-top-genres-list__name">{g.name}</span>
                  <span className="mb-top-genres-list__count">{g.count}</span>
                </div>
                <div className="mb-top-genres-list__bar-track">
                  <div
                    className="mb-top-genres-list__bar-fill"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>

        {topGenres.length > COLLAPSED_COUNT && (
          <button
            type="button"
            className="mb-top-genres-list__toggle"
            onClick={() => setShowAll((v) => !v)}
          >
            {showAll
              ? t('profile.overviewViewLess')
              : interpolateMessage(t('profile.overviewViewAllCount'), {
                  count: String(topGenres.length),
                })}
          </button>
        )}
      </div>
    </Widget>
  );
}
