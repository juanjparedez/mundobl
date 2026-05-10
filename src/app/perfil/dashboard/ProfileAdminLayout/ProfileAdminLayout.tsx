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
import { OverviewAchievements } from '../../overview/sections/Achievements';
import { OverviewCollections } from '../../overview/sections/Collections';
import { OverviewYearSummary } from '../../overview/sections/YearSummary';
import { OverviewReviewsActivity } from '../../overview/sections/ReviewsActivity';
import { OverviewFollowedTitles } from '../../overview/sections/FollowedTitles';
import type { OverviewSectionKey } from '../../overview/useSectionVisibility';
import './ProfileAdminLayout.css';

export interface ProfileAdminLayoutProps {
  data: ProfileData;
  /** Visibility check por section key. Cuando una cell esta oculta no
   *  se renderea; cuando todas las cells de una row estan ocultas, la
   *  row entera se omite para no dejar gaps. Default: todo visible. */
  isVisible?: (key: OverviewSectionKey) => boolean;
}

/** Layout fijo del perfil ADMIN — copia literal del mock my-profile.png
 *  con las sections del overview integradas para no perder funcionalidad
 *  (Achievements, Collections, YearSummary, ReviewsActivity, FollowedTitles).
 *  Cada cell se puede ocultar/mostrar via CustomizeDrawer (preferencia
 *  persiste en localStorage via useSectionVisibility). */
export function ProfileAdminLayout({
  data,
  isVisible = () => true,
}: ProfileAdminLayoutProps) {
  // Helpers para evaluar visibilidad de filas: si todas las cells de la
  // row estan ocultas, no renderear el wrapper de la row.
  const v = isVisible;

  return (
    <div className="mb-profile-admin">
      {/* Row 1: Heatmap wide + QuickAdmin lateral. QuickAdmin no es
       *  toggleable (admin tools siempre visibles). El heatmap usa la
       *  key mystats porque visualiza la actividad personal. */}
      {(v('mystats') || true) && (
        <section className="mb-profile-admin__row mb-profile-admin__row--heatmap">
          {v('mystats') && (
            <div className="mb-profile-admin__cell mb-profile-admin__cell--heatmap">
              <HeatmapWidget heatmap={data.stats.heatmap} />
            </div>
          )}
          <div className="mb-profile-admin__cell mb-profile-admin__cell--quickadmin">
            <QuickAdminActionsWidget />
          </div>
        </section>
      )}

      {/* Row admin alerts: counts accionables — admin-only, siempre visible. */}
      <section className="mb-profile-admin__row mb-profile-admin__row--full">
        <div className="mb-profile-admin__cell mb-profile-admin__cell--alerts">
          <AdminAlertsWidget />
        </div>
      </section>

      {/* Row 2: Currently watching shelf full-width. */}
      {v('watching') && (
        <section className="mb-profile-admin__row mb-profile-admin__row--full">
          <div className="mb-profile-admin__cell mb-profile-admin__cell--shelf">
            <CurrentlyWatchingWidget items={data.currentlyWatching} />
          </div>
        </section>
      )}

      {/* Row 3: Mis casos + Notificaciones (admin activity). */}
      {(v('cases') || v('notifications')) && (
        <section className="mb-profile-admin__row mb-profile-admin__row--2up">
          {v('cases') && (
            <div className="mb-profile-admin__cell">
              <MyCasesWidget />
            </div>
          )}
          {v('notifications') && (
            <div className="mb-profile-admin__cell">
              <DashboardNotificationsWidget />
            </div>
          )}
        </section>
      )}

      {/* Row 4: Mis reviews + Disputas + Recently completed. Disputes y
       *  Recently completed son admin tools, no toggleables. */}
      {v('reviews') && (
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
      )}

      {/* Row reviews-activity + year-summary: KPIs personales del año. */}
      {(v('reviewsActivity') || v('yearSummary')) && (
        <section className="mb-profile-admin__row mb-profile-admin__row--2up">
          {v('reviewsActivity') && (
            <div className="mb-profile-admin__cell">
              <OverviewReviewsActivity stats={data.stats} />
            </div>
          )}
          {v('yearSummary') && (
            <div className="mb-profile-admin__cell">
              <OverviewYearSummary stats={data.stats} />
            </div>
          )}
        </section>
      )}

      {/* Row Charts: donut compacto + completedByYear wide. */}
      <section className="mb-profile-admin__row mb-profile-admin__row--charts">
        <div className="mb-profile-admin__cell">
          <GenresDonutWidget topGenres={data.stats.topGenres} />
        </div>
        <div className="mb-profile-admin__cell mb-profile-admin__cell--wide">
          <CompletedByYearWidget completedByYear={data.stats.completedByYear} />
        </div>
      </section>

      {/* Row 5: 4 top lists alineadas. */}
      {v('countries') && (
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
      )}

      {/* Row collections + achievements: features del overview migrados al
       *  layout fijo. Sin estos el dashboard no llegaba a paridad con
       *  /perfil/overview anterior. */}
      {(v('collections') || v('achievements')) && (
        <section className="mb-profile-admin__row mb-profile-admin__row--2up">
          {v('collections') && (
            <div className="mb-profile-admin__cell">
              <OverviewCollections stats={data.stats} />
            </div>
          )}
          {v('achievements') && (
            <div className="mb-profile-admin__cell">
              <OverviewAchievements stats={data.stats} />
            </div>
          )}
        </section>
      )}

      {/* Row 6: Favorites + FollowedTitles + TopRated. FollowedTitles
       *  reemplaza al hueco que dejaba Favorites/TopRated 2up. */}
      {(v('followed') || true) && (
        <section className="mb-profile-admin__row mb-profile-admin__row--3up">
          {v('followed') && (
            <div className="mb-profile-admin__cell">
              <OverviewFollowedTitles favorites={data.favorites} />
            </div>
          )}
          <div className="mb-profile-admin__cell">
            <FavoritesWidget favorites={data.favorites} />
          </div>
          <div className="mb-profile-admin__cell">
            <TopRatedSeriesWidget topRatedSeries={data.stats.topRatedSeries} />
          </div>
        </section>
      )}

      {/* Row 7: My comments full-width. */}
      {v('comments') && (
        <section className="mb-profile-admin__row mb-profile-admin__row--full">
          <div className="mb-profile-admin__cell">
            <MyCommentsWidget />
          </div>
        </section>
      )}
    </div>
  );
}
