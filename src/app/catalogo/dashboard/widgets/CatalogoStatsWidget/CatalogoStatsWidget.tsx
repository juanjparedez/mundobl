'use client';

import {
  AppstoreOutlined,
  PlayCircleOutlined,
  TeamOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import { Widget } from '@/components/dashboard';
import { StatCard } from '@/components/design-system';
import { useLocale } from '@/lib/providers/LocaleProvider';

export interface CatalogoStatsWidgetProps {
  totalSeries: number;
  totalSeasons: number;
  totalEpisodes: number;
  totalActors: number;
  totalCountries: number;
}

export function CatalogoStatsWidget({
  totalSeries,
  totalSeasons,
  totalEpisodes,
  totalActors,
  totalCountries,
}: CatalogoStatsWidgetProps) {
  const { t } = useLocale();
  return (
    <Widget noPadding>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 'var(--spacing-sm)',
          padding: 'var(--spacing-md)',
          height: '100%',
        }}
      >
        <StatCard
          label={t('catalogoDashboard.totalSeries')}
          value={totalSeries}
          icon={<AppstoreOutlined />}
        />
        <StatCard
          label={t('catalogoDashboard.totalSeasons')}
          value={totalSeasons}
          icon={<PlayCircleOutlined />}
        />
        <StatCard
          label={t('catalogoDashboard.totalEpisodes')}
          value={totalEpisodes}
          icon={<PlayCircleOutlined />}
        />
        <StatCard
          label={t('catalogoDashboard.totalActors')}
          value={totalActors}
          icon={<TeamOutlined />}
        />
        <StatCard
          label={t('catalogoDashboard.totalCountries')}
          value={totalCountries}
          icon={<GlobalOutlined />}
        />
      </div>
    </Widget>
  );
}
