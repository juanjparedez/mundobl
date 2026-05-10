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
import { QuickAdminActionsWidget } from './widgets/QuickAdminActionsWidget/QuickAdminActionsWidget';
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
  quickAdmin: 'profile.quickAdmin',
} as const;

// Layout USER: alineado al style-guide my-.profile2.png — denso, sin scroll en lg.
// KPIs ya viven en ProfileStatsStrip (fuera del grid), por eso NO incluimos
// overview/ratings aca: agrega ruido y duplica info.
const USER_LAYOUTS: DashboardLayouts = {
  lg: [
    // Fila 1 (h:4): Currently watching shelf full-width
    { i: WIDGET_IDS.currentlyWatching, x: 0, y: 0, w: 12, h: 4 },
    // Fila 2 (h:3): My reviews + Notifications + My cases — todo compacto
    { i: WIDGET_IDS.myReviews, x: 0, y: 4, w: 5, h: 3 },
    { i: WIDGET_IDS.notifications, x: 5, y: 4, w: 4, h: 3 },
    { i: WIDGET_IDS.myCases, x: 9, y: 4, w: 3, h: 3 },
    // Fila 3 (h:3): Heatmap wide + Genres donut + CompletedByYear
    { i: WIDGET_IDS.heatmap, x: 0, y: 7, w: 6, h: 3 },
    { i: WIDGET_IDS.genres, x: 6, y: 7, w: 3, h: 3 },
    { i: WIDGET_IDS.completedByYear, x: 9, y: 7, w: 3, h: 3 },
    // Fila 4 (h:3): Top lists 4-up
    { i: WIDGET_IDS.topGenresList, x: 0, y: 10, w: 3, h: 3 },
    { i: WIDGET_IDS.topCountries, x: 3, y: 10, w: 3, h: 3 },
    { i: WIDGET_IDS.topActors, x: 6, y: 10, w: 3, h: 3 },
    { i: WIDGET_IDS.topCompanies, x: 9, y: 10, w: 3, h: 3 },
    // Fila 5 (h:4): Recently / Favorites / Top rated / Disputes
    { i: WIDGET_IDS.recentlyCompleted, x: 0, y: 13, w: 3, h: 4 },
    { i: WIDGET_IDS.favorites, x: 3, y: 13, w: 3, h: 4 },
    { i: WIDGET_IDS.topRated, x: 6, y: 13, w: 3, h: 4 },
    { i: WIDGET_IDS.myDisputes, x: 9, y: 13, w: 3, h: 4 },
    // Fila 6 (h:6): My comments full-width — el unico realmente largo
    { i: WIDGET_IDS.myComments, x: 0, y: 17, w: 12, h: 6, minW: 6, minH: 5 },
  ],
  md: [
    { i: WIDGET_IDS.currentlyWatching, x: 0, y: 0, w: 10, h: 4 },
    { i: WIDGET_IDS.myReviews, x: 0, y: 4, w: 5, h: 3 },
    { i: WIDGET_IDS.notifications, x: 5, y: 4, w: 5, h: 3 },
    { i: WIDGET_IDS.heatmap, x: 0, y: 7, w: 5, h: 3 },
    { i: WIDGET_IDS.genres, x: 5, y: 7, w: 5, h: 3 },
    { i: WIDGET_IDS.topGenresList, x: 0, y: 10, w: 5, h: 3 },
    { i: WIDGET_IDS.topCountries, x: 5, y: 10, w: 5, h: 3 },
    { i: WIDGET_IDS.topActors, x: 0, y: 13, w: 5, h: 3 },
    { i: WIDGET_IDS.topCompanies, x: 5, y: 13, w: 5, h: 3 },
    { i: WIDGET_IDS.recentlyCompleted, x: 0, y: 16, w: 5, h: 4 },
    { i: WIDGET_IDS.favorites, x: 5, y: 16, w: 5, h: 4 },
    { i: WIDGET_IDS.topRated, x: 0, y: 20, w: 5, h: 4 },
    { i: WIDGET_IDS.completedByYear, x: 5, y: 20, w: 5, h: 4 },
    { i: WIDGET_IDS.myCases, x: 0, y: 24, w: 5, h: 3 },
    { i: WIDGET_IDS.myDisputes, x: 5, y: 24, w: 5, h: 3 },
    { i: WIDGET_IDS.myComments, x: 0, y: 27, w: 10, h: 6 },
  ],
  sm: [
    { i: WIDGET_IDS.currentlyWatching, x: 0, y: 0, w: 6, h: 4 },
    { i: WIDGET_IDS.myReviews, x: 0, y: 4, w: 6, h: 4 },
    { i: WIDGET_IDS.notifications, x: 0, y: 8, w: 6, h: 3 },
    { i: WIDGET_IDS.heatmap, x: 0, y: 11, w: 6, h: 3 },
    { i: WIDGET_IDS.genres, x: 0, y: 14, w: 6, h: 4 },
    { i: WIDGET_IDS.topGenresList, x: 0, y: 18, w: 6, h: 3 },
    { i: WIDGET_IDS.topCountries, x: 0, y: 21, w: 6, h: 3 },
    { i: WIDGET_IDS.topActors, x: 0, y: 24, w: 6, h: 3 },
    { i: WIDGET_IDS.topCompanies, x: 0, y: 27, w: 6, h: 3 },
    { i: WIDGET_IDS.recentlyCompleted, x: 0, y: 30, w: 6, h: 4 },
    { i: WIDGET_IDS.favorites, x: 0, y: 34, w: 6, h: 4 },
    { i: WIDGET_IDS.topRated, x: 0, y: 38, w: 6, h: 4 },
    { i: WIDGET_IDS.completedByYear, x: 0, y: 42, w: 6, h: 3 },
    { i: WIDGET_IDS.myCases, x: 0, y: 45, w: 6, h: 3 },
    { i: WIDGET_IDS.myDisputes, x: 0, y: 48, w: 6, h: 3 },
    { i: WIDGET_IDS.myComments, x: 0, y: 51, w: 6, h: 7 },
  ],
  xs: [
    { i: WIDGET_IDS.currentlyWatching, x: 0, y: 0, w: 4, h: 4 },
    { i: WIDGET_IDS.myReviews, x: 0, y: 4, w: 4, h: 4 },
    { i: WIDGET_IDS.notifications, x: 0, y: 8, w: 4, h: 3 },
    { i: WIDGET_IDS.heatmap, x: 0, y: 11, w: 4, h: 3 },
    { i: WIDGET_IDS.genres, x: 0, y: 14, w: 4, h: 4 },
    { i: WIDGET_IDS.topGenresList, x: 0, y: 18, w: 4, h: 3 },
    { i: WIDGET_IDS.topCountries, x: 0, y: 21, w: 4, h: 3 },
    { i: WIDGET_IDS.topActors, x: 0, y: 24, w: 4, h: 3 },
    { i: WIDGET_IDS.topCompanies, x: 0, y: 27, w: 4, h: 3 },
    { i: WIDGET_IDS.recentlyCompleted, x: 0, y: 30, w: 4, h: 4 },
    { i: WIDGET_IDS.favorites, x: 0, y: 34, w: 4, h: 4 },
    { i: WIDGET_IDS.topRated, x: 0, y: 38, w: 4, h: 4 },
    { i: WIDGET_IDS.completedByYear, x: 0, y: 42, w: 4, h: 3 },
    { i: WIDGET_IDS.myCases, x: 0, y: 45, w: 4, h: 3 },
    { i: WIDGET_IDS.myDisputes, x: 0, y: 48, w: 4, h: 3 },
    { i: WIDGET_IDS.myComments, x: 0, y: 51, w: 4, h: 7 },
  ],
};

// Layout ADMIN: alineado al style-guide my-profile.png — denso, sin scroll en lg.
// KPIs en ProfileStatsStrip; este grid prioriza herramientas de moderacion
// + heatmap + recent admin activity + cosas personales compactas.
const ADMIN_LAYOUTS: DashboardLayouts = {
  lg: [
    // Fila 1 (h:3): Heatmap wide + QuickAdmin
    { i: WIDGET_IDS.heatmap, x: 0, y: 0, w: 8, h: 3 },
    { i: WIDGET_IDS.quickAdmin, x: 8, y: 0, w: 4, h: 3 },
    // Fila 2 (h:3): Notifications + MyCases + MyDisputes (admin focus)
    { i: WIDGET_IDS.notifications, x: 0, y: 3, w: 4, h: 3 },
    { i: WIDGET_IDS.myCases, x: 4, y: 3, w: 4, h: 3 },
    { i: WIDGET_IDS.myDisputes, x: 8, y: 3, w: 4, h: 3 },
    // Fila 3 (h:4): CurrentlyWatching + MyReviews
    { i: WIDGET_IDS.currentlyWatching, x: 0, y: 6, w: 8, h: 4 },
    { i: WIDGET_IDS.myReviews, x: 8, y: 6, w: 4, h: 4 },
    // Fila 4 (h:3): Donut + 3 top lists
    { i: WIDGET_IDS.genres, x: 0, y: 10, w: 3, h: 3 },
    { i: WIDGET_IDS.topGenresList, x: 3, y: 10, w: 3, h: 3 },
    { i: WIDGET_IDS.topCountries, x: 6, y: 10, w: 3, h: 3 },
    { i: WIDGET_IDS.topActors, x: 9, y: 10, w: 3, h: 3 },
    // Fila 5 (h:4): Recently / Favorites / TopRated / TopCompanies
    { i: WIDGET_IDS.recentlyCompleted, x: 0, y: 13, w: 3, h: 4 },
    { i: WIDGET_IDS.favorites, x: 3, y: 13, w: 3, h: 4 },
    { i: WIDGET_IDS.topRated, x: 6, y: 13, w: 3, h: 4 },
    { i: WIDGET_IDS.topCompanies, x: 9, y: 13, w: 3, h: 4 },
    // Fila 6 (h:3): CompletedByYear wide
    { i: WIDGET_IDS.completedByYear, x: 0, y: 17, w: 12, h: 3 },
    // Fila 7 (h:6): My comments full-width
    { i: WIDGET_IDS.myComments, x: 0, y: 20, w: 12, h: 6, minW: 6, minH: 5 },
  ],
  md: [
    { i: WIDGET_IDS.heatmap, x: 0, y: 0, w: 10, h: 3 },
    { i: WIDGET_IDS.quickAdmin, x: 0, y: 3, w: 5, h: 3 },
    { i: WIDGET_IDS.notifications, x: 5, y: 3, w: 5, h: 3 },
    { i: WIDGET_IDS.myCases, x: 0, y: 6, w: 5, h: 3 },
    { i: WIDGET_IDS.myDisputes, x: 5, y: 6, w: 5, h: 3 },
    { i: WIDGET_IDS.currentlyWatching, x: 0, y: 9, w: 10, h: 4 },
    { i: WIDGET_IDS.myReviews, x: 0, y: 13, w: 5, h: 4 },
    { i: WIDGET_IDS.genres, x: 5, y: 13, w: 5, h: 4 },
    { i: WIDGET_IDS.topGenresList, x: 0, y: 17, w: 5, h: 3 },
    { i: WIDGET_IDS.topCountries, x: 5, y: 17, w: 5, h: 3 },
    { i: WIDGET_IDS.topActors, x: 0, y: 20, w: 5, h: 3 },
    { i: WIDGET_IDS.topCompanies, x: 5, y: 20, w: 5, h: 3 },
    { i: WIDGET_IDS.recentlyCompleted, x: 0, y: 23, w: 5, h: 4 },
    { i: WIDGET_IDS.favorites, x: 5, y: 23, w: 5, h: 4 },
    { i: WIDGET_IDS.topRated, x: 0, y: 27, w: 5, h: 4 },
    { i: WIDGET_IDS.completedByYear, x: 5, y: 27, w: 5, h: 4 },
    { i: WIDGET_IDS.myComments, x: 0, y: 31, w: 10, h: 6 },
  ],
  sm: [
    { i: WIDGET_IDS.quickAdmin, x: 0, y: 0, w: 6, h: 3 },
    { i: WIDGET_IDS.heatmap, x: 0, y: 3, w: 6, h: 3 },
    { i: WIDGET_IDS.notifications, x: 0, y: 6, w: 6, h: 3 },
    { i: WIDGET_IDS.myCases, x: 0, y: 9, w: 6, h: 3 },
    { i: WIDGET_IDS.myDisputes, x: 0, y: 12, w: 6, h: 3 },
    { i: WIDGET_IDS.currentlyWatching, x: 0, y: 15, w: 6, h: 4 },
    { i: WIDGET_IDS.myReviews, x: 0, y: 19, w: 6, h: 4 },
    { i: WIDGET_IDS.genres, x: 0, y: 23, w: 6, h: 4 },
    { i: WIDGET_IDS.topGenresList, x: 0, y: 27, w: 6, h: 3 },
    { i: WIDGET_IDS.topCountries, x: 0, y: 30, w: 6, h: 3 },
    { i: WIDGET_IDS.topActors, x: 0, y: 33, w: 6, h: 3 },
    { i: WIDGET_IDS.topCompanies, x: 0, y: 36, w: 6, h: 3 },
    { i: WIDGET_IDS.recentlyCompleted, x: 0, y: 39, w: 6, h: 4 },
    { i: WIDGET_IDS.favorites, x: 0, y: 43, w: 6, h: 4 },
    { i: WIDGET_IDS.topRated, x: 0, y: 47, w: 6, h: 4 },
    { i: WIDGET_IDS.completedByYear, x: 0, y: 51, w: 6, h: 3 },
    { i: WIDGET_IDS.myComments, x: 0, y: 54, w: 6, h: 7 },
  ],
  xs: [
    { i: WIDGET_IDS.quickAdmin, x: 0, y: 0, w: 4, h: 3 },
    { i: WIDGET_IDS.heatmap, x: 0, y: 3, w: 4, h: 3 },
    { i: WIDGET_IDS.notifications, x: 0, y: 6, w: 4, h: 3 },
    { i: WIDGET_IDS.myCases, x: 0, y: 9, w: 4, h: 3 },
    { i: WIDGET_IDS.myDisputes, x: 0, y: 12, w: 4, h: 3 },
    { i: WIDGET_IDS.currentlyWatching, x: 0, y: 15, w: 4, h: 4 },
    { i: WIDGET_IDS.myReviews, x: 0, y: 19, w: 4, h: 4 },
    { i: WIDGET_IDS.genres, x: 0, y: 23, w: 4, h: 4 },
    { i: WIDGET_IDS.topGenresList, x: 0, y: 27, w: 4, h: 3 },
    { i: WIDGET_IDS.topCountries, x: 0, y: 30, w: 4, h: 3 },
    { i: WIDGET_IDS.topActors, x: 0, y: 33, w: 4, h: 3 },
    { i: WIDGET_IDS.topCompanies, x: 0, y: 36, w: 4, h: 3 },
    { i: WIDGET_IDS.recentlyCompleted, x: 0, y: 39, w: 4, h: 4 },
    { i: WIDGET_IDS.favorites, x: 0, y: 43, w: 4, h: 4 },
    { i: WIDGET_IDS.topRated, x: 0, y: 47, w: 4, h: 4 },
    { i: WIDGET_IDS.completedByYear, x: 0, y: 51, w: 4, h: 3 },
    { i: WIDGET_IDS.myComments, x: 0, y: 54, w: 4, h: 7 },
  ],
};

export function DashboardClient() {
  const { t } = useLocale();
  const { status, data: session } = useSession();
  const [data, setData] = useState<ProfileData | null>(null);
  const [errored, setErrored] = useState(false);
  const [editing, setEditing] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  // Layout y dashboardKey distintos segun rol — admin tiene QuickActions
  // como widget destacado y orden propio; user prioriza contenido personal.
  const isAdmin =
    (data?.user.role ?? (session?.user as { role?: string })?.role) === 'ADMIN';
  const dashboardKey = isAdmin ? 'profile-admin-v3' : 'profile-user-v3';
  const defaultLayouts = isAdmin ? ADMIN_LAYOUTS : USER_LAYOUTS;

  const { layouts, setLayouts, removeWidget, addWidget, reset, widgetIds } =
    useDashboardLayout(dashboardKey, defaultLayouts);

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
    // QuickAdmin solo para admins. El picker / WidgetRegistry no expone
    // roles, asi que el filtrado lo hace el layout default que solo lo
    // pone en ADMIN_LAYOUTS. Si un user regular intenta agregarlo, el
    // componente igual renderiza pero los links a /admin/* devuelven 403.
    WidgetRegistry.register({
      id: WIDGET_IDS.quickAdmin,
      category: 'admin',
      labelKey: 'quickAdmin.title',
      descriptionKey: 'quickAdmin.title',
      defaultSize: { w: 6, h: 3, minW: 4, minH: 3 },
      Component: QuickAdminActionsWidget as never,
    });
  }, []);

  useEffect(() => {
    if (status !== 'authenticated') return;
    let cancelled = false;
    fetch('/api/user/profile')
      .then((res) => (res.ok ? res.json() : null))
      .then((profile: ProfileData | null) => {
        if (cancelled) return;
        if (profile) setData(profile);
        else setErrored(true);
      })
      .catch(() => {
        if (!cancelled) setErrored(true);
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
    map[WIDGET_IDS.quickAdmin] = {};
    return map;
  }, [data]);

  if (
    status === 'loading' ||
    (status === 'authenticated' && !data && !errored)
  ) {
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
          rowHeight={36}
          gap={10}
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
