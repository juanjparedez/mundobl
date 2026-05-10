'use client';

import { Widget } from '@/components/dashboard';
import { OverviewReviewsActivity } from '../../../overview/sections/ReviewsActivity';
import type { ProfileData } from '../../../types';

export interface ReviewsActivityWidgetProps {
  stats: ProfileData['stats'];
}

/** Widget wrapper de la section "Actividad de reseñas" del overview.
 *  Total de reseñas publicadas en formato big number. */
export function ReviewsActivityWidget({ stats }: ReviewsActivityWidgetProps) {
  return (
    <Widget noPadding>
      <OverviewReviewsActivity stats={stats} />
    </Widget>
  );
}
