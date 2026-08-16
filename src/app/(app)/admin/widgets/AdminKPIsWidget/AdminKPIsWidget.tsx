'use client';

import {
  AppstoreOutlined,
  ReadOutlined,
  CommentOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { Widget } from '@/components/dashboard';
import { StatCard } from '@/components/design-system';
import { useLocale } from '@/lib/providers/LocaleProvider';

export interface AdminKPIsWidgetProps {
  series: number;
  reviews: number;
  comments: number;
  users: number;
}

export function AdminKPIsWidget({
  series,
  reviews,
  comments,
  users,
}: AdminKPIsWidgetProps) {
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
          label={t('adminDashboard.kpiSeries')}
          value={series}
          icon={<AppstoreOutlined />}
        />
        <StatCard
          label={t('adminDashboard.kpiReviews')}
          value={reviews}
          icon={<ReadOutlined />}
        />
        <StatCard
          label={t('adminDashboard.kpiComments')}
          value={comments}
          icon={<CommentOutlined />}
        />
        <StatCard
          label={t('adminDashboard.kpiUsers')}
          value={users}
          icon={<TeamOutlined />}
        />
      </div>
    </Widget>
  );
}
