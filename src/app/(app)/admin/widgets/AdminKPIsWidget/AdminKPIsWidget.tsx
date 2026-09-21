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
import './AdminKPIsWidget.css';

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
      <div className="mb-admin-kpis">
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
