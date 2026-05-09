'use client';

import {
  StarOutlined,
  ReadOutlined,
  CommentOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { Widget } from '@/components/dashboard';
import { StatCard } from '@/components/design-system';
import { useLocale } from '@/lib/providers/LocaleProvider';
import type { ProfileData } from '../../../types';
import './RatingsWidget.css';

export interface RatingsWidgetProps {
  stats: ProfileData['stats'];
}

export function RatingsWidget({ stats }: RatingsWidgetProps) {
  const { t } = useLocale();
  return (
    <Widget title={t('profileDashboard.widgetRatings')} noPadding>
      <div className="mb-ratings-widget">
        <StatCard
          label={t('profileDashboard.avgRating')}
          value={stats.avgRating != null ? stats.avgRating.toFixed(1) : '—'}
          icon={<StarOutlined />}
        />
        <StatCard
          label={t('profile.statReviews')}
          value={stats.reviews}
          icon={<ReadOutlined />}
        />
        <StatCard
          label={t('profile.statComments')}
          value={stats.comments}
          icon={<CommentOutlined />}
        />
        <StatCard
          label={t('profileDashboard.hoursWatched')}
          value={Math.round(stats.hoursWatched)}
          icon={<ClockCircleOutlined />}
        />
      </div>
    </Widget>
  );
}
