'use client';

import { CalendarOutlined } from '@ant-design/icons';
import { Widget } from '@/components/dashboard';
import { HeatmapCalendar } from '@/components/charts';
import { useLocale } from '@/lib/providers/LocaleProvider';

export interface HeatmapWidgetProps {
  /** Lista de fechas ISO (YYYY-MM-DD) con actividad. */
  heatmap: string[];
}

export function HeatmapWidget({ heatmap }: HeatmapWidgetProps) {
  const { t } = useLocale();
  return (
    <Widget
      title={t('profileDashboard.widgetHeatmap')}
      icon={<CalendarOutlined />}
    >
      <HeatmapCalendar values={heatmap} weeks={26} />
    </Widget>
  );
}
