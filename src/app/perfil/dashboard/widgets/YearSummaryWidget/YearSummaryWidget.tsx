'use client';

import { Widget } from '@/components/dashboard';
import { OverviewYearSummary } from '../../../overview/sections/YearSummary';
import type { ProfileData } from '../../../types';

export interface YearSummaryWidgetProps {
  stats: ProfileData['stats'];
}

/** Widget wrapper de la section "Resumen anual" del overview. KPIs del
 *  año actual: vistos, horas, reseñas, ratings. */
export function YearSummaryWidget({ stats }: YearSummaryWidgetProps) {
  return (
    <Widget noPadding>
      <OverviewYearSummary stats={stats} />
    </Widget>
  );
}
