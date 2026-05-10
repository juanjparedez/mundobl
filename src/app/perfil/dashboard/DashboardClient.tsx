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
import { ProfileSettings } from '../ProfileSettings/ProfileSettings';
import { SubscriptionsSection } from '../SubscriptionsSection/SubscriptionsSection';
import { ClientVersionInfo } from '../ClientVersionInfo/ClientVersionInfo';
import {
  useSectionVisibility,
  type OverviewSectionKey,
} from '../overview/useSectionVisibility';
import { CustomizeDrawer } from '../overview/CustomizeDrawer';
import { OverviewWidget } from './widgets/OverviewWidget/OverviewWidget';
import { RatingsWidget } from './widgets/RatingsWidget/RatingsWidget';
import { HeatmapWidget } from './widgets/HeatmapWidget/HeatmapWidget';
import { GenresDonutWidget } from './widgets/GenresDonutWidget/GenresDonutWidget';
import { CompletedByYearWidget } from './widgets/CompletedByYearWidget/CompletedByYearWidget';
import { TopGenresListWidget } from './widgets/TopGenresListWidget/TopGenresListWidget';
import { TopCountriesListWidget } from './widgets/TopCountriesListWidget/TopCountriesListWidget';
import { TopActorsListWidget } from './widgets/TopActorsListWidget/TopActorsListWidget';
import { TopCompaniesListWidget } from './widgets/TopCompaniesListWidget/TopCompaniesListWidget';
import { CurrentlyWatchingWidget } from './widgets/CurrentlyWatchingWidget/CurrentlyWatchingWidget';
import { RecentlyCompletedWidget } from './widgets/RecentlyCompletedWidget/RecentlyCompletedWidget';
import { FavoritesWidget } from './widgets/FavoritesWidget/FavoritesWidget';
import { TopRatedSeriesWidget } from './widgets/TopRatedSeriesWidget/TopRatedSeriesWidget';
import { MyReviewsWidget } from './widgets/MyReviewsWidget/MyReviewsWidget';
import { MyDisputesWidget } from './widgets/MyDisputesWidget/MyDisputesWidget';
import { MyCommentsWidget } from './widgets/MyCommentsWidget/MyCommentsWidget';
import { MyCasesWidget } from './widgets/MyCasesWidget/MyCasesWidget';
import { DashboardNotificationsWidget } from './widgets/NotificationsWidget/DashboardNotificationsWidget';
import { QuickAdminActionsWidget } from './widgets/QuickAdminActionsWidget/QuickAdminActionsWidget';
import { AdminAlertsWidget } from './widgets/AdminAlertsWidget/AdminAlertsWidget';
import { AchievementsWidget } from './widgets/AchievementsWidget/AchievementsWidget';
import { CollectionsWidget } from './widgets/CollectionsWidget/CollectionsWidget';
import { YearSummaryWidget } from './widgets/YearSummaryWidget/YearSummaryWidget';
import { ReviewsActivityWidget } from './widgets/ReviewsActivityWidget/ReviewsActivityWidget';
import { FollowedTitlesWidget } from './widgets/FollowedTitlesWidget/FollowedTitlesWidget';
import { SettingsRowWidget } from './widgets/SettingsRowWidget/SettingsRowWidget';
import './dashboard.css';

// IDs estables de cada widget. Usados en layouts persistidos y registry.
// Si renombrás uno, hay que bumpear dashboardKey abajo para invalidar
// localStorage de users con layouts viejos.
const WIDGET_IDS = {
  overview: 'profile.overview',
  ratings: 'profile.ratings',
  heatmap: 'profile.heatmap',
  genres: 'profile.genres',
  completedByYear: 'profile.completedByYear',
  topGenresList: 'profile.topGenresList',
  topCountries: 'profile.topCountries',
  topActors: 'profile.topActors',
  topCompanies: 'profile.topCompanies',
  currentlyWatching: 'profile.currentlyWatching',
  recentlyCompleted: 'profile.recentlyCompleted',
  favorites: 'profile.favorites',
  topRated: 'profile.topRated',
  myReviews: 'profile.myReviews',
  myDisputes: 'profile.myDisputes',
  myComments: 'profile.myComments',
  myCases: 'profile.myCases',
  notifications: 'profile.notifications',
  quickAdmin: 'profile.quickAdmin',
  adminAlerts: 'profile.adminAlerts',
  achievements: 'profile.achievements',
  collections: 'profile.collections',
  yearSummary: 'profile.yearSummary',
  reviewsActivity: 'profile.reviewsActivity',
  followedTitles: 'profile.followedTitles',
  settingsRow: 'profile.settingsRow',
} as const;

// Mapa de widgetId -> section key del CustomizeDrawer. Permite que el
// CustomizeDrawer (toggle on/off por section) filtre la lista de widgets
// del grid. Si un widget no tiene mapping, siempre se muestra (eg admin
// tools, charts, top lists que estan agrupados bajo una key general).
const WIDGET_TO_SECTION: Record<string, string> = {
  [WIDGET_IDS.currentlyWatching]: 'watching',
  [WIDGET_IDS.heatmap]: 'mystats',
  [WIDGET_IDS.genres]: 'mystats',
  [WIDGET_IDS.completedByYear]: 'mystats',
  [WIDGET_IDS.topGenresList]: 'countries',
  [WIDGET_IDS.topCountries]: 'countries',
  [WIDGET_IDS.topActors]: 'countries',
  [WIDGET_IDS.topCompanies]: 'countries',
  [WIDGET_IDS.myReviews]: 'reviews',
  [WIDGET_IDS.myComments]: 'comments',
  [WIDGET_IDS.myCases]: 'cases',
  [WIDGET_IDS.notifications]: 'notifications',
  [WIDGET_IDS.achievements]: 'achievements',
  [WIDGET_IDS.collections]: 'collections',
  [WIDGET_IDS.yearSummary]: 'yearSummary',
  [WIDGET_IDS.reviewsActivity]: 'reviewsActivity',
  [WIDGET_IDS.followedTitles]: 'followed',
  [WIDGET_IDS.settingsRow]: 'settings',
};

// Layout default ADMIN — mock-aligned (style-guide/my-profile.png), denso,
// con alerts + admin tools arriba y panels personales debajo. El user
// puede editar (drag/resize/remove/add) y la prefe se persiste por
// dashboardKey en localStorage.
const ADMIN_LAYOUTS: DashboardLayouts = {
  lg: [
    // Row 1: Heatmap wide (8) + QuickAdmin (4)
    { i: WIDGET_IDS.heatmap, x: 0, y: 0, w: 8, h: 3 },
    { i: WIDGET_IDS.quickAdmin, x: 8, y: 0, w: 4, h: 3 },
    // Row 2: AdminAlerts full
    { i: WIDGET_IDS.adminAlerts, x: 0, y: 3, w: 12, h: 3 },
    // Row 3: CurrentlyWatching shelf full
    { i: WIDGET_IDS.currentlyWatching, x: 0, y: 6, w: 12, h: 4 },
    // Row 4: MyCases + Notifications (2up)
    { i: WIDGET_IDS.myCases, x: 0, y: 10, w: 6, h: 3 },
    { i: WIDGET_IDS.notifications, x: 6, y: 10, w: 6, h: 3 },
    // Row 5: MyReviews + MyDisputes + RecentlyCompleted (3up)
    { i: WIDGET_IDS.myReviews, x: 0, y: 13, w: 4, h: 4 },
    { i: WIDGET_IDS.myDisputes, x: 4, y: 13, w: 4, h: 4 },
    { i: WIDGET_IDS.recentlyCompleted, x: 8, y: 13, w: 4, h: 4 },
    // Row 6: ReviewsActivity + YearSummary (2up)
    { i: WIDGET_IDS.reviewsActivity, x: 0, y: 17, w: 6, h: 3 },
    { i: WIDGET_IDS.yearSummary, x: 6, y: 17, w: 6, h: 3 },
    // Row 7: GenresDonut + CompletedByYear (charts 4/8)
    { i: WIDGET_IDS.genres, x: 0, y: 20, w: 4, h: 5 },
    { i: WIDGET_IDS.completedByYear, x: 4, y: 20, w: 8, h: 5 },
    // Row 8: 4 top lists
    { i: WIDGET_IDS.topGenresList, x: 0, y: 25, w: 3, h: 4 },
    { i: WIDGET_IDS.topCountries, x: 3, y: 25, w: 3, h: 4 },
    { i: WIDGET_IDS.topActors, x: 6, y: 25, w: 3, h: 4 },
    { i: WIDGET_IDS.topCompanies, x: 9, y: 25, w: 3, h: 4 },
    // Row 9: Collections + Achievements (2up)
    { i: WIDGET_IDS.collections, x: 0, y: 29, w: 6, h: 4 },
    { i: WIDGET_IDS.achievements, x: 6, y: 29, w: 6, h: 4 },
    // Row 10: FollowedTitles + Favorites + TopRated (3up)
    { i: WIDGET_IDS.followedTitles, x: 0, y: 33, w: 4, h: 4 },
    { i: WIDGET_IDS.favorites, x: 4, y: 33, w: 4, h: 4 },
    { i: WIDGET_IDS.topRated, x: 8, y: 33, w: 4, h: 4 },
    // Row 11: MyComments full
    { i: WIDGET_IDS.myComments, x: 0, y: 37, w: 12, h: 6, minW: 6, minH: 5 },
    // Row 12: SettingsRow (6 cards horizontales del mock)
    { i: WIDGET_IDS.settingsRow, x: 0, y: 43, w: 12, h: 4, minW: 6, minH: 3 },
  ],
  md: [
    { i: WIDGET_IDS.heatmap, x: 0, y: 0, w: 10, h: 3 },
    { i: WIDGET_IDS.quickAdmin, x: 0, y: 3, w: 5, h: 3 },
    { i: WIDGET_IDS.adminAlerts, x: 5, y: 3, w: 5, h: 3 },
    { i: WIDGET_IDS.currentlyWatching, x: 0, y: 6, w: 10, h: 4 },
    { i: WIDGET_IDS.myCases, x: 0, y: 10, w: 5, h: 3 },
    { i: WIDGET_IDS.notifications, x: 5, y: 10, w: 5, h: 3 },
    { i: WIDGET_IDS.myReviews, x: 0, y: 13, w: 5, h: 4 },
    { i: WIDGET_IDS.myDisputes, x: 5, y: 13, w: 5, h: 4 },
    { i: WIDGET_IDS.reviewsActivity, x: 0, y: 17, w: 5, h: 3 },
    { i: WIDGET_IDS.yearSummary, x: 5, y: 17, w: 5, h: 3 },
    { i: WIDGET_IDS.genres, x: 0, y: 20, w: 5, h: 5 },
    { i: WIDGET_IDS.completedByYear, x: 5, y: 20, w: 5, h: 5 },
    { i: WIDGET_IDS.topGenresList, x: 0, y: 25, w: 5, h: 4 },
    { i: WIDGET_IDS.topCountries, x: 5, y: 25, w: 5, h: 4 },
    { i: WIDGET_IDS.topActors, x: 0, y: 29, w: 5, h: 4 },
    { i: WIDGET_IDS.topCompanies, x: 5, y: 29, w: 5, h: 4 },
    { i: WIDGET_IDS.collections, x: 0, y: 33, w: 5, h: 4 },
    { i: WIDGET_IDS.achievements, x: 5, y: 33, w: 5, h: 4 },
    { i: WIDGET_IDS.followedTitles, x: 0, y: 37, w: 5, h: 4 },
    { i: WIDGET_IDS.favorites, x: 5, y: 37, w: 5, h: 4 },
    { i: WIDGET_IDS.topRated, x: 0, y: 41, w: 5, h: 4 },
    { i: WIDGET_IDS.recentlyCompleted, x: 5, y: 41, w: 5, h: 4 },
    { i: WIDGET_IDS.myComments, x: 0, y: 45, w: 10, h: 6 },
    { i: WIDGET_IDS.settingsRow, x: 0, y: 51, w: 10, h: 4 },
  ],
  sm: [
    { i: WIDGET_IDS.quickAdmin, x: 0, y: 0, w: 6, h: 3 },
    { i: WIDGET_IDS.adminAlerts, x: 0, y: 3, w: 6, h: 3 },
    { i: WIDGET_IDS.heatmap, x: 0, y: 6, w: 6, h: 3 },
    { i: WIDGET_IDS.currentlyWatching, x: 0, y: 9, w: 6, h: 4 },
    { i: WIDGET_IDS.notifications, x: 0, y: 13, w: 6, h: 3 },
    { i: WIDGET_IDS.myCases, x: 0, y: 16, w: 6, h: 3 },
    { i: WIDGET_IDS.myReviews, x: 0, y: 19, w: 6, h: 4 },
    { i: WIDGET_IDS.reviewsActivity, x: 0, y: 23, w: 6, h: 3 },
    { i: WIDGET_IDS.yearSummary, x: 0, y: 26, w: 6, h: 3 },
    { i: WIDGET_IDS.genres, x: 0, y: 29, w: 6, h: 5 },
    { i: WIDGET_IDS.collections, x: 0, y: 34, w: 6, h: 4 },
    { i: WIDGET_IDS.achievements, x: 0, y: 38, w: 6, h: 5 },
    { i: WIDGET_IDS.followedTitles, x: 0, y: 43, w: 6, h: 4 },
    { i: WIDGET_IDS.favorites, x: 0, y: 47, w: 6, h: 4 },
    { i: WIDGET_IDS.topRated, x: 0, y: 51, w: 6, h: 4 },
    { i: WIDGET_IDS.myDisputes, x: 0, y: 55, w: 6, h: 3 },
    { i: WIDGET_IDS.recentlyCompleted, x: 0, y: 58, w: 6, h: 4 },
    { i: WIDGET_IDS.topGenresList, x: 0, y: 62, w: 6, h: 3 },
    { i: WIDGET_IDS.topCountries, x: 0, y: 65, w: 6, h: 3 },
    { i: WIDGET_IDS.topActors, x: 0, y: 68, w: 6, h: 3 },
    { i: WIDGET_IDS.topCompanies, x: 0, y: 71, w: 6, h: 3 },
    { i: WIDGET_IDS.completedByYear, x: 0, y: 74, w: 6, h: 4 },
    { i: WIDGET_IDS.myComments, x: 0, y: 78, w: 6, h: 7 },
    { i: WIDGET_IDS.settingsRow, x: 0, y: 85, w: 6, h: 4 },
  ],
  xs: [
    { i: WIDGET_IDS.quickAdmin, x: 0, y: 0, w: 4, h: 3 },
    { i: WIDGET_IDS.adminAlerts, x: 0, y: 3, w: 4, h: 3 },
    { i: WIDGET_IDS.currentlyWatching, x: 0, y: 6, w: 4, h: 4 },
    { i: WIDGET_IDS.heatmap, x: 0, y: 10, w: 4, h: 3 },
    { i: WIDGET_IDS.notifications, x: 0, y: 13, w: 4, h: 3 },
    { i: WIDGET_IDS.myCases, x: 0, y: 16, w: 4, h: 3 },
    { i: WIDGET_IDS.myReviews, x: 0, y: 19, w: 4, h: 4 },
    { i: WIDGET_IDS.reviewsActivity, x: 0, y: 23, w: 4, h: 3 },
    { i: WIDGET_IDS.yearSummary, x: 0, y: 26, w: 4, h: 3 },
    { i: WIDGET_IDS.genres, x: 0, y: 29, w: 4, h: 5 },
    { i: WIDGET_IDS.collections, x: 0, y: 34, w: 4, h: 4 },
    { i: WIDGET_IDS.achievements, x: 0, y: 38, w: 4, h: 5 },
    { i: WIDGET_IDS.followedTitles, x: 0, y: 43, w: 4, h: 4 },
    { i: WIDGET_IDS.favorites, x: 0, y: 47, w: 4, h: 4 },
    { i: WIDGET_IDS.topRated, x: 0, y: 51, w: 4, h: 4 },
    { i: WIDGET_IDS.myDisputes, x: 0, y: 55, w: 4, h: 3 },
    { i: WIDGET_IDS.recentlyCompleted, x: 0, y: 58, w: 4, h: 4 },
    { i: WIDGET_IDS.topGenresList, x: 0, y: 62, w: 4, h: 3 },
    { i: WIDGET_IDS.topCountries, x: 0, y: 65, w: 4, h: 3 },
    { i: WIDGET_IDS.topActors, x: 0, y: 68, w: 4, h: 3 },
    { i: WIDGET_IDS.topCompanies, x: 0, y: 71, w: 4, h: 3 },
    { i: WIDGET_IDS.completedByYear, x: 0, y: 74, w: 4, h: 4 },
    { i: WIDGET_IDS.myComments, x: 0, y: 78, w: 4, h: 7 },
    { i: WIDGET_IDS.settingsRow, x: 0, y: 85, w: 4, h: 4 },
  ],
};

// Layout default USER — mock-aligned (style-guide/my-.profile2.png).
// Currently watching como hero arriba, despues social + charts +
// listas. Sin admin tools.
const USER_LAYOUTS: DashboardLayouts = {
  lg: [
    { i: WIDGET_IDS.currentlyWatching, x: 0, y: 0, w: 12, h: 4 },
    { i: WIDGET_IDS.myReviews, x: 0, y: 4, w: 5, h: 4 },
    { i: WIDGET_IDS.notifications, x: 5, y: 4, w: 4, h: 4 },
    { i: WIDGET_IDS.myCases, x: 9, y: 4, w: 3, h: 4 },
    { i: WIDGET_IDS.reviewsActivity, x: 0, y: 8, w: 6, h: 3 },
    { i: WIDGET_IDS.yearSummary, x: 6, y: 8, w: 6, h: 3 },
    { i: WIDGET_IDS.heatmap, x: 0, y: 11, w: 6, h: 3 },
    { i: WIDGET_IDS.genres, x: 6, y: 11, w: 3, h: 3 },
    { i: WIDGET_IDS.completedByYear, x: 9, y: 11, w: 3, h: 3 },
    { i: WIDGET_IDS.topGenresList, x: 0, y: 14, w: 3, h: 4 },
    { i: WIDGET_IDS.topCountries, x: 3, y: 14, w: 3, h: 4 },
    { i: WIDGET_IDS.topActors, x: 6, y: 14, w: 3, h: 4 },
    { i: WIDGET_IDS.topCompanies, x: 9, y: 14, w: 3, h: 4 },
    { i: WIDGET_IDS.collections, x: 0, y: 18, w: 6, h: 4 },
    { i: WIDGET_IDS.achievements, x: 6, y: 18, w: 6, h: 4 },
    { i: WIDGET_IDS.recentlyCompleted, x: 0, y: 22, w: 3, h: 4 },
    { i: WIDGET_IDS.favorites, x: 3, y: 22, w: 3, h: 4 },
    { i: WIDGET_IDS.topRated, x: 6, y: 22, w: 3, h: 4 },
    { i: WIDGET_IDS.myDisputes, x: 9, y: 22, w: 3, h: 4 },
    { i: WIDGET_IDS.followedTitles, x: 0, y: 26, w: 12, h: 3 },
    { i: WIDGET_IDS.myComments, x: 0, y: 29, w: 12, h: 6, minW: 6, minH: 5 },
    // Row final: SettingsRow (6 cards horizontales del mock)
    { i: WIDGET_IDS.settingsRow, x: 0, y: 35, w: 12, h: 4, minW: 6, minH: 3 },
  ],
  md: [
    { i: WIDGET_IDS.currentlyWatching, x: 0, y: 0, w: 10, h: 4 },
    { i: WIDGET_IDS.myReviews, x: 0, y: 4, w: 5, h: 4 },
    { i: WIDGET_IDS.notifications, x: 5, y: 4, w: 5, h: 4 },
    { i: WIDGET_IDS.myCases, x: 0, y: 8, w: 5, h: 3 },
    { i: WIDGET_IDS.reviewsActivity, x: 5, y: 8, w: 5, h: 3 },
    { i: WIDGET_IDS.yearSummary, x: 0, y: 11, w: 5, h: 3 },
    { i: WIDGET_IDS.heatmap, x: 5, y: 11, w: 5, h: 3 },
    { i: WIDGET_IDS.genres, x: 0, y: 14, w: 5, h: 4 },
    { i: WIDGET_IDS.completedByYear, x: 5, y: 14, w: 5, h: 4 },
    { i: WIDGET_IDS.topGenresList, x: 0, y: 18, w: 5, h: 4 },
    { i: WIDGET_IDS.topCountries, x: 5, y: 18, w: 5, h: 4 },
    { i: WIDGET_IDS.topActors, x: 0, y: 22, w: 5, h: 4 },
    { i: WIDGET_IDS.topCompanies, x: 5, y: 22, w: 5, h: 4 },
    { i: WIDGET_IDS.collections, x: 0, y: 26, w: 5, h: 4 },
    { i: WIDGET_IDS.achievements, x: 5, y: 26, w: 5, h: 4 },
    { i: WIDGET_IDS.recentlyCompleted, x: 0, y: 30, w: 5, h: 4 },
    { i: WIDGET_IDS.favorites, x: 5, y: 30, w: 5, h: 4 },
    { i: WIDGET_IDS.topRated, x: 0, y: 34, w: 5, h: 4 },
    { i: WIDGET_IDS.myDisputes, x: 5, y: 34, w: 5, h: 4 },
    { i: WIDGET_IDS.followedTitles, x: 0, y: 38, w: 10, h: 3 },
    { i: WIDGET_IDS.myComments, x: 0, y: 41, w: 10, h: 6 },
    { i: WIDGET_IDS.settingsRow, x: 0, y: 47, w: 10, h: 4 },
  ],
  sm: [
    { i: WIDGET_IDS.currentlyWatching, x: 0, y: 0, w: 6, h: 4 },
    { i: WIDGET_IDS.myReviews, x: 0, y: 4, w: 6, h: 4 },
    { i: WIDGET_IDS.notifications, x: 0, y: 8, w: 6, h: 3 },
    { i: WIDGET_IDS.myCases, x: 0, y: 11, w: 6, h: 3 },
    { i: WIDGET_IDS.reviewsActivity, x: 0, y: 14, w: 6, h: 3 },
    { i: WIDGET_IDS.yearSummary, x: 0, y: 17, w: 6, h: 3 },
    { i: WIDGET_IDS.heatmap, x: 0, y: 20, w: 6, h: 3 },
    { i: WIDGET_IDS.genres, x: 0, y: 23, w: 6, h: 4 },
    { i: WIDGET_IDS.collections, x: 0, y: 27, w: 6, h: 4 },
    { i: WIDGET_IDS.achievements, x: 0, y: 31, w: 6, h: 5 },
    { i: WIDGET_IDS.topGenresList, x: 0, y: 36, w: 6, h: 3 },
    { i: WIDGET_IDS.topCountries, x: 0, y: 39, w: 6, h: 3 },
    { i: WIDGET_IDS.topActors, x: 0, y: 42, w: 6, h: 3 },
    { i: WIDGET_IDS.topCompanies, x: 0, y: 45, w: 6, h: 3 },
    { i: WIDGET_IDS.recentlyCompleted, x: 0, y: 48, w: 6, h: 4 },
    { i: WIDGET_IDS.favorites, x: 0, y: 52, w: 6, h: 4 },
    { i: WIDGET_IDS.topRated, x: 0, y: 56, w: 6, h: 4 },
    { i: WIDGET_IDS.myDisputes, x: 0, y: 60, w: 6, h: 3 },
    { i: WIDGET_IDS.followedTitles, x: 0, y: 63, w: 6, h: 3 },
    { i: WIDGET_IDS.completedByYear, x: 0, y: 66, w: 6, h: 3 },
    { i: WIDGET_IDS.myComments, x: 0, y: 69, w: 6, h: 7 },
    { i: WIDGET_IDS.settingsRow, x: 0, y: 76, w: 6, h: 4 },
  ],
  xs: [
    { i: WIDGET_IDS.currentlyWatching, x: 0, y: 0, w: 4, h: 4 },
    { i: WIDGET_IDS.myReviews, x: 0, y: 4, w: 4, h: 4 },
    { i: WIDGET_IDS.notifications, x: 0, y: 8, w: 4, h: 3 },
    { i: WIDGET_IDS.myCases, x: 0, y: 11, w: 4, h: 3 },
    { i: WIDGET_IDS.reviewsActivity, x: 0, y: 14, w: 4, h: 3 },
    { i: WIDGET_IDS.yearSummary, x: 0, y: 17, w: 4, h: 3 },
    { i: WIDGET_IDS.heatmap, x: 0, y: 20, w: 4, h: 3 },
    { i: WIDGET_IDS.genres, x: 0, y: 23, w: 4, h: 4 },
    { i: WIDGET_IDS.collections, x: 0, y: 27, w: 4, h: 4 },
    { i: WIDGET_IDS.achievements, x: 0, y: 31, w: 4, h: 5 },
    { i: WIDGET_IDS.topGenresList, x: 0, y: 36, w: 4, h: 3 },
    { i: WIDGET_IDS.topCountries, x: 0, y: 39, w: 4, h: 3 },
    { i: WIDGET_IDS.topActors, x: 0, y: 42, w: 4, h: 3 },
    { i: WIDGET_IDS.topCompanies, x: 0, y: 45, w: 4, h: 3 },
    { i: WIDGET_IDS.recentlyCompleted, x: 0, y: 48, w: 4, h: 4 },
    { i: WIDGET_IDS.favorites, x: 0, y: 52, w: 4, h: 4 },
    { i: WIDGET_IDS.topRated, x: 0, y: 56, w: 4, h: 4 },
    { i: WIDGET_IDS.myDisputes, x: 0, y: 60, w: 4, h: 3 },
    { i: WIDGET_IDS.followedTitles, x: 0, y: 63, w: 4, h: 3 },
    { i: WIDGET_IDS.completedByYear, x: 0, y: 66, w: 4, h: 3 },
    { i: WIDGET_IDS.myComments, x: 0, y: 69, w: 4, h: 7 },
    { i: WIDGET_IDS.settingsRow, x: 0, y: 76, w: 4, h: 4 },
  ],
};

export function DashboardClient() {
  const { t } = useLocale();
  const { status, data: session } = useSession();
  const [data, setData] = useState<ProfileData | null>(null);
  const [errored, setErrored] = useState(false);
  const [editing, setEditing] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);

  const isAdmin =
    (data?.user.role ?? (session?.user as { role?: string })?.role) === 'ADMIN';
  // Bumped a v4 al integrar las 5 sections del overview como widgets nuevos
  // (achievements, collections, yearSummary, reviewsActivity, followedTitles)
  // — layouts viejos cacheados por user serian incompatibles.
  const dashboardKey = isAdmin ? 'profile-admin-v4' : 'profile-user-v4';
  const defaultLayouts = isAdmin ? ADMIN_LAYOUTS : USER_LAYOUTS;

  const { layouts, setLayouts, removeWidget, addWidget, reset, widgetIds } =
    useDashboardLayout(dashboardKey, defaultLayouts);

  // Customizacion adicional via toggle on/off por section. La preferencia
  // es ortogonal al layout: aunque el user reordene/agregue widgets, los
  // toggles del CustomizeDrawer siguen valiendo. Si la section esta
  // off, el widget mapped no se renderea aunque este en el layout.
  const { isVisible, toggle, reset: resetVisibility } = useSectionVisibility();

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
      id: WIDGET_IDS.heatmap,
      category: 'activity',
      labelKey: 'profileDashboard.widgetHeatmap',
      descriptionKey: 'profileDashboard.widgetHeatmapDesc',
      defaultSize: { w: 8, h: 3, minW: 6, minH: 3 },
      Component: HeatmapWidget as never,
    });
    WidgetRegistry.register({
      id: WIDGET_IDS.genres,
      category: 'overview',
      labelKey: 'profileDashboard.widgetGenres',
      descriptionKey: 'profileDashboard.widgetGenresDesc',
      defaultSize: { w: 4, h: 5, minW: 3, minH: 4 },
      Component: GenresDonutWidget as never,
    });
    WidgetRegistry.register({
      id: WIDGET_IDS.completedByYear,
      category: 'activity',
      labelKey: 'profileDashboard.widgetCompletedByYear',
      descriptionKey: 'profileDashboard.widgetCompletedByYearDesc',
      defaultSize: { w: 8, h: 5, minW: 4, minH: 4 },
      Component: CompletedByYearWidget as never,
    });
    WidgetRegistry.register({
      id: WIDGET_IDS.topGenresList,
      category: 'overview',
      labelKey: 'profileDashboard.widgetTopGenresList',
      descriptionKey: 'profileDashboard.widgetTopGenresListDesc',
      defaultSize: { w: 3, h: 4, minW: 3, minH: 3 },
      Component: TopGenresListWidget as never,
    });
    WidgetRegistry.register({
      id: WIDGET_IDS.topCountries,
      category: 'overview',
      labelKey: 'profileDashboard.widgetTopCountries',
      descriptionKey: 'profileDashboard.widgetTopCountriesDesc',
      defaultSize: { w: 3, h: 4, minW: 3, minH: 3 },
      Component: TopCountriesListWidget as never,
    });
    WidgetRegistry.register({
      id: WIDGET_IDS.topActors,
      category: 'overview',
      labelKey: 'profileDashboard.widgetTopActors',
      descriptionKey: 'profileDashboard.widgetTopActorsDesc',
      defaultSize: { w: 3, h: 4, minW: 3, minH: 3 },
      Component: TopActorsListWidget as never,
    });
    WidgetRegistry.register({
      id: WIDGET_IDS.topCompanies,
      category: 'overview',
      labelKey: 'profileDashboard.widgetTopCompanies',
      descriptionKey: 'profileDashboard.widgetTopCompaniesDesc',
      defaultSize: { w: 3, h: 4, minW: 3, minH: 3 },
      Component: TopCompaniesListWidget as never,
    });
    WidgetRegistry.register({
      id: WIDGET_IDS.currentlyWatching,
      category: 'media',
      labelKey: 'profileDashboard.widgetCurrentlyWatching',
      descriptionKey: 'profileDashboard.widgetCurrentlyWatchingDesc',
      defaultSize: { w: 12, h: 4, minW: 6, minH: 4 },
      Component: CurrentlyWatchingWidget as never,
    });
    WidgetRegistry.register({
      id: WIDGET_IDS.recentlyCompleted,
      category: 'media',
      labelKey: 'profileDashboard.widgetRecentlyCompleted',
      descriptionKey: 'profileDashboard.widgetRecentlyCompletedDesc',
      defaultSize: { w: 4, h: 4, minW: 3, minH: 3 },
      Component: RecentlyCompletedWidget as never,
    });
    WidgetRegistry.register({
      id: WIDGET_IDS.favorites,
      category: 'media',
      labelKey: 'profileDashboard.widgetFavorites',
      descriptionKey: 'profileDashboard.widgetFavoritesDesc',
      defaultSize: { w: 4, h: 4, minW: 3, minH: 3 },
      Component: FavoritesWidget as never,
    });
    WidgetRegistry.register({
      id: WIDGET_IDS.topRated,
      category: 'overview',
      labelKey: 'profileDashboard.widgetTopRated',
      descriptionKey: 'profileDashboard.widgetTopRatedDesc',
      defaultSize: { w: 4, h: 4, minW: 3, minH: 3 },
      Component: TopRatedSeriesWidget as never,
    });
    WidgetRegistry.register({
      id: WIDGET_IDS.myReviews,
      category: 'social',
      labelKey: 'profileDashboard.widgetMyReviews',
      descriptionKey: 'profileDashboard.widgetMyReviewsDesc',
      defaultSize: { w: 4, h: 4, minW: 3, minH: 3 },
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
      defaultSize: { w: 12, h: 6, minW: 6, minH: 5 },
      Component: MyCommentsWidget as never,
    });
    WidgetRegistry.register({
      id: WIDGET_IDS.myCases,
      category: 'social',
      labelKey: 'profileDashboard.widgetMyCases',
      descriptionKey: 'profileDashboard.widgetMyCasesDesc',
      defaultSize: { w: 6, h: 3, minW: 4, minH: 3 },
      Component: MyCasesWidget as never,
    });
    WidgetRegistry.register({
      id: WIDGET_IDS.notifications,
      category: 'activity',
      labelKey: 'profileDashboard.widgetNotifications',
      descriptionKey: 'profileDashboard.widgetNotificationsDesc',
      defaultSize: { w: 6, h: 3, minW: 4, minH: 3 },
      Component: DashboardNotificationsWidget as never,
    });
    WidgetRegistry.register({
      id: WIDGET_IDS.quickAdmin,
      category: 'admin',
      labelKey: 'quickAdmin.title',
      descriptionKey: 'quickAdmin.title',
      defaultSize: { w: 4, h: 3, minW: 4, minH: 3 },
      Component: QuickAdminActionsWidget as never,
      roles: ['ADMIN', 'MODERATOR'],
    });
    WidgetRegistry.register({
      id: WIDGET_IDS.adminAlerts,
      category: 'admin',
      labelKey: 'adminDashboard.alertsTitle',
      descriptionKey: 'adminDashboard.alertsTitle',
      defaultSize: { w: 12, h: 3, minW: 6, minH: 3 },
      Component: AdminAlertsWidget as never,
      roles: ['ADMIN', 'MODERATOR'],
    });
    // Sections del overview wrappeadas en Widget shell para que vivan
    // dentro del grid junto a los demas widgets. La section trae su
    // propio header interno; el Widget wrapper aporta el drag handle
    // en modo edicion + remove btn.
    WidgetRegistry.register({
      id: WIDGET_IDS.achievements,
      category: 'overview',
      labelKey: 'profile.sectionAchievements',
      descriptionKey: 'profile.sectionAchievements',
      defaultSize: { w: 6, h: 4, minW: 4, minH: 4 },
      Component: AchievementsWidget as never,
    });
    WidgetRegistry.register({
      id: WIDGET_IDS.collections,
      category: 'overview',
      labelKey: 'profile.sectionCollections',
      descriptionKey: 'profile.sectionCollections',
      defaultSize: { w: 6, h: 4, minW: 4, minH: 3 },
      Component: CollectionsWidget as never,
    });
    WidgetRegistry.register({
      id: WIDGET_IDS.yearSummary,
      category: 'activity',
      labelKey: 'profile.sectionYearSummary',
      descriptionKey: 'profile.sectionYearSummary',
      defaultSize: { w: 6, h: 3, minW: 4, minH: 3 },
      Component: YearSummaryWidget as never,
    });
    WidgetRegistry.register({
      id: WIDGET_IDS.reviewsActivity,
      category: 'social',
      labelKey: 'profile.sectionReviewsActivity',
      descriptionKey: 'profile.sectionReviewsActivity',
      defaultSize: { w: 6, h: 3, minW: 4, minH: 3 },
      Component: ReviewsActivityWidget as never,
    });
    WidgetRegistry.register({
      id: WIDGET_IDS.followedTitles,
      category: 'media',
      labelKey: 'profile.sectionFollowedTitles',
      descriptionKey: 'profile.sectionFollowedTitles',
      defaultSize: { w: 12, h: 3, minW: 6, minH: 3 },
      Component: FollowedTitlesWidget as never,
    });
    WidgetRegistry.register({
      id: WIDGET_IDS.settingsRow,
      category: 'overview',
      labelKey: 'profile.sectionSettings',
      descriptionKey: 'profile.sectionSettings',
      defaultSize: { w: 12, h: 4, minW: 6, minH: 3 },
      Component: SettingsRowWidget as never,
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
    map[WIDGET_IDS.heatmap] = { heatmap: data.stats.heatmap };
    map[WIDGET_IDS.genres] = { topGenres: data.stats.topGenres };
    map[WIDGET_IDS.completedByYear] = {
      completedByYear: data.stats.completedByYear,
    };
    map[WIDGET_IDS.topGenresList] = { topGenres: data.stats.topGenres };
    map[WIDGET_IDS.topCountries] = { topCountries: data.stats.topCountries };
    map[WIDGET_IDS.topActors] = { topActors: data.stats.topActors };
    map[WIDGET_IDS.topCompanies] = {
      topProductionCompanies: data.stats.topProductionCompanies,
    };
    map[WIDGET_IDS.currentlyWatching] = { items: data.currentlyWatching };
    map[WIDGET_IDS.recentlyCompleted] = { items: data.recentlyCompleted };
    map[WIDGET_IDS.favorites] = { favorites: data.favorites };
    map[WIDGET_IDS.topRated] = { topRatedSeries: data.stats.topRatedSeries };
    map[WIDGET_IDS.myReviews] = { recentReviews: data.recentReviews };
    map[WIDGET_IDS.myDisputes] = {};
    map[WIDGET_IDS.myComments] = {};
    map[WIDGET_IDS.myCases] = {};
    map[WIDGET_IDS.notifications] = {};
    map[WIDGET_IDS.quickAdmin] = {};
    map[WIDGET_IDS.adminAlerts] = {};
    map[WIDGET_IDS.achievements] = { stats: data.stats };
    map[WIDGET_IDS.collections] = { stats: data.stats };
    map[WIDGET_IDS.yearSummary] = { stats: data.stats };
    map[WIDGET_IDS.reviewsActivity] = { stats: data.stats };
    map[WIDGET_IDS.followedTitles] = { favorites: data.favorites };
    map[WIDGET_IDS.settingsRow] = {};
    return map;
  }, [data]);

  // Filtramos los layouts segun el CustomizeDrawer: para cada widget,
  // si la section mapeada esta off (hidden) lo sacamos del layout antes
  // de pasarlo al grid. Asi el toggle on/off coexiste con el drag-drop:
  // el user puede ocultar via drawer o reordenar via grid, ortogonales.
  const visibleLayouts = useMemo<DashboardLayouts>(() => {
    const filterItems = (items: typeof layouts.lg) =>
      items?.filter((item) => {
        const sectionKey = WIDGET_TO_SECTION[item.i];
        if (!sectionKey) return true;
        return isVisible(sectionKey as OverviewSectionKey);
      });
    return {
      lg: filterItems(layouts.lg),
      md: filterItems(layouts.md),
      sm: filterItems(layouts.sm),
      xs: filterItems(layouts.xs),
    };
  }, [layouts, isVisible]);

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
        <ProfileDashboardHeader
          user={data.user}
          onCustomizeClick={() => setCustomizeOpen(true)}
        />
        <ProfileStatsStrip stats={data.stats} />

        <DashboardEditToolbar
          editing={editing}
          onToggleEditing={() => setEditing((v) => !v)}
          onAddWidget={() => setPickerOpen(true)}
          onReset={reset}
        />

        <DashboardGrid
          layouts={visibleLayouts}
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

        {/* Settings + suscripciones + version info — togglable via key
         *  'settings'. El id mb-profile-settings es target de scroll del
         *  boton "Editar perfil" del header. */}
        {isVisible('settings') && (
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
        )}
      </div>

      <CustomizeDrawer
        open={customizeOpen}
        onClose={() => setCustomizeOpen(false)}
        isVisible={isVisible}
        onToggle={toggle}
        onReset={resetVisibility}
      />
    </AppLayout>
  );
}
