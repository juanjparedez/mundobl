'use client';

import { TagsOutlined } from '@ant-design/icons';
import { Widget } from '@/components/dashboard';
import { EmptyState } from '@/components/design-system';
import { DonutChart } from '@/components/charts';
import { useLocale } from '@/lib/providers/LocaleProvider';
import type { ProfileData } from '../../../types';

export interface GenresDonutWidgetProps {
  topGenres: ProfileData['stats']['topGenres'];
}

export function GenresDonutWidget({ topGenres }: GenresDonutWidgetProps) {
  const { t } = useLocale();

  if (!topGenres || topGenres.length === 0) {
    return (
      <Widget
        title={t('profileDashboard.widgetGenres')}
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

  const total = topGenres.reduce((s, g) => s + g.count, 0);

  return (
    <Widget title={t('profileDashboard.widgetGenres')} icon={<TagsOutlined />}>
      <DonutChart
        data={topGenres.slice(0, 6).map((g) => ({
          name: g.name,
          value: g.count,
        }))}
        centerLabel={{
          value: total,
          sublabel: t('profileDashboard.genresTotalLabel'),
        }}
        height={130}
        innerRadius={32}
        outerRadius={52}
        showLegend={false}
      />
    </Widget>
  );
}
