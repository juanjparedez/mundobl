'use client';

import Link from 'next/link';
import {
  ExclamationCircleOutlined,
  FileTextOutlined,
  PlayCircleOutlined,
  CommentOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import { Widget } from '@/components/dashboard';
import { ActionCard, EmptyState } from '@/components/design-system';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { interpolateMessage } from '@/lib/i18n-format';
import './AdminAlertsWidget.css';

export interface AdminAlertsWidgetProps {
  seriesWithoutReview: number;
  seriesWithoutContent: number;
  commentsReported: number;
  suggestedSitesPending: number;
}

export function AdminAlertsWidget({
  seriesWithoutReview,
  seriesWithoutContent,
  commentsReported,
  suggestedSitesPending,
}: AdminAlertsWidgetProps) {
  const { t } = useLocale();

  const alerts: Array<{
    href: string;
    icon: React.ReactNode;
    title: string;
    count: number;
  }> = [];

  if (seriesWithoutReview > 0) {
    alerts.push({
      href: '/admin/series',
      icon: <FileTextOutlined />,
      title: interpolateMessage(t('adminDashboard.alertSeriesWithoutReview'), {
        count: seriesWithoutReview,
      }),
      count: seriesWithoutReview,
    });
  }
  if (seriesWithoutContent > 0) {
    alerts.push({
      href: '/admin/series',
      icon: <PlayCircleOutlined />,
      title: interpolateMessage(t('adminDashboard.alertSeriesWithoutContent'), {
        count: seriesWithoutContent,
      }),
      count: seriesWithoutContent,
    });
  }
  if (commentsReported > 0) {
    alerts.push({
      href: '/admin/comentarios',
      icon: <CommentOutlined />,
      title: interpolateMessage(t('adminDashboard.alertCommentsReported'), {
        count: commentsReported,
      }),
      count: commentsReported,
    });
  }
  if (suggestedSitesPending > 0) {
    alerts.push({
      href: '/admin/sitios',
      icon: <LinkOutlined />,
      title: interpolateMessage(
        t('adminDashboard.alertSuggestedSitesPending'),
        { count: suggestedSitesPending }
      ),
      count: suggestedSitesPending,
    });
  }

  if (alerts.length === 0) {
    return (
      <Widget
        title={t('adminDashboard.alertsTitle')}
        icon={<ExclamationCircleOutlined />}
      >
        <EmptyState
          title={t('adminDashboard.alertsEmpty')}
          variant="soft"
          fullHeight={false}
        />
      </Widget>
    );
  }

  return (
    <Widget
      title={t('adminDashboard.alertsTitle')}
      icon={<ExclamationCircleOutlined />}
      noPadding
    >
      <div className="mb-admin-alerts-widget">
        {alerts.map((alert) => (
          <Link
            key={alert.title}
            href={alert.href}
            style={{ textDecoration: 'none' }}
          >
            <ActionCard
              icon={alert.icon}
              title={alert.title}
              accent="#faad14"
              featured={alert.count > 5}
            />
          </Link>
        ))}
      </div>
    </Widget>
  );
}
