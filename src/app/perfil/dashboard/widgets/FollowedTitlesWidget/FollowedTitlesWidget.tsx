'use client';

import { Widget } from '@/components/dashboard';
import { OverviewFollowedTitles } from '../../../overview/sections/FollowedTitles';
import type { ProfileData } from '../../../types';

export interface FollowedTitlesWidgetProps {
  favorites: ProfileData['favorites'];
}

/** Widget wrapper de la section "Títulos seguidos" del overview. Strip
 *  horizontal de posters chicos con bell icon (suscripciones). */
export function FollowedTitlesWidget({ favorites }: FollowedTitlesWidgetProps) {
  return (
    <Widget noPadding>
      <OverviewFollowedTitles favorites={favorites} />
    </Widget>
  );
}
