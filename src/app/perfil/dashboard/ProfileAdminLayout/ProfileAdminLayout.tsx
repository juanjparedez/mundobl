'use client';

import type { ProfileData } from '../../types';
import { HeatmapWidget } from '../widgets/HeatmapWidget/HeatmapWidget';
import { QuickAdminActionsWidget } from '../widgets/QuickAdminActionsWidget/QuickAdminActionsWidget';
import { AdminAlertsWidget } from '../widgets/AdminAlertsWidget/AdminAlertsWidget';
import { MyCasesWidget } from '../widgets/MyCasesWidget/MyCasesWidget';
import { DashboardNotificationsWidget } from '../widgets/NotificationsWidget/DashboardNotificationsWidget';
import { CurrentlyWatchingWidget } from '../widgets/CurrentlyWatchingWidget/CurrentlyWatchingWidget';
import { MyReviewsWidget } from '../widgets/MyReviewsWidget/MyReviewsWidget';
import { MyDisputesWidget } from '../widgets/MyDisputesWidget/MyDisputesWidget';
import { MyCommentsWidget } from '../widgets/MyCommentsWidget/MyCommentsWidget';
import { RecentlyCompletedWidget } from '../widgets/RecentlyCompletedWidget/RecentlyCompletedWidget';
import { FavoritesWidget } from '../widgets/FavoritesWidget/FavoritesWidget';
import { TopRatedSeriesWidget } from '../widgets/TopRatedSeriesWidget/TopRatedSeriesWidget';
import { GenresDonutWidget } from '../widgets/GenresDonutWidget/GenresDonutWidget';
import { TopGenresListWidget } from '../widgets/TopGenresListWidget/TopGenresListWidget';
import { TopCountriesListWidget } from '../widgets/TopCountriesListWidget/TopCountriesListWidget';
import { TopActorsListWidget } from '../widgets/TopActorsListWidget/TopActorsListWidget';
import { TopCompaniesListWidget } from '../widgets/TopCompaniesListWidget/TopCompaniesListWidget';
import { CompletedByYearWidget } from '../widgets/CompletedByYearWidget/CompletedByYearWidget';
import './ProfileAdminLayout.css';

export interface ProfileAdminLayoutProps {
  data: ProfileData;
}

/** Layout fijo del perfil ADMIN — copia literal del mock my-profile.png.
 *  No es un grid reordenable: cada seccion vive en una posicion definida
 *  por CSS grid, replicando la composicion del mock. */
export function ProfileAdminLayout({ data }: ProfileAdminLayoutProps) {
  return (
    <div className="mb-profile-admin">
      {/* Row 1: Heatmap wide + QuickAdmin lateral (mock col mayor + sidebar) */}
      <section className="mb-profile-admin__row mb-profile-admin__row--heatmap">
        <div className="mb-profile-admin__cell mb-profile-admin__cell--heatmap">
          <HeatmapWidget heatmap={data.stats.heatmap} />
        </div>
        <div className="mb-profile-admin__cell mb-profile-admin__cell--quickadmin">
          <QuickAdminActionsWidget />
        </div>
      </section>

      {/* Row admin alerts: counts accionables (series sin resena, comments
       *  reportados, sitios sugeridos pendientes). Antes vivian en
       *  /admin/dashboard; ahora unificadas aca. Full-width para que el
       *  ActionCard grid respire y los counts grandes sean legibles. */}
      <section className="mb-profile-admin__row mb-profile-admin__row--full">
        <div className="mb-profile-admin__cell mb-profile-admin__cell--alerts">
          <AdminAlertsWidget />
        </div>
      </section>

      {/* Row 2: Currently watching shelf full-width (necesita ancho para
       *  el carrusel horizontal de cards). */}
      <section className="mb-profile-admin__row mb-profile-admin__row--full">
        <div className="mb-profile-admin__cell mb-profile-admin__cell--shelf">
          <CurrentlyWatchingWidget items={data.currentlyWatching} />
        </div>
      </section>

      {/* Row 3: Mis casos + Notificaciones (admin activity) en 2 cols */}
      <section className="mb-profile-admin__row mb-profile-admin__row--2up">
        <div className="mb-profile-admin__cell">
          <MyCasesWidget />
        </div>
        <div className="mb-profile-admin__cell">
          <DashboardNotificationsWidget />
        </div>
      </section>

      {/* Row 4: Mis reviews + Disputas + Recently completed */}
      <section className="mb-profile-admin__row mb-profile-admin__row--3up">
        <div className="mb-profile-admin__cell">
          <MyReviewsWidget recentReviews={data.recentReviews} />
        </div>
        <div className="mb-profile-admin__cell">
          <MyDisputesWidget />
        </div>
        <div className="mb-profile-admin__cell">
          <RecentlyCompletedWidget items={data.recentlyCompleted} />
        </div>
      </section>

      {/* Row 4: Charts (donut compacto + completedByYear wide) */}
      <section className="mb-profile-admin__row mb-profile-admin__row--charts">
        <div className="mb-profile-admin__cell">
          <GenresDonutWidget topGenres={data.stats.topGenres} />
        </div>
        <div className="mb-profile-admin__cell mb-profile-admin__cell--wide">
          <CompletedByYearWidget completedByYear={data.stats.completedByYear} />
        </div>
      </section>

      {/* Row 5: 4 top lists alineadas */}
      <section className="mb-profile-admin__row mb-profile-admin__row--4up">
        <div className="mb-profile-admin__cell">
          <TopGenresListWidget topGenres={data.stats.topGenres} />
        </div>
        <div className="mb-profile-admin__cell">
          <TopCountriesListWidget topCountries={data.stats.topCountries} />
        </div>
        <div className="mb-profile-admin__cell">
          <TopActorsListWidget topActors={data.stats.topActors} />
        </div>
        <div className="mb-profile-admin__cell">
          <TopCompaniesListWidget
            topProductionCompanies={data.stats.topProductionCompanies}
          />
        </div>
      </section>

      {/* Row 6: Favorites + TopRated */}
      <section className="mb-profile-admin__row mb-profile-admin__row--2up">
        <div className="mb-profile-admin__cell">
          <FavoritesWidget favorites={data.favorites} />
        </div>
        <div className="mb-profile-admin__cell">
          <TopRatedSeriesWidget topRatedSeries={data.stats.topRatedSeries} />
        </div>
      </section>

      {/* Row 7: My comments full-width */}
      <section className="mb-profile-admin__row mb-profile-admin__row--full">
        <div className="mb-profile-admin__cell">
          <MyCommentsWidget />
        </div>
      </section>
    </div>
  );
}
