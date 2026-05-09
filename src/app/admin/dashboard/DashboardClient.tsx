'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { SectionHeader } from '@/components/design-system';
import {
  DashboardEditToolbar,
  DashboardGrid,
  WidgetPickerDrawer,
  WidgetRegistry,
  useDashboardLayout,
  type DashboardLayouts,
} from '@/components/dashboard';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { AdminKPIsWidget } from './widgets/AdminKPIsWidget/AdminKPIsWidget';
import { AdminAlertsWidget } from './widgets/AdminAlertsWidget/AdminAlertsWidget';

const WIDGET_IDS = {
  kpis: 'admin.kpis',
  alerts: 'admin.alerts',
} as const;

const DEFAULT_LAYOUTS: DashboardLayouts = {
  lg: [
    { i: WIDGET_IDS.kpis, x: 0, y: 0, w: 7, h: 4, minW: 4, minH: 3 },
    { i: WIDGET_IDS.alerts, x: 7, y: 0, w: 5, h: 6, minW: 4, minH: 4 },
  ],
  md: [
    { i: WIDGET_IDS.kpis, x: 0, y: 0, w: 6, h: 4 },
    { i: WIDGET_IDS.alerts, x: 6, y: 0, w: 4, h: 6 },
  ],
  sm: [
    { i: WIDGET_IDS.kpis, x: 0, y: 0, w: 6, h: 4 },
    { i: WIDGET_IDS.alerts, x: 0, y: 4, w: 6, h: 6 },
  ],
  xs: [
    { i: WIDGET_IDS.kpis, x: 0, y: 0, w: 4, h: 6 },
    { i: WIDGET_IDS.alerts, x: 0, y: 6, w: 4, h: 6 },
  ],
};

export interface AdminDashboardClientProps {
  series: number;
  reviews: number;
  comments: number;
  users: number;
  seriesWithoutReview: number;
  seriesWithoutContent: number;
  commentsReported: number;
  suggestedSitesPending: number;
}

export function AdminDashboardClient(props: AdminDashboardClientProps) {
  const { t } = useLocale();
  const [editing, setEditing] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const { layouts, setLayouts, removeWidget, addWidget, reset, widgetIds } =
    useDashboardLayout('admin-home', DEFAULT_LAYOUTS);

  useMemo(() => {
    WidgetRegistry.register({
      id: WIDGET_IDS.kpis,
      category: 'overview',
      labelKey: 'adminDashboard.widgetKPIs',
      descriptionKey: 'adminDashboard.widgetKPIsDesc',
      defaultSize: { w: 7, h: 4, minW: 4, minH: 3 },
      Component: AdminKPIsWidget as never,
      roles: ['ADMIN', 'MODERATOR'],
      modes: ['admin'],
    });
    WidgetRegistry.register({
      id: WIDGET_IDS.alerts,
      category: 'admin',
      labelKey: 'adminDashboard.widgetAlerts',
      descriptionKey: 'adminDashboard.widgetAlertsDesc',
      defaultSize: { w: 5, h: 6, minW: 4, minH: 4 },
      Component: AdminAlertsWidget as never,
      roles: ['ADMIN', 'MODERATOR'],
      modes: ['admin'],
    });
  }, []);

  const widgetProps = useMemo<Record<string, Record<string, unknown>>>(() => {
    const map: Record<string, Record<string, unknown>> = {};
    map[WIDGET_IDS.kpis] = {
      series: props.series,
      reviews: props.reviews,
      comments: props.comments,
      users: props.users,
    };
    map[WIDGET_IDS.alerts] = {
      seriesWithoutReview: props.seriesWithoutReview,
      seriesWithoutContent: props.seriesWithoutContent,
      commentsReported: props.commentsReported,
      suggestedSitesPending: props.suggestedSitesPending,
    };
    return map;
  }, [props]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <SectionHeader
        as="h1"
        size="lg"
        title={t('adminDashboard.title')}
        subtitle={t('adminDashboard.subtitle')}
        actions={
          <Link href="/admin">
            <Button icon={<ArrowLeftOutlined />}>
              {t('adminDashboard.backToClassic')}
            </Button>
          </Link>
        }
      />

      <DashboardEditToolbar
        editing={editing}
        onToggleEditing={() => setEditing((v) => !v)}
        onAddWidget={() => setPickerOpen(true)}
        onReset={reset}
      />

      <DashboardGrid
        layouts={layouts}
        widgetProps={widgetProps}
        editing={editing}
        onLayoutsChange={setLayouts}
        onRemoveWidget={removeWidget}
      />

      <WidgetPickerDrawer
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={addWidget}
        alreadyAdded={widgetIds}
        filter={{ mode: 'admin' }}
      />
    </div>
  );
}
