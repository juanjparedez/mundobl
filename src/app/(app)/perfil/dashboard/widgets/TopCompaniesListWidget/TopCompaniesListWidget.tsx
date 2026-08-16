'use client';

import { useState } from 'react';
import { BankOutlined } from '@ant-design/icons';
import { Widget } from '@/components/dashboard';
import { EmptyState } from '@/components/design-system';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { interpolateMessage } from '@/lib/i18n-format';
import type { ProfileData } from '../../../types';
import './TopCompaniesListWidget.css';

const COLLAPSED_COUNT = 5;

export interface TopCompaniesListWidgetProps {
  topProductionCompanies: ProfileData['stats']['topProductionCompanies'];
}

/** Lista compacta de productoras mas vistas. */
export function TopCompaniesListWidget({
  topProductionCompanies,
}: TopCompaniesListWidgetProps) {
  const { t } = useLocale();
  const [showAll, setShowAll] = useState(false);

  if (!topProductionCompanies || topProductionCompanies.length === 0) {
    return (
      <Widget
        title={t('profileDashboard.widgetTopCompanies')}
        icon={<BankOutlined />}
      >
        <EmptyState
          title={t('profileDashboard.topCompaniesEmpty')}
          variant="soft"
          fullHeight={false}
        />
      </Widget>
    );
  }

  const max = Math.max(1, ...topProductionCompanies.map((c) => c.count));
  const visible = showAll
    ? topProductionCompanies
    : topProductionCompanies.slice(0, COLLAPSED_COUNT);

  return (
    <Widget
      title={t('profileDashboard.widgetTopCompanies')}
      icon={<BankOutlined />}
      noPadding
      fade={topProductionCompanies.length > COLLAPSED_COUNT}
    >
      <div className="mb-top-companies-list__wrap">
        <ul className="mb-top-companies-list">
          {visible.map((c) => {
            const pct = Math.round((c.count / max) * 100);
            return (
              <li key={c.name} className="mb-top-companies-list__item">
                <div className="mb-top-companies-list__row">
                  <span className="mb-top-companies-list__name">{c.name}</span>
                  <span className="mb-top-companies-list__count">
                    {c.count}
                  </span>
                </div>
                <div className="mb-top-companies-list__bar-track">
                  <div
                    className="mb-top-companies-list__bar-fill"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>

        {topProductionCompanies.length > COLLAPSED_COUNT && (
          <button
            type="button"
            className="mb-top-companies-list__toggle"
            onClick={() => setShowAll((v) => !v)}
          >
            {showAll
              ? t('profile.overviewViewLess')
              : interpolateMessage(t('profile.overviewViewAllCount'), {
                  count: String(topProductionCompanies.length),
                })}
          </button>
        )}
      </div>
    </Widget>
  );
}
