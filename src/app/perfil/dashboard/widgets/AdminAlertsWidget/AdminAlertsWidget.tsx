'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Spin } from 'antd';
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

interface AdminAlertsData {
  seriesWithoutReview: number;
  seriesWithoutContent: number;
  commentsReported: number;
  suggestedSitesPending: number;
}

/** Alerts accionables para admins (vivia en /admin/dashboard, ahora
 *  unificado al perfil admin). Hace fetch propio a /api/admin/alerts;
 *  si el user no es admin/moderator el endpoint responde 403 y el
 *  widget queda en estado vacio (asi mismo no rompe el layout si por
 *  error se rendea en un perfil non-admin). */
export function AdminAlertsWidget() {
  const { t } = useLocale();
  const [data, setData] = useState<AdminAlertsData | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/admin/alerts')
      .then((res) => (res.ok ? res.json() : null))
      .then((payload: AdminAlertsData | null) => {
        if (cancelled) return;
        if (payload) setData(payload);
        setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!loaded) {
    return (
      <Widget
        title={t('adminDashboard.alertsTitle')}
        icon={<ExclamationCircleOutlined />}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--spacing-md)',
          }}
        >
          <Spin />
        </div>
      </Widget>
    );
  }

  const alerts: Array<{
    href: string;
    icon: React.ReactNode;
    title: string;
    count: number;
  }> = [];

  if (data) {
    if (data.seriesWithoutReview > 0) {
      alerts.push({
        href: '/admin/series',
        icon: <FileTextOutlined />,
        title: interpolateMessage(
          t('adminDashboard.alertSeriesWithoutReview'),
          {
            count: data.seriesWithoutReview,
          }
        ),
        count: data.seriesWithoutReview,
      });
    }
    if (data.seriesWithoutContent > 0) {
      alerts.push({
        href: '/admin/series',
        icon: <PlayCircleOutlined />,
        title: interpolateMessage(
          t('adminDashboard.alertSeriesWithoutContent'),
          { count: data.seriesWithoutContent }
        ),
        count: data.seriesWithoutContent,
      });
    }
    if (data.commentsReported > 0) {
      alerts.push({
        href: '/admin/comentarios',
        icon: <CommentOutlined />,
        title: interpolateMessage(t('adminDashboard.alertCommentsReported'), {
          count: data.commentsReported,
        }),
        count: data.commentsReported,
      });
    }
    if (data.suggestedSitesPending > 0) {
      alerts.push({
        href: '/admin/sitios',
        icon: <LinkOutlined />,
        title: interpolateMessage(
          t('adminDashboard.alertSuggestedSitesPending'),
          { count: data.suggestedSitesPending }
        ),
        count: data.suggestedSitesPending,
      });
    }
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
