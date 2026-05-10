'use client';

import { TeamOutlined } from '@ant-design/icons';
import { Widget } from '@/components/dashboard';
import { EmptyState } from '@/components/design-system';
import { useLocale } from '@/lib/providers/LocaleProvider';
import type { ProfileData } from '../../../types';
import './TopActorsListWidget.css';

export interface TopActorsListWidgetProps {
  topActors: ProfileData['stats']['topActors'];
}

/** Lista compacta de top actores por count, con barras proporcionales.
 *  Mismo patron visual que TopGenresList y TopCountriesList. */
export function TopActorsListWidget({ topActors }: TopActorsListWidgetProps) {
  const { t } = useLocale();

  if (!topActors || topActors.length === 0) {
    return (
      <Widget
        title={t('profileDashboard.widgetTopActors')}
        icon={<TeamOutlined />}
      >
        <EmptyState
          title={t('profileDashboard.topActorsEmpty')}
          variant="soft"
          fullHeight={false}
        />
      </Widget>
    );
  }

  const max = Math.max(1, ...topActors.map((a) => a.count));

  return (
    <Widget
      title={t('profileDashboard.widgetTopActors')}
      icon={<TeamOutlined />}
      noPadding
      fade={topActors.length > 8}
    >
      <ul className="mb-top-actors-list">
        {topActors.slice(0, 8).map((a) => {
          const pct = Math.round((a.count / max) * 100);
          return (
            <li key={a.name} className="mb-top-actors-list__item">
              <div className="mb-top-actors-list__row">
                <span className="mb-top-actors-list__name">{a.name}</span>
                <span className="mb-top-actors-list__count">{a.count}</span>
              </div>
              <div className="mb-top-actors-list__bar-track">
                <div
                  className="mb-top-actors-list__bar-fill"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </Widget>
  );
}
