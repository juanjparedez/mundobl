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
import {
  ActionCard,
  AutoFitList,
  EmptyState,
} from '@/components/design-system';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { interpolateMessage } from '@/lib/i18n-format';
import './AdminAlertsWidget.css';

interface AdminAlertsData {
  seriesWithoutReview: number;
  seriesWithoutContent: number;
  commentsReported: number;
  suggestedSitesPending: number;
}

export interface AdminAlertsWidgetProps {
  /** Contadores ya resueltos en el server. Si se omite, el widget hace
   *  su propio fetch (es el caso de /perfil, que es client-side). En
   *  /admin los datos ya vienen del Server Component, asi que pasarlos
   *  evita el spinner y el round-trip para el dato mas importante de la
   *  pagina. */
  initialData?: AdminAlertsData;
}

/** Alerts accionables para admins (vivia en /admin/dashboard, ahora
 *  unificado al perfil admin). Sin initialData hace fetch propio a
 *  /api/admin/alerts; si el user no es admin/moderator el endpoint
 *  responde 403 y el widget queda en estado vacio (asi no rompe el
 *  layout si por error se rendea en un perfil non-admin). */
export function AdminAlertsWidget({ initialData }: AdminAlertsWidgetProps) {
  const { t } = useLocale();
  const [data, setData] = useState<AdminAlertsData | null>(initialData ?? null);
  const [loaded, setLoaded] = useState(Boolean(initialData));

  useEffect(() => {
    if (initialData) return;
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
  }, [initialData]);

  if (!loaded) {
    return (
      <Widget
        title={t('adminDashboard.alertsTitle')}
        icon={<ExclamationCircleOutlined />}
      >
        <div className="mb-admin-alerts-widget__loading">
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
    accent: string;
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
        accent: 'var(--primary-color)',
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
        accent: 'var(--warning-color)',
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
        accent: 'var(--error-color)',
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
        accent: 'var(--warning-color)',
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
      <AutoFitList
        as="ul"
        collapsedCount={2}
        listClassName="mb-admin-alerts-widget"
        viewLessLabel={t('profile.overviewViewLess')}
        viewMoreLabel={(count) =>
          interpolateMessage(t('profile.overviewViewAllCount'), {
            count: String(count),
          })
        }
      >
        {alerts.map((alert) => (
          <li key={alert.title}>
            <Link href={alert.href} className="mb-admin-alerts-widget__link">
              <ActionCard
                icon={alert.icon}
                title={alert.title}
                accent={alert.accent}
                featured={alert.count > 5}
              />
            </Link>
          </li>
        ))}
      </AutoFitList>
    </Widget>
  );
}
