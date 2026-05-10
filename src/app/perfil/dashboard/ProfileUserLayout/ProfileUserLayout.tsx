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
import './ProfileUserLayout.css';

export interface ProfileUserLayoutProps {
  data: ProfileData;
}

/** Layout fijo del perfil USER — copia literal del mock my-.profile2.png.
 *  Composicion hardcoded, no grid reordenable. */
export function ProfileUserLayout({ data }: ProfileUserLayoutProps) {
  return (
    <div className="mb-profile-user">
      {/* Row 1: Currently watching shelf full-width (hero del mock) */}
      <section className="mb-profile-user__row mb-profile-user__row--full">
        <div className="mb-profile-user__cell mb-profile-user__cell--shelf">
          <CurrentlyWatchingWidget items={data.currentlyWatching} />
        </div>
      </section>

      {/* Row 2: Mis reseñas + Notificaciones + Mis casos */}
      <section className="mb-profile-user__row mb-profile-user__row--social">
        <div className="mb-profile-user__cell mb-profile-user__cell--reviews">
          <MyReviewsWidget recentReviews={data.recentReviews} />
        </div>
        <div className="mb-profile-user__cell">
          <DashboardNotificationsWidget />
        </div>
        <div className="mb-profile-user__cell">
          <MyCasesWidget />
        </div>
      </section>

      {/* Row 3: Heatmap wide + Donut + CompletedByYear (charts row del mock) */}
      <section className="mb-profile-user__row mb-profile-user__row--charts">
        <div className="mb-profile-user__cell mb-profile-user__cell--heatmap">
          <HeatmapWidget heatmap={data.stats.heatmap} />
        </div>
        <div className="mb-profile-user__cell">
          <GenresDonutWidget topGenres={data.stats.topGenres} />
        </div>
        <div className="mb-profile-user__cell">
          <CompletedByYearWidget completedByYear={data.stats.completedByYear} />
        </div>
      </section>

      {/* Row 4: 4 top lists alineadas */}
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

      {/* Row 5: Recently / Favorites / Top rated / Disputes */}
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

      {/* Row 6: My comments full-width */}
      <section className="mb-profile-user__row mb-profile-user__row--full">
        <div className="mb-profile-user__cell">
          <MyCommentsWidget />
        </div>
      </section>
    </div>
  );
}
