'use client';

import {
  EyeOutlined,
  PlayCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { Widget } from '@/components/dashboard';
import { StatCard } from '@/components/design-system';
import { useLocale } from '@/lib/providers/LocaleProvider';
import type { ProfileData } from '../../../types';
import './OverviewWidget.css';

export interface OverviewWidgetProps {
  stats: ProfileData['stats'];
}

export function OverviewWidget({ stats }: OverviewWidgetProps) {
  const { t } = useLocale();
  return (
    <Widget title={t('profileDashboard.widgetOverview')} noPadding>
      <div className="mb-overview-widget">
        <StatCard
          label={t('profile.statWatched')}
          value={stats.watched}
          icon={<EyeOutlined />}
        />
        <StatCard
          label={t('profile.statWatching')}
          value={stats.watching}
          icon={<PlayCircleOutlined />}
        />
        <StatCard
          label={t('profile.statAbandoned')}
          value={stats.abandoned}
          icon={<CloseCircleOutlined />}
        />
        <StatCard
          label={t('profile.statToRewatch')}
          value={stats.toRewatch}
          icon={<ReloadOutlined />}
        />
      </div>
    </Widget>
  );
}
