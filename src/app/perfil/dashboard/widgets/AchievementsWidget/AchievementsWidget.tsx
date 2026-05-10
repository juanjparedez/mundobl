'use client';

import { Widget } from '@/components/dashboard';
import { OverviewAchievements } from '../../../overview/sections/Achievements';
import type { ProfileData } from '../../../types';

export interface AchievementsWidgetProps {
  stats: ProfileData['stats'];
}

/** Widget wrapper de la section "Logros y hitos" del overview. La section
 *  trae su propio header interno (titulo + counter), por eso no pasamos
 *  title al Widget — evitamos duplicacion. noPadding porque la section
 *  maneja su propio spacing. */
export function AchievementsWidget({ stats }: AchievementsWidgetProps) {
  return (
    <Widget noPadding>
      <OverviewAchievements stats={stats} />
    </Widget>
  );
}
