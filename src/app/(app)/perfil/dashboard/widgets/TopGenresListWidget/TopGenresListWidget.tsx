'use client';

import { TagsOutlined } from '@ant-design/icons';
import { Widget } from '@/components/dashboard';
import { AutoFitList, EmptyState } from '@/components/design-system';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { interpolateMessage } from '@/lib/i18n-format';
import type { ProfileData } from '../../../types';
import './TopGenresListWidget.css';

export interface TopGenresListWidgetProps {
  topGenres: ProfileData['stats']['topGenres'];
}

/** Lista compacta de top generos del usuario, con barra de progreso
 *  proporcional al maximo. Complemento del DonutChart (mas denso). */
export function TopGenresListWidget({ topGenres }: TopGenresListWidgetProps) {
  const { t } = useLocale();

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

  return (
    <Widget
      title={t('profileDashboard.widgetTopGenresList')}
      icon={<TagsOutlined />}
      noPadding
    >
      <AutoFitList
        as="ul"
        collapsedCount={5}
        listClassName="mb-top-genres-list"
        viewLessLabel={t('profile.overviewViewLess')}
        viewMoreLabel={(count) =>
          interpolateMessage(t('profile.overviewViewAllCount'), {
            count: String(count),
          })
        }
      >
        {topGenres.map((g) => {
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
      </AutoFitList>
    </Widget>
  );
}
