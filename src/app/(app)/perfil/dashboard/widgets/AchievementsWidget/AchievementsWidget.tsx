'use client';

import { TrophyOutlined } from '@ant-design/icons';
import { Widget } from '@/components/dashboard';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { summarizeAchievements } from '@/lib/achievements';
import { OverviewAchievements } from '../../../overview/sections/Achievements';
import type { ProfileData } from '../../../types';

export interface AchievementsWidgetProps {
  stats: ProfileData['stats'];
  boardHref?: string;
}

/** Widget "Logros y hitos". Title + counter unlocked/total los rendea
 *  el Widget canonico. La section solo aporta el body (lista + toggle). */
export function AchievementsWidget({
  stats,
  boardHref,
}: AchievementsWidgetProps) {
  const { t } = useLocale();
  const { unlocked, total } = summarizeAchievements(stats);
  return (
    <Widget
      title={t('profile.sectionAchievements')}
      icon={<TrophyOutlined />}
      noPadding
      actions={
        <span className="overview-achievements__count">
          {unlocked} / {total}
        </span>
      }
    >
      <OverviewAchievements stats={stats} boardHref={boardHref} />
    </Widget>
  );
}
