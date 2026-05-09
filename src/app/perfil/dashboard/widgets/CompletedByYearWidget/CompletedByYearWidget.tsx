'use client';

import { LineChartOutlined } from '@ant-design/icons';
import { Widget } from '@/components/dashboard';
import { EmptyState } from '@/components/design-system';
import { LineChart } from '@/components/charts';
import { useLocale } from '@/lib/providers/LocaleProvider';
import type { ProfileData } from '../../../types';

export interface CompletedByYearWidgetProps {
  completedByYear: ProfileData['stats']['completedByYear'];
}

export function CompletedByYearWidget({
  completedByYear,
}: CompletedByYearWidgetProps) {
  const { t } = useLocale();

  const data = (completedByYear ?? [])
    .filter((row) => row.year != null)
    .map((row) => ({ year: row.year as number, count: row.count }))
    .sort((a, b) => a.year - b.year);

  if (data.length === 0) {
    return (
      <Widget
        title={t('profileDashboard.widgetCompletedByYear')}
        icon={<LineChartOutlined />}
      >
        <EmptyState
          title={t('profileDashboard.completedByYearEmpty')}
          variant="soft"
          fullHeight={false}
        />
      </Widget>
    );
  }

  return (
    <Widget
      title={t('profileDashboard.widgetCompletedByYear')}
      icon={<LineChartOutlined />}
    >
      <LineChart
        data={data}
        xAxisKey="year"
        series={[
          {
            dataKey: 'count',
            name: t('profileDashboard.completedByYearLabel'),
          },
        ]}
        height={220}
        smooth
        tooltipFormatter={(value, name) => [
          value === undefined ? '' : String(value),
          name,
        ]}
        tooltipLabelFormatter={(label) =>
          label === undefined ? '' : String(label)
        }
      />
    </Widget>
  );
}
