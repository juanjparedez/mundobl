'use client';

import dynamic from 'next/dynamic';
import {
  WidgetRegistry,
  type DashboardItem,
  type DashboardLayouts,
} from '@/components/dashboard';
import { StatsStripWidget } from './widgets/StatsStripWidget/StatsStripWidget';
import { ProfileCompletenessWidget } from './widgets/ProfileCompletenessWidget/ProfileCompletenessWidget';
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
import { MyDiaryWidget } from './widgets/MyDiaryWidget/MyDiaryWidget';
import { MyCasesWidget } from './widgets/MyCasesWidget/MyCasesWidget';
import { DashboardNotificationsWidget } from './widgets/NotificationsWidget/DashboardNotificationsWidget';
import { QuickAdminActionsWidget } from './widgets/QuickAdminActionsWidget/QuickAdminActionsWidget';
import { AdminAlertsWidget } from './widgets/AdminAlertsWidget/AdminAlertsWidget';
import { AchievementsWidget } from './widgets/AchievementsWidget/AchievementsWidget';
import { CollectionsWidget } from './widgets/CollectionsWidget/CollectionsWidget';
import { SocialsWidget } from './widgets/SocialsWidget/SocialsWidget';
import { RecentAdminActivityWidget } from '@/app/(app)/admin/widgets/RecentAdminActivityWidget/RecentAdminActivityWidget';
import { TopCommentersWidget } from '@/app/(app)/admin/widgets/TopCommentersWidget/TopCommentersWidget';
import { ActivityChartWidget } from '@/app/(app)/admin/widgets/ActivityChartWidget/ActivityChartWidget';
// Trae world-atlas (~100 KB de JSON de paises) + d3-geo + react-simple-maps.
// Solo se usa en la pestaña Estadisticas: no vale la pena pagar ese peso en
// el bundle del resto del perfil.
const WorldMapWidget = dynamic(
  () =>
    import('./widgets/WorldMapWidget/WorldMapWidget').then(
      (m) => m.WorldMapWidget
    ),
  { ssr: false }
);

// IDs estables de cada widget. Usados en layouts persistidos y registry.
// Si renombrás uno, hay que bumpear la version de PROFILE_TAB_LAYOUT_VERSION
// para invalidar layouts guardados.
export const WIDGET_IDS = {
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
  myDiary: 'profile.myDiary',
  myCases: 'profile.myCases',
  notifications: 'profile.notifications',
  quickAdmin: 'profile.quickAdmin',
  adminAlerts: 'profile.adminAlerts',
  achievements: 'profile.achievements',
  collections: 'profile.collections',
  socials: 'profile.socials',
  // Widgets compartidos con /admin (admin/moderator only) — reusados
  // del registry de /admin via import cross-feature. Mismos endpoints,
  // mismos componentes — sin duplicar codigo.
  recentAdminActivity: 'profile.recentAdminActivity',
  topCommenters: 'profile.topCommenters',
  activityChart: 'profile.activityChart',
  worldMap: 'profile.worldMap',
  statsStrip: 'profile.statsStrip',
  profileCompleteness: 'profile.profileCompleteness',
} as const;

/** Registra todos los widgets del perfil. El registry es un singleton y
 *  `register` es idempotente por id, asi que se puede llamar en cada mount. */
export function registerProfileWidgets() {
  WidgetRegistry.register({
    id: WIDGET_IDS.heatmap,
    category: 'activity',
    labelKey: 'profileDashboard.widgetHeatmap',
    descriptionKey: 'profileDashboard.widgetHeatmapDesc',
    defaultSize: { w: 8, h: 5, minW: 6, minH: 3 },
    Component: HeatmapWidget as never,
  });
  WidgetRegistry.register({
    id: WIDGET_IDS.genres,
    category: 'overview',
    labelKey: 'profileDashboard.widgetGenres',
    descriptionKey: 'profileDashboard.widgetGenresDesc',
    defaultSize: { w: 4, h: 6, minW: 3, minH: 4 },
    Component: GenresDonutWidget as never,
  });
  WidgetRegistry.register({
    id: WIDGET_IDS.completedByYear,
    category: 'activity',
    labelKey: 'profileDashboard.widgetCompletedByYear',
    descriptionKey: 'profileDashboard.widgetCompletedByYearDesc',
    defaultSize: { w: 8, h: 6, minW: 4, minH: 4 },
    Component: CompletedByYearWidget as never,
  });
  WidgetRegistry.register({
    id: WIDGET_IDS.topGenresList,
    category: 'overview',
    labelKey: 'profileDashboard.widgetTopGenresList',
    descriptionKey: 'profileDashboard.widgetTopGenresListDesc',
    defaultSize: { w: 3, h: 6, minW: 3, minH: 3 },
    Component: TopGenresListWidget as never,
  });
  WidgetRegistry.register({
    id: WIDGET_IDS.topCountries,
    category: 'overview',
    labelKey: 'profileDashboard.widgetTopCountries',
    descriptionKey: 'profileDashboard.widgetTopCountriesDesc',
    defaultSize: { w: 3, h: 6, minW: 3, minH: 3 },
    Component: TopCountriesListWidget as never,
  });
  WidgetRegistry.register({
    id: WIDGET_IDS.topActors,
    category: 'overview',
    labelKey: 'profileDashboard.widgetTopActors',
    descriptionKey: 'profileDashboard.widgetTopActorsDesc',
    defaultSize: { w: 3, h: 6, minW: 3, minH: 3 },
    Component: TopActorsListWidget as never,
  });
  WidgetRegistry.register({
    id: WIDGET_IDS.topCompanies,
    category: 'overview',
    labelKey: 'profileDashboard.widgetTopCompanies',
    descriptionKey: 'profileDashboard.widgetTopCompaniesDesc',
    defaultSize: { w: 3, h: 6, minW: 3, minH: 3 },
    Component: TopCompaniesListWidget as never,
  });
  WidgetRegistry.register({
    id: WIDGET_IDS.currentlyWatching,
    category: 'media',
    labelKey: 'profileDashboard.widgetCurrentlyWatching',
    descriptionKey: 'profileDashboard.widgetCurrentlyWatchingDesc',
    defaultSize: { w: 12, h: 5, minW: 6, minH: 4 },
    Component: CurrentlyWatchingWidget as never,
  });
  WidgetRegistry.register({
    id: WIDGET_IDS.recentlyCompleted,
    category: 'media',
    labelKey: 'profileDashboard.widgetRecentlyCompleted',
    descriptionKey: 'profileDashboard.widgetRecentlyCompletedDesc',
    defaultSize: { w: 4, h: 5, minW: 3, minH: 3 },
    Component: RecentlyCompletedWidget as never,
  });
  WidgetRegistry.register({
    id: WIDGET_IDS.favorites,
    category: 'media',
    labelKey: 'profileDashboard.widgetFavorites',
    descriptionKey: 'profileDashboard.widgetFavoritesDesc',
    defaultSize: { w: 4, h: 7, minW: 3, minH: 3 },
    Component: FavoritesWidget as never,
  });
  WidgetRegistry.register({
    id: WIDGET_IDS.topRated,
    category: 'overview',
    labelKey: 'profileDashboard.widgetTopRated',
    descriptionKey: 'profileDashboard.widgetTopRatedDesc',
    defaultSize: { w: 4, h: 5, minW: 3, minH: 3 },
    Component: TopRatedSeriesWidget as never,
  });
  WidgetRegistry.register({
    id: WIDGET_IDS.myReviews,
    category: 'social',
    labelKey: 'profileDashboard.widgetMyReviews',
    descriptionKey: 'profileDashboard.widgetMyReviewsDesc',
    defaultSize: { w: 4, h: 6, minW: 3, minH: 3 },
    Component: MyReviewsWidget as never,
  });
  WidgetRegistry.register({
    id: WIDGET_IDS.myDisputes,
    category: 'social',
    labelKey: 'profileDashboard.widgetMyDisputes',
    descriptionKey: 'profileDashboard.widgetMyDisputesDesc',
    defaultSize: { w: 4, h: 6, minW: 3, minH: 3 },
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
    id: WIDGET_IDS.myDiary,
    category: 'activity',
    labelKey: 'profileDashboard.widgetMyDiary',
    descriptionKey: 'profileDashboard.widgetMyDiaryDesc',
    defaultSize: { w: 6, h: 6, minW: 4, minH: 4 },
    Component: MyDiaryWidget as never,
  });
  WidgetRegistry.register({
    id: WIDGET_IDS.myCases,
    category: 'social',
    labelKey: 'profileDashboard.widgetMyCases',
    descriptionKey: 'profileDashboard.widgetMyCasesDesc',
    defaultSize: { w: 6, h: 4, minW: 4, minH: 3 },
    Component: MyCasesWidget as never,
  });
  WidgetRegistry.register({
    id: WIDGET_IDS.notifications,
    category: 'activity',
    labelKey: 'profileDashboard.widgetNotifications',
    descriptionKey: 'profileDashboard.widgetNotificationsDesc',
    defaultSize: { w: 6, h: 4, minW: 4, minH: 3 },
    Component: DashboardNotificationsWidget as never,
  });
  WidgetRegistry.register({
    id: WIDGET_IDS.quickAdmin,
    category: 'admin',
    labelKey: 'quickAdmin.title',
    descriptionKey: 'quickAdmin.title',
    defaultSize: { w: 4, h: 5, minW: 4, minH: 3 },
    Component: QuickAdminActionsWidget as never,
    roles: ['ADMIN', 'MODERATOR'],
  });
  WidgetRegistry.register({
    id: WIDGET_IDS.adminAlerts,
    category: 'admin',
    labelKey: 'adminDashboard.alertsTitle',
    descriptionKey: 'adminDashboard.alertsTitle',
    defaultSize: { w: 12, h: 6, minW: 6, minH: 3 },
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
    defaultSize: { w: 6, h: 5, minW: 4, minH: 4 },
    Component: AchievementsWidget as never,
  });
  WidgetRegistry.register({
    id: WIDGET_IDS.collections,
    category: 'overview',
    labelKey: 'profile.sectionCollections',
    descriptionKey: 'profile.sectionCollections',
    // 4 rows (Favoritos / Para volver a ver / Viendo / Abandonadas) +
    // widget header. h:5 garantiza que todos los items se vean sin
    // cortar (item 3 del fine_tunning_1).
    defaultSize: { w: 6, h: 5, minW: 4, minH: 5 },
    Component: CollectionsWidget as never,
  });
  // Widgets admin-only reusados desde /admin/widgets. roles filtra el
  // picker para que solo aparezcan a admin/moderator. Endpoints
  // backend ya devuelven 403 a non-admin, asi que aunque alguien
  // los agregue al layout, no muestran data sensible.
  WidgetRegistry.register({
    id: WIDGET_IDS.recentAdminActivity,
    category: 'activity',
    labelKey: 'adminActivity.title',
    descriptionKey: 'adminActivity.title',
    defaultSize: { w: 6, h: 6, minW: 4, minH: 4 },
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
    id: WIDGET_IDS.worldMap,
    category: 'overview',
    labelKey: 'worldMap.title',
    descriptionKey: 'worldMap.title',
    defaultSize: { w: 8, h: 6, minW: 4, minH: 4 },
    Component: WorldMapWidget as never,
  });
  WidgetRegistry.register({
    id: WIDGET_IDS.activityChart,
    category: 'activity',
    labelKey: 'activityChart.title',
    descriptionKey: 'activityChart.title',
    defaultSize: { w: 7, h: 6, minW: 4, minH: 4 },
    Component: ActivityChartWidget as never,
    roles: ['ADMIN', 'MODERATOR'],
  });
  WidgetRegistry.register({
    id: WIDGET_IDS.socials,
    category: 'overview',
    labelKey: 'socials.title',
    descriptionKey: 'socials.emptyHint',
    defaultSize: { w: 4, h: 4, minW: 3, minH: 3 },
    Component: SocialsWidget as never,
  });
  WidgetRegistry.register({
    id: WIDGET_IDS.statsStrip,
    category: 'overview',
    labelKey: 'profileDashboard.widgetStatsStrip',
    descriptionKey: 'profileDashboard.widgetStatsStripDesc',
    defaultSize: { w: 12, h: 3, minW: 6, minH: 2 },
    Component: StatsStripWidget as never,
  });
  WidgetRegistry.register({
    id: WIDGET_IDS.profileCompleteness,
    category: 'overview',
    labelKey: 'completeness.title',
    defaultSize: { w: 4, h: 4, minW: 3, minH: 3 },
    Component: ProfileCompletenessWidget as never,
  });
}

// ---------------------------------------------------------------------------
// Pestañas con grilla. Cada una tiene su propio set de widgets (el picker solo
// ofrece esos) y su propio layout persistido. Los altos son 'auto' (los mide
// el Widget), asi que `h` es solo el punto de partida.
// ---------------------------------------------------------------------------

export type ProfileGridTabId =
  | 'resumen'
  | 'estadisticas'
  | 'actividad'
  | 'admin';

/** Bump cuando cambie el set o el orden por defecto de una pestaña. */
export const PROFILE_TAB_LAYOUT_VERSION = 1;

type Cell = [id: string, w: number, h: number];

/** Arma lg/md/sm/xs desde filas pensadas para 12 columnas: md escala a 10,
 *  sm y xs apilan todo a ancho completo en el mismo orden. */
function buildLayouts(rows: Cell[][]): DashboardLayouts {
  const lg: DashboardItem[] = [];
  const md: DashboardItem[] = [];
  const sm: DashboardItem[] = [];
  const xs: DashboardItem[] = [];
  let y = 0;
  let stackY = 0;
  for (const row of rows) {
    let x = 0;
    let mdX = 0;
    const rowH = Math.max(...row.map(([, , h]) => h));
    row.forEach(([i, w, h], index) => {
      const mdW =
        index === row.length - 1 ? 10 - mdX : Math.round((w * 10) / 12);
      lg.push({ i, x, y, w, h });
      md.push({ i, x: mdX, y, w: mdW, h });
      sm.push({ i, x: 0, y: stackY, w: 6, h });
      xs.push({ i, x: 0, y: stackY, w: 4, h });
      x += w;
      mdX += mdW;
      stackY += h;
    });
    y += rowH;
  }
  return { lg, md, sm, xs };
}

export const PROFILE_GRID_TABS: Record<ProfileGridTabId, DashboardLayouts> = {
  resumen: buildLayouts([
    [[WIDGET_IDS.statsStrip, 12, 3]],
    [[WIDGET_IDS.currentlyWatching, 12, 5]],
    [
      [WIDGET_IDS.achievements, 6, 5],
      [WIDGET_IDS.collections, 6, 5],
    ],
    [
      [WIDGET_IDS.recentlyCompleted, 4, 5],
      [WIDGET_IDS.favorites, 4, 7],
      [WIDGET_IDS.notifications, 4, 4],
    ],
    [
      [WIDGET_IDS.profileCompleteness, 6, 4],
      [WIDGET_IDS.socials, 6, 4],
    ],
  ]),
  estadisticas: buildLayouts([
    [
      [WIDGET_IDS.heatmap, 8, 5],
      [WIDGET_IDS.genres, 4, 6],
    ],
    [
      [WIDGET_IDS.completedByYear, 6, 6],
      [WIDGET_IDS.topRated, 6, 5],
    ],
    [
      [WIDGET_IDS.worldMap, 6, 6],
      [WIDGET_IDS.topCountries, 3, 6],
      [WIDGET_IDS.topGenresList, 3, 6],
    ],
    [
      [WIDGET_IDS.topActors, 6, 6],
      [WIDGET_IDS.topCompanies, 6, 6],
    ],
  ]),
  actividad: buildLayouts([
    [
      [WIDGET_IDS.myReviews, 6, 6],
      [WIDGET_IDS.myDiary, 6, 6],
    ],
    [[WIDGET_IDS.myComments, 12, 6]],
    [
      [WIDGET_IDS.myDisputes, 6, 6],
      [WIDGET_IDS.myCases, 6, 4],
    ],
  ]),
  admin: buildLayouts([
    [[WIDGET_IDS.adminAlerts, 12, 6]],
    [
      [WIDGET_IDS.quickAdmin, 4, 5],
      [WIDGET_IDS.activityChart, 8, 6],
    ],
    [
      [WIDGET_IDS.recentAdminActivity, 6, 6],
      [WIDGET_IDS.topCommenters, 6, 5],
    ],
  ]),
};

/** Widgets que el picker ofrece en cada pestaña (los de su layout). */
export function widgetsOfTab(tab: ProfileGridTabId): Set<string> {
  return new Set((PROFILE_GRID_TABS[tab].lg ?? []).map((item) => item.i));
}
