'use client';

import type { ProfileData } from '../../types';
import { CurrentlyWatchingWidget } from '../widgets/CurrentlyWatchingWidget/CurrentlyWatchingWidget';
import { MyReviewsWidget } from '../widgets/MyReviewsWidget/MyReviewsWidget';
import { DashboardNotificationsWidget } from '../widgets/NotificationsWidget/DashboardNotificationsWidget';
import { MyCasesWidget } from '../widgets/MyCasesWidget/MyCasesWidget';
import { HeatmapWidget } from '../widgets/HeatmapWidget/HeatmapWidget';
import { GenresDonutWidget } from '../widgets/GenresDonutWidget/GenresDonutWidget';
import { CompletedByYearWidget } from '../widgets/CompletedByYearWidget/CompletedByYearWidget';
import { TopGenresListWidget } from '../widgets/TopGenresListWidget/TopGenresListWidget';
import { TopCountriesListWidget } from '../widgets/TopCountriesListWidget/TopCountriesListWidget';
import { TopActorsListWidget } from '../widgets/TopActorsListWidget/TopActorsListWidget';
import { TopCompaniesListWidget } from '../widgets/TopCompaniesListWidget/TopCompaniesListWidget';
import { RecentlyCompletedWidget } from '../widgets/RecentlyCompletedWidget/RecentlyCompletedWidget';
import { FavoritesWidget } from '../widgets/FavoritesWidget/FavoritesWidget';
import { TopRatedSeriesWidget } from '../widgets/TopRatedSeriesWidget/TopRatedSeriesWidget';
import { MyDisputesWidget } from '../widgets/MyDisputesWidget/MyDisputesWidget';
import { MyCommentsWidget } from '../widgets/MyCommentsWidget/MyCommentsWidget';
import { OverviewAchievements } from '../../overview/sections/Achievements';
import { OverviewCollections } from '../../overview/sections/Collections';
import { OverviewYearSummary } from '../../overview/sections/YearSummary';
import { OverviewReviewsActivity } from '../../overview/sections/ReviewsActivity';
import { OverviewFollowedTitles } from '../../overview/sections/FollowedTitles';
import type { OverviewSectionKey } from '../../overview/useSectionVisibility';
import './ProfileUserLayout.css';

export interface ProfileUserLayoutProps {
  data: ProfileData;
  /** Visibility check por section key. Cuando una cell esta oculta no
   *  se renderea; cuando todas las cells de una row estan ocultas, la
   *  row entera se omite. Default: todo visible. */
  isVisible?: (key: OverviewSectionKey) => boolean;
}

/** Layout fijo del perfil USER — copia literal del mock my-.profile2.png
 *  con las sections del overview integradas para no perder funcionalidad
 *  (Achievements, Collections, YearSummary, ReviewsActivity, FollowedTitles).
 *  Cada cell se puede ocultar/mostrar via CustomizeDrawer. */
export function ProfileUserLayout({
  data,
  isVisible = () => true,
}: ProfileUserLayoutProps) {
  const v = isVisible;

  return (
    <div className="mb-profile-user">
      {/* Row 1: Currently watching shelf full-width (hero del mock). */}
      {v('watching') && (
        <section className="mb-profile-user__row mb-profile-user__row--full">
          <div className="mb-profile-user__cell mb-profile-user__cell--shelf">
            <CurrentlyWatchingWidget items={data.currentlyWatching} />
          </div>
        </section>
      )}

      {/* Row 2: Mis reseñas + Notificaciones + Mis casos. */}
      {(v('reviews') || v('notifications') || v('cases')) && (
        <section className="mb-profile-user__row mb-profile-user__row--social">
          {v('reviews') && (
            <div className="mb-profile-user__cell mb-profile-user__cell--reviews">
              <MyReviewsWidget recentReviews={data.recentReviews} />
            </div>
          )}
          {v('notifications') && (
            <div className="mb-profile-user__cell">
              <DashboardNotificationsWidget />
            </div>
          )}
          {v('cases') && (
            <div className="mb-profile-user__cell">
              <MyCasesWidget />
            </div>
          )}
        </section>
      )}

      {/* Row charts: Heatmap (key mystats) + Donut + CompletedByYear. */}
      {v('mystats') && (
        <section className="mb-profile-user__row mb-profile-user__row--charts">
          <div className="mb-profile-user__cell mb-profile-user__cell--heatmap">
            <HeatmapWidget heatmap={data.stats.heatmap} />
          </div>
          <div className="mb-profile-user__cell">
            <GenresDonutWidget topGenres={data.stats.topGenres} />
          </div>
          <div className="mb-profile-user__cell">
            <CompletedByYearWidget
              completedByYear={data.stats.completedByYear}
            />
          </div>
        </section>
      )}

      {/* Row reviews-activity + year-summary: KPIs del año + total de
       *  reviews — migrados del overview para no perder paridad. */}
      {(v('reviewsActivity') || v('yearSummary')) && (
        <section className="mb-profile-user__row mb-profile-user__row--2up">
          {v('reviewsActivity') && (
            <div className="mb-profile-user__cell">
              <OverviewReviewsActivity stats={data.stats} />
            </div>
          )}
          {v('yearSummary') && (
            <div className="mb-profile-user__cell">
              <OverviewYearSummary stats={data.stats} />
            </div>
          )}
        </section>
      )}

      {/* Row 4-up top lists. Mostramos si countries (que es el toggle mas
       *  cercano a "top lists" en useSectionVisibility) esta activo. */}
      {v('countries') && (
        <section className="mb-profile-user__row mb-profile-user__row--4up">
          <div className="mb-profile-user__cell">
            <TopGenresListWidget topGenres={data.stats.topGenres} />
          </div>
          <div className="mb-profile-user__cell">
            <TopCountriesListWidget topCountries={data.stats.topCountries} />
          </div>
          <div className="mb-profile-user__cell">
            <TopActorsListWidget topActors={data.stats.topActors} />
          </div>
          <div className="mb-profile-user__cell">
            <TopCompaniesListWidget
              topProductionCompanies={data.stats.topProductionCompanies}
            />
          </div>
        </section>
      )}

      {/* Row collections + achievements: features migrados del overview. */}
      {(v('collections') || v('achievements')) && (
        <section className="mb-profile-user__row mb-profile-user__row--2up">
          {v('collections') && (
            <div className="mb-profile-user__cell">
              <OverviewCollections stats={data.stats} />
            </div>
          )}
          {v('achievements') && (
            <div className="mb-profile-user__cell">
              <OverviewAchievements stats={data.stats} />
            </div>
          )}
        </section>
      )}

      {/* Row 5: Recently / Favorites / Top rated / Disputes / Followed. */}
      <section className="mb-profile-user__row mb-profile-user__row--4up">
        <div className="mb-profile-user__cell">
          <RecentlyCompletedWidget items={data.recentlyCompleted} />
        </div>
        <div className="mb-profile-user__cell">
          <FavoritesWidget favorites={data.favorites} />
        </div>
        <div className="mb-profile-user__cell">
          <TopRatedSeriesWidget topRatedSeries={data.stats.topRatedSeries} />
        </div>
        <div className="mb-profile-user__cell">
          <MyDisputesWidget />
        </div>
      </section>

      {/* Row followed titles (strip horizontal de seguidos). */}
      {v('followed') && (
        <section className="mb-profile-user__row mb-profile-user__row--full">
          <div className="mb-profile-user__cell">
            <OverviewFollowedTitles favorites={data.favorites} />
          </div>
        </section>
      )}

      {/* Row 6: My comments full-width. */}
      {v('comments') && (
        <section className="mb-profile-user__row mb-profile-user__row--full">
          <div className="mb-profile-user__cell">
            <MyCommentsWidget />
          </div>
        </section>
      )}
    </div>
  );
}
