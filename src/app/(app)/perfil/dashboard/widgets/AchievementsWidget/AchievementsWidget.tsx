'use client';

import { TrophyOutlined } from '@ant-design/icons';
import { Widget } from '@/components/dashboard';
import { useLocale } from '@/lib/providers/LocaleProvider';
import {
  OverviewAchievements,
  countUnlockedAchievements,
  ACHIEVEMENTS_TOTAL,
} from '../../../overview/sections/Achievements';
import type { ProfileData } from '../../../types';

export interface AchievementsWidgetProps {
  stats: ProfileData['stats'];
}

/** Widget "Logros y hitos". Title + counter unlocked/total los rendea
 *  el Widget canonico. La section solo aporta el body (lista + toggle). */
export function AchievementsWidget({ stats }: AchievementsWidgetProps) {
  const { t } = useLocale();
  const unlocked = countUnlockedAchievements(stats);
  return (
    <Widget
      title={t('profile.sectionAchievements')}
      icon={<TrophyOutlined />}
      noPadding
      actions={
        <span className="overview-achievements__count">
          {unlocked} / {ACHIEVEMENTS_TOTAL}
        </span>
      }
    >
      <OverviewAchievements stats={stats} />
    </Widget>
  );
}
