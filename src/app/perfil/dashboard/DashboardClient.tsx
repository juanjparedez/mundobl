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
import { TopGenresListWidget } from './widgets/TopGenresListWidget/TopGenresListWidget';
import { TopCountriesListWidget } from './widgets/TopCountriesListWidget/TopCountriesListWidget';
import { CurrentlyWatchingWidget } from './widgets/CurrentlyWatchingWidget/CurrentlyWatchingWidget';
import { TopActorsListWidget } from './widgets/TopActorsListWidget/TopActorsListWidget';
import { TopCompaniesListWidget } from './widgets/TopCompaniesListWidget/TopCompaniesListWidget';
import { TopRatedSeriesWidget } from './widgets/TopRatedSeriesWidget/TopRatedSeriesWidget';
import { FavoritesWidget } from './widgets/FavoritesWidget/FavoritesWidget';
import { MyReviewsWidget } from './widgets/MyReviewsWidget/MyReviewsWidget';
import { MyDisputesWidget } from './widgets/MyDisputesWidget/MyDisputesWidget';
import { MyCommentsWidget } from './widgets/MyCommentsWidget/MyCommentsWidget';
import { ProfileSettings } from '../ProfileSettings/ProfileSettings';
import { SubscriptionsSection } from '../SubscriptionsSection/SubscriptionsSection';
import { ClientVersionInfo } from '../ClientVersionInfo/ClientVersionInfo';
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
  topGenresList: 'profile.topGenresList',
  topCountries: 'profile.topCountries',
  currentlyWatching: 'profile.currentlyWatching',
  topActors: 'profile.topActors',
  topCompanies: 'profile.topCompanies',
  topRated: 'profile.topRated',
  favorites: 'profile.favorites',
  myReviews: 'profile.myReviews',
  myDisputes: 'profile.myDisputes',
  myComments: 'profile.myComments',
} as const;

// Grid denso alineado al mock: rowHeight 40 + gap 8 (en DashboardGrid).
// Alturas mas bajas (h:3-4 en lugar de h:5-6) para evitar widgets gigantes
// con whitespace cuando hay poca data.
const DEFAULT_LAYOUTS: DashboardLayouts = {
  lg: [
    // Fila 1 (h:4 = 184px): Currently watching + Notifications
    {
      i: WIDGET_IDS.currentlyWatching,
      x: 0,
      y: 0,
      w: 6,
      h: 4,
      minW: 4,
      minH: 3,
    },
    { i: WIDGET_IDS.notifications, x: 6, y: 0, w: 6, h: 4, minW: 4, minH: 3 },
    // Fila 2 (h:4): TopGenres list + Genres donut + TopCountries list
    { i: WIDGET_IDS.topGenresList, x: 0, y: 4, w: 4, h: 4, minW: 3, minH: 3 },
    { i: WIDGET_IDS.genres, x: 4, y: 4, w: 4, h: 4, minW: 3, minH: 3 },
    { i: WIDGET_IDS.topCountries, x: 8, y: 4, w: 4, h: 4, minW: 3, minH: 3 },
    // Fila 3 (h:3 = 136px): Heatmap full-width
    { i: WIDGET_IDS.heatmap, x: 0, y: 8, w: 12, h: 3, minW: 6, minH: 3 },
    // Fila 4 (h:4): Recently completed + Completed by year
    {
      i: WIDGET_IDS.recentlyCompleted,
      x: 0,
      y: 11,
      w: 7,
      h: 4,
      minW: 4,
      minH: 3,
    },
    {
      i: WIDGET_IDS.completedByYear,
      x: 7,
      y: 11,
      w: 5,
      h: 4,
      minW: 4,
      minH: 3,
    },
    // Fila 5 (h:3): Overview KPIs + Ratings KPIs (4 KPIs c/u, no necesitan mucho)
    { i: WIDGET_IDS.overview, x: 0, y: 15, w: 6, h: 3, minW: 4, minH: 3 },
    { i: WIDGET_IDS.ratings, x: 6, y: 15, w: 6, h: 3, minW: 4, minH: 3 },
    // Fila 6 (h:4): My cases full-width
    { i: WIDGET_IDS.myCases, x: 0, y: 18, w: 12, h: 4, minW: 4, minH: 3 },
    // Fila 7 (h:5): Top rated + Favorites + My reviews
    { i: WIDGET_IDS.topRated, x: 0, y: 22, w: 4, h: 5, minW: 3, minH: 4 },
    { i: WIDGET_IDS.favorites, x: 4, y: 22, w: 4, h: 5, minW: 3, minH: 4 },
    { i: WIDGET_IDS.myReviews, x: 8, y: 22, w: 4, h: 5, minW: 3, minH: 4 },
    // Fila 8 (h:4): Top actors + Top companies + Disputes
    { i: WIDGET_IDS.topActors, x: 0, y: 27, w: 4, h: 4, minW: 3, minH: 3 },
    { i: WIDGET_IDS.topCompanies, x: 4, y: 27, w: 4, h: 4, minW: 3, minH: 3 },
    { i: WIDGET_IDS.myDisputes, x: 8, y: 27, w: 4, h: 4, minW: 3, minH: 3 },
    // Fila 9 (h:8): My comments full-width (filtros + paginacion ocupan)
    { i: WIDGET_IDS.myComments, x: 0, y: 31, w: 12, h: 8, minW: 6, minH: 6 },
  ],
  md: [
    { i: WIDGET_IDS.currentlyWatching, x: 0, y: 0, w: 5, h: 4 },
    { i: WIDGET_IDS.notifications, x: 5, y: 0, w: 5, h: 4 },
    { i: WIDGET_IDS.topGenresList, x: 0, y: 4, w: 5, h: 4 },
    { i: WIDGET_IDS.genres, x: 5, y: 4, w: 5, h: 4 },
    { i: WIDGET_IDS.topCountries, x: 0, y: 8, w: 5, h: 4 },
    { i: WIDGET_IDS.completedByYear, x: 5, y: 8, w: 5, h: 4 },
    { i: WIDGET_IDS.heatmap, x: 0, y: 12, w: 10, h: 3 },
    { i: WIDGET_IDS.recentlyCompleted, x: 0, y: 15, w: 5, h: 4 },
    { i: WIDGET_IDS.overview, x: 5, y: 15, w: 5, h: 4 },
    { i: WIDGET_IDS.ratings, x: 0, y: 19, w: 10, h: 3 },
    { i: WIDGET_IDS.myCases, x: 0, y: 22, w: 10, h: 4 },
    { i: WIDGET_IDS.topRated, x: 0, y: 26, w: 5, h: 5 },
    { i: WIDGET_IDS.favorites, x: 5, y: 26, w: 5, h: 5 },
    { i: WIDGET_IDS.myReviews, x: 0, y: 31, w: 10, h: 5 },
    { i: WIDGET_IDS.topActors, x: 0, y: 36, w: 5, h: 4 },
    { i: WIDGET_IDS.topCompanies, x: 5, y: 36, w: 5, h: 4 },
    { i: WIDGET_IDS.myDisputes, x: 0, y: 40, w: 10, h: 4 },
    { i: WIDGET_IDS.myComments, x: 0, y: 44, w: 10, h: 8 },
  ],
  sm: [
    { i: WIDGET_IDS.currentlyWatching, x: 0, y: 0, w: 6, h: 4 },
    { i: WIDGET_IDS.notifications, x: 0, y: 4, w: 6, h: 4 },
    { i: WIDGET_IDS.topGenresList, x: 0, y: 8, w: 6, h: 4 },
    { i: WIDGET_IDS.topCountries, x: 0, y: 12, w: 6, h: 4 },
    { i: WIDGET_IDS.genres, x: 0, y: 16, w: 6, h: 4 },
    { i: WIDGET_IDS.heatmap, x: 0, y: 20, w: 6, h: 3 },
    { i: WIDGET_IDS.recentlyCompleted, x: 0, y: 23, w: 6, h: 4 },
    { i: WIDGET_IDS.completedByYear, x: 0, y: 27, w: 6, h: 4 },
    { i: WIDGET_IDS.overview, x: 0, y: 31, w: 6, h: 3 },
    { i: WIDGET_IDS.ratings, x: 0, y: 34, w: 6, h: 3 },
    { i: WIDGET_IDS.myCases, x: 0, y: 37, w: 6, h: 4 },
    { i: WIDGET_IDS.topRated, x: 0, y: 41, w: 6, h: 5 },
    { i: WIDGET_IDS.favorites, x: 0, y: 46, w: 6, h: 5 },
    { i: WIDGET_IDS.myReviews, x: 0, y: 51, w: 6, h: 5 },
    { i: WIDGET_IDS.topActors, x: 0, y: 56, w: 6, h: 4 },
    { i: WIDGET_IDS.topCompanies, x: 0, y: 60, w: 6, h: 4 },
    { i: WIDGET_IDS.myDisputes, x: 0, y: 64, w: 6, h: 4 },
    { i: WIDGET_IDS.myComments, x: 0, y: 68, w: 6, h: 9 },
  ],
  xs: [
    { i: WIDGET_IDS.currentlyWatching, x: 0, y: 0, w: 4, h: 4 },
    { i: WIDGET_IDS.notifications, x: 0, y: 4, w: 4, h: 4 },
    { i: WIDGET_IDS.topGenresList, x: 0, y: 8, w: 4, h: 4 },
    { i: WIDGET_IDS.topCountries, x: 0, y: 12, w: 4, h: 4 },
    { i: WIDGET_IDS.genres, x: 0, y: 16, w: 4, h: 4 },
    { i: WIDGET_IDS.heatmap, x: 0, y: 20, w: 4, h: 3 },
    { i: WIDGET_IDS.recentlyCompleted, x: 0, y: 23, w: 4, h: 4 },
    { i: WIDGET_IDS.completedByYear, x: 0, y: 27, w: 4, h: 4 },
    { i: WIDGET_IDS.overview, x: 0, y: 31, w: 4, h: 4 },
    { i: WIDGET_IDS.ratings, x: 0, y: 35, w: 4, h: 4 },
    { i: WIDGET_IDS.myCases, x: 0, y: 39, w: 4, h: 4 },
    { i: WIDGET_IDS.topRated, x: 0, y: 43, w: 4, h: 5 },
    { i: WIDGET_IDS.favorites, x: 0, y: 48, w: 4, h: 5 },
    { i: WIDGET_IDS.myReviews, x: 0, y: 53, w: 4, h: 5 },
    { i: WIDGET_IDS.topActors, x: 0, y: 58, w: 4, h: 4 },
    { i: WIDGET_IDS.topCompanies, x: 0, y: 62, w: 4, h: 4 },
    { i: WIDGET_IDS.myDisputes, x: 0, y: 66, w: 4, h: 4 },
    { i: WIDGET_IDS.myComments, x: 0, y: 70, w: 4, h: 9 },
  ],
};

export function DashboardClient() {
  const { t } = useLocale();
  const { status } = useSession();
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  // dashboardKey 'profile-v3' invalida cache de layout previo. v3 suma
  // 7 widgets nuevos (TopActors, TopCompanies, TopRated, Favorites,
  // MyReviews, MyDisputes, MyComments) que el layout v2 no incluia.
  const { layouts, setLayouts, removeWidget, addWidget, reset, widgetIds } =
    useDashboardLayout('profile-v3', DEFAULT_LAYOUTS);

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
      defaultSize: { w: 5, h: 5, minW: 4, minH: 4 },
      Component: CompletedByYearWidget as never,
    });
    WidgetRegistry.register({
      id: WIDGET_IDS.topGenresList,
      category: 'overview',
      labelKey: 'profileDashboard.widgetTopGenresList',
      descriptionKey: 'profileDashboard.widgetTopGenresListDesc',
      defaultSize: { w: 4, h: 5, minW: 3, minH: 4 },
      Component: TopGenresListWidget as never,
    });
    WidgetRegistry.register({
      id: WIDGET_IDS.topCountries,
      category: 'overview',
      labelKey: 'profileDashboard.widgetTopCountries',
      descriptionKey: 'profileDashboard.widgetTopCountriesDesc',
      defaultSize: { w: 4, h: 5, minW: 3, minH: 4 },
      Component: TopCountriesListWidget as never,
    });
    WidgetRegistry.register({
      id: WIDGET_IDS.currentlyWatching,
      category: 'media',
      labelKey: 'profileDashboard.widgetCurrentlyWatching',
      descriptionKey: 'profileDashboard.widgetCurrentlyWatchingDesc',
      defaultSize: { w: 6, h: 5, minW: 4, minH: 4 },
      Component: CurrentlyWatchingWidget as never,
    });
    WidgetRegistry.register({
      id: WIDGET_IDS.topActors,
      category: 'overview',
      labelKey: 'profileDashboard.widgetTopActors',
      descriptionKey: 'profileDashboard.widgetTopActorsDesc',
      defaultSize: { w: 4, h: 4, minW: 3, minH: 3 },
      Component: TopActorsListWidget as never,
    });
    WidgetRegistry.register({
      id: WIDGET_IDS.topCompanies,
      category: 'overview',
      labelKey: 'profileDashboard.widgetTopCompanies',
      descriptionKey: 'profileDashboard.widgetTopCompaniesDesc',
      defaultSize: { w: 4, h: 4, minW: 3, minH: 3 },
      Component: TopCompaniesListWidget as never,
    });
    WidgetRegistry.register({
      id: WIDGET_IDS.topRated,
      category: 'overview',
      labelKey: 'profileDashboard.widgetTopRated',
      descriptionKey: 'profileDashboard.widgetTopRatedDesc',
      defaultSize: { w: 4, h: 5, minW: 3, minH: 4 },
      Component: TopRatedSeriesWidget as never,
    });
    WidgetRegistry.register({
      id: WIDGET_IDS.favorites,
      category: 'media',
      labelKey: 'profileDashboard.widgetFavorites',
      descriptionKey: 'profileDashboard.widgetFavoritesDesc',
      defaultSize: { w: 4, h: 5, minW: 3, minH: 4 },
      Component: FavoritesWidget as never,
    });
    WidgetRegistry.register({
      id: WIDGET_IDS.myReviews,
      category: 'social',
      labelKey: 'profileDashboard.widgetMyReviews',
      descriptionKey: 'profileDashboard.widgetMyReviewsDesc',
      defaultSize: { w: 6, h: 5, minW: 4, minH: 4 },
      Component: MyReviewsWidget as never,
    });
    WidgetRegistry.register({
      id: WIDGET_IDS.myDisputes,
      category: 'social',
      labelKey: 'profileDashboard.widgetMyDisputes',
      descriptionKey: 'profileDashboard.widgetMyDisputesDesc',
      defaultSize: { w: 4, h: 4, minW: 3, minH: 3 },
      Component: MyDisputesWidget as never,
    });
    WidgetRegistry.register({
      id: WIDGET_IDS.myComments,
      category: 'social',
      labelKey: 'profileDashboard.widgetMyComments',
      descriptionKey: 'profileDashboard.widgetMyCommentsDesc',
      defaultSize: { w: 12, h: 8, minW: 6, minH: 6 },
      Component: MyCommentsWidget as never,
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
    map[WIDGET_IDS.topGenresList] = { topGenres: data.stats.topGenres };
    map[WIDGET_IDS.topCountries] = { topCountries: data.stats.topCountries };
    map[WIDGET_IDS.currentlyWatching] = { items: data.currentlyWatching };
    map[WIDGET_IDS.topActors] = { topActors: data.stats.topActors };
    map[WIDGET_IDS.topCompanies] = {
      topProductionCompanies: data.stats.topProductionCompanies,
    };
    map[WIDGET_IDS.topRated] = { topRatedSeries: data.stats.topRatedSeries };
    map[WIDGET_IDS.favorites] = { favorites: data.favorites };
    map[WIDGET_IDS.myReviews] = { recentReviews: data.recentReviews };
    map[WIDGET_IDS.myDisputes] = {};
    map[WIDGET_IDS.myComments] = {};
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
          rowHeight={40}
          gap={8}
        />

        <WidgetPickerDrawer
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          onPick={addWidget}
          alreadyAdded={widgetIds}
        />

        {/* Settings + suscripciones + version info — features que estaban
         * en el perfil clasico y que migraron al dashboard como bloque
         * fijo abajo del grid. No son widgets reordenables porque son
         * singletons que el usuario espera en una posicion estable.
         * El id mb-profile-settings es target de scroll del boton
         * "Editar perfil" del header. */}
        <div className="mb-perfil-dashboard__footer" id="mb-profile-settings">
          <div className="mb-perfil-dashboard__footer-grid">
            <div className="mb-perfil-dashboard__footer-panel">
              <ProfileSettings />
            </div>
            <div className="mb-perfil-dashboard__footer-panel">
              <SubscriptionsSection />
            </div>
          </div>
          <ClientVersionInfo />
        </div>
      </div>
    </AppLayout>
  );
}
