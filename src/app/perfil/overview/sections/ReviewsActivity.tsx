'use client';

import type { ProfileData } from '../../types';
import './ReviewsActivity.css';

interface Props {
  stats: ProfileData['stats'];
}

/** "Actividad de reseñas" — body only. Header lo provee el Widget wrapper. */
export function OverviewReviewsActivity({ stats }: Props) {
  return (
    <section className="overview-reviews-activity">
      <div className="overview-reviews-activity__big">{stats.reviews}</div>
      <div className="overview-reviews-activity__sub">Reseñas publicadas</div>
    </section>
  );
}
