'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Button, Spin } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { AppLayout } from '@/components/layout/AppLayout/AppLayout';
import {
  DashboardEditToolbar,
  DashboardGrid,
  WidgetPickerDrawer,
  WidgetRegistry,
  useDashboardLayout,
  type DashboardLayouts,
} from '@/components/dashboard';
import { useLocale } from '@/lib/providers/LocaleProvider';
import type { ProfileData } from '../types';
import { ProfileDashboardHeader } from './ProfileDashboardHeader/ProfileDashboardHeader';
import { ProfileStatsStrip } from './ProfileStatsStrip/ProfileStatsStrip';
import { OverviewWidget } from './widgets/OverviewWidget/OverviewWidget';
import { RatingsWidget } from './widgets/RatingsWidget/RatingsWidget';
import { RecentlyCompletedWidget } from './widgets/RecentlyCompletedWidget/RecentlyCompletedWidget';
import { DashboardNotificationsWidget } from './widgets/NotificationsWidget/DashboardNotificationsWidget';
import { MyCasesWidget } from './widgets/MyCasesWidget/MyCasesWidget';
import { HeatmapWidget } from './widgets/HeatmapWidget/HeatmapWidget';
import { GenresDonutWidget } from './widgets/GenresDonutWidget/GenresDonutWidget';
import { CompletedByYearWidget } from './widgets/CompletedByYearWidget/CompletedByYearWidget';
import './dashboard.css';

const WIDGET_IDS = {
  overview: 'profile.overview',
  ratings: 'profile.ratings',
  recentlyCompleted: 'profile.recentlyCompleted',
  notifications: 'profile.notifications',
  myCases: 'profile.myCases',
  heatmap: 'profile.heatmap',
  genres: 'profile.genres',
  completedByYear: 'profile.completedByYear',
} as const;

const DEFAULT_LAYOUTS: DashboardLayouts = {
  lg: [
    { i: WIDGET_IDS.overview, x: 0, y: 0, w: 8, h: 4, minW: 4, minH: 3 },
    { i: WIDGET_IDS.ratings, x: 8, y: 0, w: 4, h: 4, minW: 3, minH: 3 },
    {
      i: WIDGET_IDS.recentlyCompleted,
      x: 0,
      y: 4,
      w: 6,
      h: 6,
      minW: 4,
      minH: 4,
    },
    {
      i: WIDGET_IDS.notifications,
      x: 6,
      y: 4,
      w: 6,
      h: 6,
      minW: 4,
      minH: 4,
    },
    { i: WIDGET_IDS.heatmap, x: 0, y: 10, w: 12, h: 4, minW: 6, minH: 3 },
    { i: WIDGET_IDS.genres, x: 0, y: 14, w: 6, h: 6, minW: 4, minH: 5 },
    {
      i: WIDGET_IDS.completedByYear,
      x: 6,
      y: 14,
      w: 6,
      h: 6,
      minW: 4,
      minH: 5,
    },
    { i: WIDGET_IDS.myCases, x: 0, y: 20, w: 12, h: 6, minW: 4, minH: 4 },
  ],
  md: [
    { i: WIDGET_IDS.overview, x: 0, y: 0, w: 6, h: 4 },
    { i: WIDGET_IDS.ratings, x: 6, y: 0, w: 4, h: 4 },
    { i: WIDGET_IDS.recentlyCompleted, x: 0, y: 4, w: 5, h: 6 },
    { i: WIDGET_IDS.notifications, x: 5, y: 4, w: 5, h: 6 },
    { i: WIDGET_IDS.heatmap, x: 0, y: 10, w: 10, h: 4 },
    { i: WIDGET_IDS.genres, x: 0, y: 14, w: 5, h: 6 },
    { i: WIDGET_IDS.completedByYear, x: 5, y: 14, w: 5, h: 6 },
    { i: WIDGET_IDS.myCases, x: 0, y: 20, w: 10, h: 6 },
  ],
  sm: [
    { i: WIDGET_IDS.overview, x: 0, y: 0, w: 6, h: 4 },
    { i: WIDGET_IDS.ratings, x: 0, y: 4, w: 6, h: 4 },
    { i: WIDGET_IDS.recentlyCompleted, x: 0, y: 8, w: 6, h: 6 },
    { i: WIDGET_IDS.notifications, x: 0, y: 14, w: 6, h: 6 },
    { i: WIDGET_IDS.heatmap, x: 0, y: 20, w: 6, h: 4 },
    { i: WIDGET_IDS.genres, x: 0, y: 24, w: 6, h: 6 },
    { i: WIDGET_IDS.completedByYear, x: 0, y: 30, w: 6, h: 6 },
    { i: WIDGET_IDS.myCases, x: 0, y: 36, w: 6, h: 6 },
  ],
  xs: [
    { i: WIDGET_IDS.overview, x: 0, y: 0, w: 4, h: 5 },
    { i: WIDGET_IDS.ratings, x: 0, y: 5, w: 4, h: 5 },
    { i: WIDGET_IDS.recentlyCompleted, x: 0, y: 10, w: 4, h: 6 },
    { i: WIDGET_IDS.notifications, x: 0, y: 16, w: 4, h: 6 },
    { i: WIDGET_IDS.heatmap, x: 0, y: 22, w: 4, h: 5 },
    { i: WIDGET_IDS.genres, x: 0, y: 27, w: 4, h: 6 },
    { i: WIDGET_IDS.completedByYear, x: 0, y: 33, w: 4, h: 6 },
    { i: WIDGET_IDS.myCases, x: 0, y: 39, w: 4, h: 6 },
  ],
};

export function DashboardClient() {
  const { t } = useLocale();
  const { status } = useSession();
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const { layouts, setLayouts, removeWidget, addWidget, reset, widgetIds } =
    useDashboardLayout('profile', DEFAULT_LAYOUTS);

  // Registro de widgets — corre antes del primer paint en cada mount.
  // El registry es un singleton, asi que `register` es idempotente por id.
  useMemo(() => {
    WidgetRegistry.register({
      id: WIDGET_IDS.overview,
      category: 'overview',
      labelKey: 'profileDashboard.widgetOverview',
      descriptionKey: 'profileDashboard.widgetOverviewDesc',
      defaultSize: { w: 8, h: 4, minW: 4, minH: 3 },
      Component: OverviewWidget as never,
    });
    WidgetRegistry.register({
      id: WIDGET_IDS.ratings,
      category: 'overview',
      labelKey: 'profileDashboard.widgetRatings',
      descriptionKey: 'profileDashboard.widgetRatingsDesc',
      defaultSize: { w: 4, h: 4, minW: 3, minH: 3 },
      Component: RatingsWidget as never,
    });
    WidgetRegistry.register({
      id: WIDGET_IDS.recentlyCompleted,
      category: 'media',
      labelKey: 'profileDashboard.widgetRecentlyCompleted',
      descriptionKey: 'profileDashboard.widgetRecentlyCompletedDesc',
      defaultSize: { w: 6, h: 6, minW: 4, minH: 4 },
      Component: RecentlyCompletedWidget as never,
    });
    WidgetRegistry.register({
      id: WIDGET_IDS.notifications,
      category: 'activity',
      labelKey: 'profileDashboard.widgetNotifications',
      descriptionKey: 'profileDashboard.widgetNotificationsDesc',
      defaultSize: { w: 6, h: 6, minW: 4, minH: 4 },
      Component: DashboardNotificationsWidget as never,
    });
    WidgetRegistry.register({
      id: WIDGET_IDS.myCases,
      category: 'social',
      labelKey: 'profileDashboard.widgetMyCases',
      descriptionKey: 'profileDashboard.widgetMyCasesDesc',
      defaultSize: { w: 12, h: 6, minW: 4, minH: 4 },
      Component: MyCasesWidget as never,
    });
    WidgetRegistry.register({
      id: WIDGET_IDS.heatmap,
      category: 'activity',
      labelKey: 'profileDashboard.widgetHeatmap',
      descriptionKey: 'profileDashboard.widgetHeatmapDesc',
      defaultSize: { w: 12, h: 4, minW: 6, minH: 3 },
      Component: HeatmapWidget as never,
    });
    WidgetRegistry.register({
      id: WIDGET_IDS.genres,
      category: 'overview',
      labelKey: 'profileDashboard.widgetGenres',
      descriptionKey: 'profileDashboard.widgetGenresDesc',
      defaultSize: { w: 6, h: 6, minW: 4, minH: 5 },
      Component: GenresDonutWidget as never,
    });
    WidgetRegistry.register({
      id: WIDGET_IDS.completedByYear,
      category: 'activity',
      labelKey: 'profileDashboard.widgetCompletedByYear',
      descriptionKey: 'profileDashboard.widgetCompletedByYearDesc',
      defaultSize: { w: 6, h: 6, minW: 4, minH: 5 },
      Component: CompletedByYearWidget as never,
    });
  }, []);

  useEffect(() => {
    if (status !== 'authenticated') return;
    let cancelled = false;
    setLoading(true);
    fetch('/api/user/profile')
      .then((res) => (res.ok ? res.json() : null))
      .then((profile: ProfileData | null) => {
        if (cancelled) return;
        setData(profile);
      })
      .catch(() => {
        /* manejo silencioso — el render muestra estado de error */
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [status]);

  // Props inyectadas a cada widget por id.
  const widgetProps = useMemo((): Record<string, Record<string, unknown>> => {
    if (!data) return {};
    const map: Record<string, Record<string, unknown>> = {};
    map[WIDGET_IDS.overview] = { stats: data.stats };
    map[WIDGET_IDS.ratings] = { stats: data.stats };
    map[WIDGET_IDS.recentlyCompleted] = { items: data.recentlyCompleted };
    map[WIDGET_IDS.notifications] = {};
    map[WIDGET_IDS.myCases] = {};
    map[WIDGET_IDS.heatmap] = { heatmap: data.stats.heatmap };
    map[WIDGET_IDS.genres] = { topGenres: data.stats.topGenres };
    map[WIDGET_IDS.completedByYear] = {
      completedByYear: data.stats.completedByYear,
    };
    return map;
  }, [data]);

  if (status === 'loading' || (loading && !data)) {
    return (
      <AppLayout>
        <div className="mb-perfil-dashboard__loading">
          <Spin size="large" />
        </div>
      </AppLayout>
    );
  }

  if (status === 'unauthenticated' || !data) {
    return (
      <AppLayout>
        <div className="mb-perfil-dashboard__error">
          <p>{t('profileDashboard.loadError')}</p>
          <Link href="/perfil/clasico">
            <Button icon={<ArrowLeftOutlined />}>
              {t('profileDashboard.backToClassic')}
            </Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mb-perfil-dashboard">
        <ProfileDashboardHeader user={data.user} />
        <ProfileStatsStrip stats={data.stats} />

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
        />
      </div>
    </AppLayout>
  );
}
