'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  DashboardEditToolbar,
  DashboardGrid,
  WidgetPickerDrawer,
  WidgetRegistry,
  useDashboardLayout,
  type DashboardLayouts,
} from '@/components/dashboard';
import { AdminNav } from './AdminNav';
import { AdminDashboardHero } from './AdminDashboardHero';
import { AdminKPIsWidget } from './widgets/AdminKPIsWidget/AdminKPIsWidget';
import { AdminAlertsWidget } from './widgets/AdminAlertsWidget/AdminAlertsWidget';
import { RecentAdminActivityWidget } from './widgets/RecentAdminActivityWidget/RecentAdminActivityWidget';
import { TopCommentersWidget } from './widgets/TopCommentersWidget/TopCommentersWidget';
import { ActivityChartWidget } from './widgets/ActivityChartWidget/ActivityChartWidget';
import type { ReactNode } from 'react';

const WIDGET_IDS = {
  kpis: 'admin.kpis',
  alerts: 'admin.alerts',
  recentActivity: 'admin.recentActivity',
  topCommenters: 'admin.topCommenters',
  activityChart: 'admin.activityChart',
} as const;

const DEFAULT_LAYOUTS: DashboardLayouts = {
  lg: [
    { i: WIDGET_IDS.kpis, x: 0, y: 0, w: 7, h: 3 },
    { i: WIDGET_IDS.alerts, x: 7, y: 0, w: 5, h: 5 },
    { i: WIDGET_IDS.activityChart, x: 0, y: 3, w: 7, h: 5 },
    { i: WIDGET_IDS.recentActivity, x: 0, y: 8, w: 6, h: 5 },
    { i: WIDGET_IDS.topCommenters, x: 6, y: 8, w: 6, h: 5 },
  ],
  md: [
    { i: WIDGET_IDS.kpis, x: 0, y: 0, w: 10, h: 3 },
    { i: WIDGET_IDS.alerts, x: 0, y: 3, w: 5, h: 5 },
    { i: WIDGET_IDS.activityChart, x: 5, y: 3, w: 5, h: 5 },
    { i: WIDGET_IDS.recentActivity, x: 0, y: 8, w: 5, h: 5 },
    { i: WIDGET_IDS.topCommenters, x: 5, y: 8, w: 5, h: 5 },
  ],
  sm: [
    { i: WIDGET_IDS.kpis, x: 0, y: 0, w: 6, h: 3 },
    { i: WIDGET_IDS.alerts, x: 0, y: 3, w: 6, h: 5 },
    { i: WIDGET_IDS.activityChart, x: 0, y: 8, w: 6, h: 5 },
    { i: WIDGET_IDS.recentActivity, x: 0, y: 13, w: 6, h: 5 },
    { i: WIDGET_IDS.topCommenters, x: 0, y: 18, w: 6, h: 5 },
  ],
  // xs (<480px): KPIs como 2x2 stack necesitan h: 7 para no recortar
  // los StatCards de la fila inferior. Chart y listas requieren h: 7
  // tambien o el contenido de adentro se trunca con overflow hidden.
  xs: [
    { i: WIDGET_IDS.kpis, x: 0, y: 0, w: 4, h: 7 },
    { i: WIDGET_IDS.alerts, x: 0, y: 7, w: 4, h: 6 },
    { i: WIDGET_IDS.activityChart, x: 0, y: 13, w: 4, h: 7 },
    { i: WIDGET_IDS.recentActivity, x: 0, y: 20, w: 4, h: 7 },
    { i: WIDGET_IDS.topCommenters, x: 0, y: 27, w: 4, h: 7 },
  ],
};

interface ToolCard {
  href: string;
  icon: string;
  title: string;
  count?: number;
  alert?: { count: number; label: string };
}

interface ToolGroup {
  title: string;
  tools: ToolCard[];
}

interface HeadlineAlert {
  key: string;
  icon: string;
  label: string;
  href: string;
  tone: 'danger' | 'warning' | 'info';
}

interface KPICounts {
  series: number;
  reviews: number;
  comments: number;
  users: number;
  seriesWithoutReview: number;
  seriesWithoutContent: number;
  commentsReported: number;
  suggestedSitesPending: number;
}

export interface AdminHomeClientProps {
  heroStats: Array<{ label: string; value: number; icon: ReactNode }>;
  groups: ToolGroup[];
  headlineAlerts: HeadlineAlert[];
  kpiCounts: KPICounts;
}

/** Admin home /admin con dashboard configurable (widgets reordenables
 *  via grid + WidgetPicker) ENCIMA de los tool cards de navegacion.
 *  La configurabilidad fue removida en commit 57149a5 cuando unifique
 *  /admin/dashboard en /perfil — restaurada acá para no perder esa
 *  funcionalidad. /admin sigue siendo el panel de gestion con tool nav
 *  abajo + ahora dashboard real arriba. */
export function AdminHomeClient({
  heroStats,
  groups,
  headlineAlerts,
  kpiCounts,
}: AdminHomeClientProps) {
  const [editing, setEditing] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  // Bump v1 → v2 (2026-05-14): xs heights updated para que KPI cards
  // 2x2 y listas no se recorten en mobile. Sin bump, users con layout
  // guardado en localStorage seguirian con h:4 y verian widgets cortados.
  const { layouts, setLayouts, removeWidget, addWidget, reset, widgetIds } =
    useDashboardLayout('admin-home-v2', DEFAULT_LAYOUTS);

  useMemo(() => {
    WidgetRegistry.register({
      id: WIDGET_IDS.kpis,
      category: 'overview',
      labelKey: 'adminDashboard.widgetKPIs',
      descriptionKey: 'adminDashboard.widgetKPIsDesc',
      defaultSize: { w: 7, h: 3, minW: 4, minH: 3 },
      Component: AdminKPIsWidget as never,
      roles: ['ADMIN', 'MODERATOR'],
    });
    WidgetRegistry.register({
      id: WIDGET_IDS.alerts,
      category: 'admin',
      labelKey: 'adminDashboard.widgetAlerts',
      descriptionKey: 'adminDashboard.widgetAlertsDesc',
      defaultSize: { w: 5, h: 5, minW: 4, minH: 4 },
      Component: AdminAlertsWidget as never,
      roles: ['ADMIN', 'MODERATOR'],
    });
    WidgetRegistry.register({
      id: WIDGET_IDS.recentActivity,
      category: 'activity',
      labelKey: 'adminActivity.title',
      descriptionKey: 'adminActivity.title',
      defaultSize: { w: 7, h: 5, minW: 4, minH: 4 },
      Component: RecentAdminActivityWidget as never,
      roles: ['ADMIN', 'MODERATOR'],
    });
    WidgetRegistry.register({
      id: WIDGET_IDS.topCommenters,
      category: 'social',
      labelKey: 'topCommenters.title',
      descriptionKey: 'topCommenters.title',
      defaultSize: { w: 6, h: 5, minW: 4, minH: 4 },
      Component: TopCommentersWidget as never,
      roles: ['ADMIN', 'MODERATOR'],
    });
    WidgetRegistry.register({
      id: WIDGET_IDS.activityChart,
      category: 'activity',
      labelKey: 'activityChart.title',
      descriptionKey: 'activityChart.title',
      defaultSize: { w: 7, h: 5, minW: 4, minH: 4 },
      Component: ActivityChartWidget as never,
      roles: ['ADMIN', 'MODERATOR'],
    });
  }, []);

  const widgetProps = useMemo<Record<string, Record<string, unknown>>>(
    () => ({
      [WIDGET_IDS.kpis]: {
        series: kpiCounts.series,
        reviews: kpiCounts.reviews,
        comments: kpiCounts.comments,
        users: kpiCounts.users,
      },
      [WIDGET_IDS.alerts]: {},
      [WIDGET_IDS.recentActivity]: {},
      [WIDGET_IDS.topCommenters]: {},
      [WIDGET_IDS.activityChart]: {},
    }),
    [kpiCounts]
  );

  return (
    <div className="admin-page-wrapper">
      <AdminNav />
      <div className="admin-dashboard">
        <AdminDashboardHero
          stats={heroStats}
          editToolbar={
            <DashboardEditToolbar
              editing={editing}
              onToggleEditing={() => setEditing((v) => !v)}
              onAddWidget={() => setPickerOpen(true)}
              onReset={reset}
            />
          }
        />

        {headlineAlerts.length > 0 && (
          <div className="admin-dashboard__alerts">
            {headlineAlerts.map((alert) => (
              <Link
                key={alert.key}
                href={alert.href}
                className={`admin-dashboard__alert admin-dashboard__alert--${alert.tone}`}
              >
                <span className="admin-dashboard__alert-icon">
                  {alert.icon}
                </span>
                <span>{alert.label}</span>
                <span className="admin-dashboard__alert-arrow">→</span>
              </Link>
            ))}
          </div>
        )}
        {/* Dashboard configurable: KPIs + Alerts + RecentActivity. El
         *  toolbar de edicion se monto dentro del hero (prop editToolbar)
         *  para evitar quedar flotando suelto encima del grid. */}

        <DashboardGrid
          layouts={layouts}
          widgetProps={widgetProps}
          editing={editing}
          onLayoutsChange={setLayouts}
          onRemoveWidget={removeWidget}
          rowHeight={36}
          gap={10}
        />

        <WidgetPickerDrawer
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          onPick={addWidget}
          alreadyAdded={widgetIds}
        />

        {/* Tool cards de navegacion — sin tocar, mismo grupo data
         *  que ya existía. Quedan debajo del dashboard configurable
         *  como atajos rapidos. */}
        {groups.map((group) => (
          <section
            key={group.title}
            className="admin-dashboard__section"
            data-group={group.title.toLowerCase()}
          >
            <h2 className="admin-dashboard__section-title">{group.title}</h2>
            <div className="admin-dashboard__grid">
              {group.tools.map((tool) => (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className="admin-tool-card"
                >
                  <div className="admin-tool-card__head">
                    <span className="admin-tool-card__icon">{tool.icon}</span>
                    {tool.count !== undefined && (
                      <span className="admin-tool-card__count">
                        {tool.count}
                      </span>
                    )}
                  </div>
                  <div className="admin-tool-card__title">{tool.title}</div>
                  {tool.alert && (
                    <div className="admin-tool-card__alert">
                      {tool.alert.count} {tool.alert.label}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
