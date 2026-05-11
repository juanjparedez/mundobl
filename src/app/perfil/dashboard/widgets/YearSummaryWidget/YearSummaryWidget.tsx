'use client';

import { CalendarOutlined } from '@ant-design/icons';
import { Widget } from '@/components/dashboard';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { OverviewYearSummary } from '../../../overview/sections/YearSummary';
import type { ProfileData } from '../../../types';

export interface YearSummaryWidgetProps {
  stats: ProfileData['stats'];
}

/** Widget "Resumen anual". KPIs del año actual: vistos, horas, reseñas,
 *  ratings. El year badge va como Widget action. */
export function YearSummaryWidget({ stats }: YearSummaryWidgetProps) {
  const { t } = useLocale();
  const currentYear = new Date().getFullYear();
  return (
    <Widget
      title={t('profile.sectionYearSummary')}
      icon={<CalendarOutlined />}
      noPadding
      actions={<span className="overview-year__year">{currentYear}</span>}
    >
      <OverviewYearSummary stats={stats} />
    </Widget>
  );
}
