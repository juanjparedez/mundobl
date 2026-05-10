'use client';

import { BankOutlined } from '@ant-design/icons';
import { Widget } from '@/components/dashboard';
import { EmptyState } from '@/components/design-system';
import { useLocale } from '@/lib/providers/LocaleProvider';
import type { ProfileData } from '../../../types';
import './TopCompaniesListWidget.css';

export interface TopCompaniesListWidgetProps {
  topProductionCompanies: ProfileData['stats']['topProductionCompanies'];
}

/** Lista compacta de productoras mas vistas. */
export function TopCompaniesListWidget({
  topProductionCompanies,
}: TopCompaniesListWidgetProps) {
  const { t } = useLocale();

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

  return (
    <Widget
      title={t('profileDashboard.widgetTopCompanies')}
      icon={<BankOutlined />}
      noPadding
      fade={topProductionCompanies.length > 8}
    >
      <ul className="mb-top-companies-list">
        {topProductionCompanies.slice(0, 8).map((c) => {
          const pct = Math.round((c.count / max) * 100);
          return (
            <li key={c.name} className="mb-top-companies-list__item">
              <div className="mb-top-companies-list__row">
                <span className="mb-top-companies-list__name">{c.name}</span>
                <span className="mb-top-companies-list__count">{c.count}</span>
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
    </Widget>
  );
}
