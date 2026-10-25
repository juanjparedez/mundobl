'use client';

import { useState } from 'react';
import { Progress, Segmented } from 'antd';
import { TrophyOutlined } from '@ant-design/icons';
import {
  PanelCard,
  SectionHeader,
  EmptyState,
} from '@/components/design-system';
import { useLocale } from '@/lib/providers/LocaleProvider';
import type { TranslationKey } from '@/i18n/messages';
import {
  ACHIEVEMENT_CATEGORIES,
  summarizeAchievements,
  type AchievementCategory,
  type AchievementProgress,
} from '@/lib/achievements';
import type { PatchTier } from '@/lib/platform-patches';
import type { ProfileData } from '../../types';
import { AchievementItem } from '../AchievementItem/AchievementItem';
import { PlatformPatch } from '../PlatformPatch/PlatformPatch';
import './AchievementsBoard.css';

type Filter = 'all' | 'unlocked' | 'pending';

const CATEGORY_LABELS: Record<AchievementCategory, TranslationKey> = {
  watching: 'achievements.categoryWatching',
  habits: 'achievements.categoryHabits',
  opinions: 'achievements.categoryOpinions',
  community: 'achievements.categoryCommunity',
  sharing: 'achievements.categorySharing',
  contributions: 'achievements.categoryContributions',
};

const TIER_LABELS: Record<PatchTier, TranslationKey> = {
  bronze: 'achievements.patchBronze',
  silver: 'achievements.patchSilver',
  gold: 'achievements.patchGold',
};

export interface AchievementsBoardProps {
  stats: ProfileData['stats'];
}

/** Pestaña Logros: resumen, parches de plataforma y todos los logros por
 *  categoria, con filtro obtenidos/pendientes. */
export function AchievementsBoard({ stats }: AchievementsBoardProps) {
  const { t } = useLocale();
  const [filter, setFilter] = useState<Filter>('all');
  const { items, patches, unlocked, total } = summarizeAchievements(stats);

  const matches = (item: AchievementProgress) =>
    filter === 'all' || (filter === 'unlocked') === item.unlocked;
  const groups = ACHIEVEMENT_CATEGORIES.map((category) => ({
    category,
    items: items.filter((i) => i.category === category && matches(i)),
  })).filter((group) => group.items.length > 0);

  return (
    <div className="mb-achievements-board">
      <PanelCard
        header={
          <SectionHeader
            icon={<TrophyOutlined />}
            title={t('profileTabs.achievements')}
            subtitle={t('achievements.boardHint')}
          />
        }
      >
        <div className="mb-achievements-board__summary">
          <Progress
            percent={Math.round((unlocked / total) * 100)}
            showInfo={false}
            strokeColor="var(--primary-color)"
          />
          <span className="mb-achievements-board__summary-text">
            {t('achievements.boardSummary', { unlocked, total })}
          </span>
        </div>
      </PanelCard>

      <PanelCard
        header={
          <SectionHeader
            title={t('achievements.patchesTitle')}
            subtitle={t('achievements.patchesHint')}
            size="sm"
          />
        }
      >
        <ul className="mb-achievements-board__patches">
          {patches.map((patch) => (
            <PlatformPatch
              key={patch.key}
              patchKey={patch.key}
              platform={patch.platform}
              initials={patch.initials}
              tier={patch.tier}
              tierLabel={t(
                patch.tier ? TIER_LABELS[patch.tier] : 'achievements.patchNone'
              )}
              progressLabel={t('achievements.patchCompleted', {
                count: patch.completed,
              })}
              nextLabel={
                patch.nextGoal === null
                  ? t('achievements.patchMax')
                  : t('achievements.patchNext', { goal: patch.nextGoal })
              }
            />
          ))}
        </ul>
      </PanelCard>

      <Segmented
        className="mb-achievements-board__filter"
        value={filter}
        onChange={(value) => setFilter(value as Filter)}
        options={[
          { value: 'all', label: t('achievements.filterAll') },
          { value: 'unlocked', label: t('achievements.filterUnlocked') },
          { value: 'pending', label: t('achievements.filterPending') },
        ]}
      />

      {groups.length === 0 ? (
        <EmptyState title={t('achievements.emptyFilter')} />
      ) : (
        groups.map((group) => (
          <section
            key={group.category}
            className="mb-achievements-board__group"
            aria-labelledby={`achievements-${group.category}`}
          >
            <h3
              id={`achievements-${group.category}`}
              className="mb-achievements-board__group-title"
            >
              {t(CATEGORY_LABELS[group.category])}
            </h3>
            <ul className="mb-achievements-board__grid">
              {group.items.map((item) => (
                <AchievementItem key={item.key} item={item} />
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
