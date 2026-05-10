'use client';

import { Widget } from '@/components/dashboard';
import { OverviewCollections } from '../../../overview/sections/Collections';
import type { ProfileData } from '../../../types';

export interface CollectionsWidgetProps {
  stats: ProfileData['stats'];
}

/** Widget wrapper de la section "Mis listas" del overview (favoritos,
 *  rewatch, watching, abandoned como cards linkables). */
export function CollectionsWidget({ stats }: CollectionsWidgetProps) {
  return (
    <Widget noPadding>
      <OverviewCollections stats={stats} />
    </Widget>
  );
}
