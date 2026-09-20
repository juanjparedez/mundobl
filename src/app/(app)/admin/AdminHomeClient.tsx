'use client';

import { useMemo, useState } from 'react';
import {
  DashboardEditToolbar,
  DashboardGrid,
  WidgetPickerDrawer,
  WidgetRegistry,
  useDashboardLayout,
  type DashboardLayouts,
} from '@/components/dashboard';
import { AdminNav } from './AdminNav';
import {
  AdminShortcuts,
  type AdminShortcutMetric,
} from './AdminShortcuts/AdminShortcuts';
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

// Constante module-level (no inline en el hook): la usa un efecto como
// dependencia y un array nuevo en cada render lo re-dispararia.
const PURGED_LAYOUT_KEYS = ['admin-home-v2'];

// Orden por defecto: la razon dominante para entrar a /admin es "que
// tengo pendiente" (hoy: 647 series sin resena, 204 sin contenido), asi
// que las alertas accionables van al punto de anclaje de la lectura
// (arriba-izquierda) y los KPIs —numeros que no piden ninguna accion—
// quedan al lado como contexto. Despues la tendencia (chart), despues
// auditoria (quien toco que) y al final la metrica menos accionable.
//
// Los `h` son solo una semilla para el primer frame: el Widget mide su
// contenido real y el grid ajusta (ver DashboardItemHeightMode). Por eso
// no hace falta afinarlos a mano por breakpoint como antes.
const DEFAULT_LAYOUTS: DashboardLayouts = {
  lg: [
    { i: WIDGET_IDS.alerts, x: 0, y: 0, w: 4, h: 3 },
    { i: WIDGET_IDS.kpis, x: 4, y: 0, w: 8, h: 3 },
    { i: WIDGET_IDS.activityChart, x: 0, y: 3, w: 8, h: 3 },
    { i: WIDGET_IDS.recentActivity, x: 8, y: 3, w: 4, h: 3 },
    { i: WIDGET_IDS.topCommenters, x: 0, y: 6, w: 12, h: 3 },
  ],
  md: [
    { i: WIDGET_IDS.alerts, x: 0, y: 0, w: 4, h: 3 },
    { i: WIDGET_IDS.kpis, x: 4, y: 0, w: 6, h: 3 },
    { i: WIDGET_IDS.activityChart, x: 0, y: 3, w: 6, h: 3 },
    { i: WIDGET_IDS.recentActivity, x: 6, y: 3, w: 4, h: 3 },
    { i: WIDGET_IDS.topCommenters, x: 0, y: 6, w: 10, h: 3 },
  ],
  sm: [
    { i: WIDGET_IDS.alerts, x: 0, y: 0, w: 6, h: 3 },
    { i: WIDGET_IDS.kpis, x: 0, y: 3, w: 6, h: 3 },
    { i: WIDGET_IDS.activityChart, x: 0, y: 6, w: 6, h: 3 },
    { i: WIDGET_IDS.recentActivity, x: 0, y: 9, w: 6, h: 3 },
    { i: WIDGET_IDS.topCommenters, x: 0, y: 12, w: 6, h: 3 },
  ],
  xs: [
    { i: WIDGET_IDS.alerts, x: 0, y: 0, w: 4, h: 3 },
    { i: WIDGET_IDS.kpis, x: 0, y: 3, w: 4, h: 3 },
    { i: WIDGET_IDS.activityChart, x: 0, y: 6, w: 4, h: 3 },
    { i: WIDGET_IDS.recentActivity, x: 0, y: 9, w: 4, h: 3 },
    { i: WIDGET_IDS.topCommenters, x: 0, y: 12, w: 4, h: 3 },
  ],
  // xxs (<480px en la practica, cols: 2). Sin entrada explicita RGL lo
  // deriva de xs y clampea w:4 → 2, con posiciones impredecibles.
  xxs: [
    { i: WIDGET_IDS.alerts, x: 0, y: 0, w: 2, h: 3 },
    { i: WIDGET_IDS.kpis, x: 0, y: 3, w: 2, h: 3 },
    { i: WIDGET_IDS.activityChart, x: 0, y: 6, w: 2, h: 3 },
    { i: WIDGET_IDS.recentActivity, x: 0, y: 9, w: 2, h: 3 },
    { i: WIDGET_IDS.topCommenters, x: 0, y: 12, w: 2, h: 3 },
  ],
};

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
  metrics: Record<string, AdminShortcutMetric | undefined>;
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
  metrics,
  kpiCounts,
}: AdminHomeClientProps) {
  const [editing, setEditing] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  // Bump v2 → v3 (2026-09-20): hasta v2 el grid persistia la altura
  // AUTOMATICA de cada widget como si fuera preferencia del usuario —
  // react-grid-layout dispara onLayoutChange tambien cuando cambia la
  // prop `layouts`, no solo por interaccion, asi que la primera medicion
  // de cada carga se guardaba sola. Resultado: todo el que abrio /admin
  // una vez tiene un layout guardado que nunca pidio, indistinguible de
  // una personalizacion real. No hay nada rescatable que migrar, por eso
  // se purga v2 en vez de dejar la fila huerfana en la DB.
  const { layouts, setLayouts, removeWidget, addWidget, reset, widgetIds } =
    useDashboardLayout('admin-home-v3', DEFAULT_LAYOUTS, {
      purgeKeys: PURGED_LAYOUT_KEYS,
    });

  useMemo(() => {
    WidgetRegistry.register({
      id: WIDGET_IDS.kpis,
      category: 'overview',
      labelKey: 'adminDashboard.widgetKPIs',
      descriptionKey: 'adminDashboard.widgetKPIsDesc',
      defaultSize: { w: 8, h: 3, minW: 3, minH: 2 },
      Component: AdminKPIsWidget as never,
      roles: ['ADMIN', 'MODERATOR'],
    });
    WidgetRegistry.register({
      id: WIDGET_IDS.alerts,
      category: 'admin',
      labelKey: 'adminDashboard.widgetAlerts',
      descriptionKey: 'adminDashboard.widgetAlertsDesc',
      defaultSize: { w: 4, h: 3, minW: 3, minH: 2 },
      Component: AdminAlertsWidget as never,
      roles: ['ADMIN', 'MODERATOR'],
    });
    WidgetRegistry.register({
      id: WIDGET_IDS.recentActivity,
      category: 'activity',
      labelKey: 'adminActivity.title',
      descriptionKey: 'adminActivity.title',
      defaultSize: { w: 4, h: 3, minW: 3, minH: 2 },
      Component: RecentAdminActivityWidget as never,
      roles: ['ADMIN', 'MODERATOR'],
    });
    WidgetRegistry.register({
      id: WIDGET_IDS.topCommenters,
      category: 'social',
      labelKey: 'topCommenters.title',
      descriptionKey: 'topCommenters.title',
      defaultSize: { w: 6, h: 3, minW: 3, minH: 2 },
      Component: TopCommentersWidget as never,
      roles: ['ADMIN', 'MODERATOR'],
    });
    WidgetRegistry.register({
      id: WIDGET_IDS.activityChart,
      category: 'activity',
      labelKey: 'activityChart.title',
      descriptionKey: 'activityChart.title',
      // Un chart necesita ancho para ser legible: minW mas alto que el
      // resto a proposito (con menos, los ticks del eje X se pisan).
      defaultSize: { w: 8, h: 3, minW: 4, minH: 3 },
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
      // Los contadores ya vienen resueltos del server: el widget no
      // necesita su propio fetch a /api/admin/alerts.
      [WIDGET_IDS.alerts]: {
        initialData: {
          seriesWithoutReview: kpiCounts.seriesWithoutReview,
          seriesWithoutContent: kpiCounts.seriesWithoutContent,
          commentsReported: kpiCounts.commentsReported,
          suggestedSitesPending: kpiCounts.suggestedSitesPending,
        },
      },
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

        {/* Dashboard configurable: KPIs + Alerts + RecentActivity. El
         *  toolbar de edicion se monto dentro del hero (prop editToolbar)
         *  para evitar quedar flotando suelto encima del grid.
         *
         *  Antes habia ademas una tira de "headline alerts" arriba del
         *  grid que mostraba EXACTAMENTE los mismos 4 contadores que el
         *  widget de alertas: dos superficies para el mismo dato, una
         *  instantanea y otra con spinner. Quedo solo el widget (que se
         *  puede mover, ocultar y redimensionar), alimentado con los
         *  contadores que el Server Component ya calculo. */}

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

        {/* Atajos de navegacion. Los destinos salen del registro unico
         *  (adminDestinations), el mismo que alimenta AdminNav — antes
         *  eran dos listas paralelas que se desincronizaban. El orden de
         *  cada grupo lo personaliza el usuario arrastrando en modo
         *  edicion, igual que los widgets de arriba. */}
        <AdminShortcuts metrics={metrics} editing={editing} />
      </div>
    </div>
  );
}
