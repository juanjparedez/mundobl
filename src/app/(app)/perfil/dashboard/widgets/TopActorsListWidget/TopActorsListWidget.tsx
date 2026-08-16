'use client';

import { useState } from 'react';
import { TeamOutlined } from '@ant-design/icons';
import { Widget } from '@/components/dashboard';
import { EmptyState } from '@/components/design-system';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { interpolateMessage } from '@/lib/i18n-format';
import type { ProfileData } from '../../../types';
import './TopActorsListWidget.css';

const COLLAPSED_COUNT = 5;

export interface TopActorsListWidgetProps {
  topActors: ProfileData['stats']['topActors'];
}

/** Lista compacta de top actores por count, con barras proporcionales.
 *  Mismo patron visual que TopGenresList y TopCountriesList. */
export function TopActorsListWidget({ topActors }: TopActorsListWidgetProps) {
  const { t } = useLocale();
  const [showAll, setShowAll] = useState(false);

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
  const visible = showAll ? topActors : topActors.slice(0, COLLAPSED_COUNT);

  return (
    <Widget
      title={t('profileDashboard.widgetTopActors')}
      icon={<TeamOutlined />}
      noPadding
      // El fade queda prendido tambien con la lista expandida — si el
      // widget es mas chico que el contenido, es la pista para
      // agrandarlo (drag/resize), ya que los widgets no tienen scroll
      // interno a proposito.
      fade={topActors.length > COLLAPSED_COUNT}
    >
      <div className="mb-top-actors-list__wrap">
        <ul className="mb-top-actors-list">
          {visible.map((a) => {
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

        {topActors.length > COLLAPSED_COUNT && (
          <button
            type="button"
            className="mb-top-actors-list__toggle"
            onClick={() => setShowAll((v) => !v)}
          >
            {showAll
              ? t('profile.overviewViewLess')
              : interpolateMessage(t('profile.overviewViewAllCount'), {
                  count: String(topActors.length),
                })}
          </button>
        )}
      </div>
    </Widget>
  );
}
