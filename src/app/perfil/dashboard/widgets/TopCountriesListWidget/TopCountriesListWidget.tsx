'use client';

import { GlobalOutlined } from '@ant-design/icons';
import { Widget } from '@/components/dashboard';
import { EmptyState } from '@/components/design-system';
import { CountryFlag } from '@/components/common/CountryFlag/CountryFlag';
import { useLocale } from '@/lib/providers/LocaleProvider';
import type { ProfileData } from '../../../types';
import './TopCountriesListWidget.css';

export interface TopCountriesListWidgetProps {
  topCountries: ProfileData['stats']['topCountries'];
}

export function TopCountriesListWidget({
  topCountries,
}: TopCountriesListWidgetProps) {
  const { t } = useLocale();

  if (!topCountries || topCountries.length === 0) {
    return (
      <Widget
        title={t('profileDashboard.widgetTopCountries')}
        icon={<GlobalOutlined />}
      >
        <EmptyState
          title={t('profileDashboard.topCountriesEmpty')}
          variant="soft"
          fullHeight={false}
        />
      </Widget>
    );
  }

  const max = Math.max(1, ...topCountries.map((c) => c.count));

  return (
    <Widget
      title={t('profileDashboard.widgetTopCountries')}
      icon={<GlobalOutlined />}
      noPadding
    >
      <ul className="mb-top-countries-list">
        {topCountries.slice(0, 6).map((c, idx) => {
          const pct = Math.round((c.count / max) * 100);
          const rank = idx + 1;
          return (
            <li
              key={`${c.name}-${idx}`}
              className="mb-top-countries-list__item"
              data-rank={rank <= 3 ? rank : undefined}
            >
              <span className="mb-top-countries-list__rank" aria-hidden>
                {rank}
              </span>
              <span className="mb-top-countries-list__flag">
                {c.code ? (
                  <CountryFlag code={c.code} size="medium" />
                ) : (
                  <GlobalOutlined />
                )}
              </span>
              <div className="mb-top-countries-list__main">
                <div className="mb-top-countries-list__head">
                  <span className="mb-top-countries-list__name">{c.name}</span>
                  <span className="mb-top-countries-list__count">
                    {c.count}
                  </span>
                </div>
                <div className="mb-top-countries-list__bar-track">
                  <div
                    className="mb-top-countries-list__bar-fill"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </Widget>
  );
}
