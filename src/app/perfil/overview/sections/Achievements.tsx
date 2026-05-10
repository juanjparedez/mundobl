'use client';

import { useState } from 'react';
import {
  CompassFilled,
  ReadFilled,
  HeartFilled,
  TrophyOutlined,
  StarFilled,
  CommentOutlined,
  FireFilled,
  ClockCircleFilled,
  ThunderboltFilled,
  CrownFilled,
  CheckCircleFilled,
} from '@ant-design/icons';
import type { ProfileData } from '../../types';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { interpolateMessage } from '@/lib/i18n-format';
import './Achievements.css';

interface Props {
  stats: ProfileData['stats'];
}

interface Achievement {
  key: string;
  icon: React.ReactNode;
  name: string;
  description: string;
  /** Progreso actual hacia la meta (current / goal). */
  current: number;
  goal: number;
  tone: 'gold' | 'purple' | 'red' | 'blue' | 'green';
}

/** "Logros y hitos". Logros derivados de stats reales — sin modelo
 *  Achievement en DB todavia. Cada logro tiene meta clara, current/goal,
 *  y se separan visualmente entre obtenidos y pendientes. Cuando exista
 *  modelo Achievement en backend se reemplaza esta lista por la real. */
export function OverviewAchievements({ stats }: Props) {
  const { t } = useLocale();
  const [showAll, setShowAll] = useState(false);

  const achievements: Achievement[] = [
    {
      key: 'first-step',
      icon: <CheckCircleFilled />,
      name: t('achievements.firstStepName'),
      description: t('achievements.firstStepDesc'),
      current: stats.watched,
      goal: 1,
      tone: 'green',
    },
    {
      key: 'starter',
      icon: <CompassFilled />,
      name: t('achievements.starterName'),
      description: t('achievements.starterDesc'),
      current: stats.watched,
      goal: 10,
      tone: 'green',
    },
    {
      key: 'explorer',
      icon: <CompassFilled />,
      name: t('achievements.explorerName'),
      description: t('achievements.explorerDesc'),
      current: stats.watched,
      goal: 50,
      tone: 'gold',
    },
    {
      key: 'completionist',
      icon: <CrownFilled />,
      name: t('achievements.completionistName'),
      description: t('achievements.completionistDesc'),
      current: stats.watched,
      goal: 100,
      tone: 'gold',
    },
    {
      key: 'first-review',
      icon: <ReadFilled />,
      name: t('achievements.firstReviewName'),
      description: t('achievements.firstReviewDesc'),
      current: stats.reviews,
      goal: 1,
      tone: 'green',
    },
    {
      key: 'critic',
      icon: <ReadFilled />,
      name: t('achievements.criticName'),
      description: t('achievements.criticDesc'),
      current: stats.reviews,
      goal: 10,
      tone: 'purple',
    },
    {
      key: 'voice',
      icon: <CommentOutlined />,
      name: t('achievements.voiceName'),
      description: t('achievements.voiceDesc'),
      current: stats.comments,
      goal: 50,
      tone: 'blue',
    },
    {
      key: 'rater',
      icon: <StarFilled />,
      name: t('achievements.raterName'),
      description: t('achievements.raterDesc'),
      current: stats.ratings,
      goal: 25,
      tone: 'gold',
    },
    {
      key: 'fan',
      icon: <HeartFilled />,
      name: t('achievements.fanName'),
      description: t('achievements.fanDesc'),
      current: stats.favorites,
      goal: 25,
      tone: 'red',
    },
    {
      key: 'binger',
      icon: <ClockCircleFilled />,
      name: t('achievements.bingerName'),
      description: t('achievements.bingerDesc'),
      current: Math.floor(stats.hoursWatched),
      goal: 100,
      tone: 'purple',
    },
    {
      key: 'streak-7',
      icon: <FireFilled />,
      name: t('achievements.streak7Name'),
      description: t('achievements.streak7Desc'),
      current: stats.longestStreak,
      goal: 7,
      tone: 'red',
    },
    {
      key: 'streak-30',
      icon: <ThunderboltFilled />,
      name: t('achievements.streak30Name'),
      description: t('achievements.streak30Desc'),
      current: stats.longestStreak,
      goal: 30,
      tone: 'gold',
    },
  ];

  const unlocked = achievements.filter((a) => a.current >= a.goal);
  const pending = achievements.filter((a) => a.current < a.goal);
  const visible = showAll
    ? achievements
    : [...unlocked, ...pending].slice(0, 4);

  return (
    <section className="overview-achievements">
      <header className="overview-achievements__head">
        <h3 className="overview-achievements__title">
          <TrophyOutlined /> {t('profile.sectionAchievements')}
        </h3>
        <span className="overview-achievements__count">
          {unlocked.length} / {achievements.length}
        </span>
      </header>

      <ul className="overview-achievements__list">
        {visible.map((a) => {
          const isUnlocked = a.current >= a.goal;
          const pct = Math.min(100, Math.round((a.current / a.goal) * 100));
          return (
            <li
              key={a.key}
              className={`overview-achievements__item overview-achievements__item--${a.tone}${isUnlocked ? '' : ' overview-achievements__item--locked'}`}
            >
              <span className="overview-achievements__icon" aria-hidden>
                {a.icon}
              </span>
              <div className="overview-achievements__body">
                <div className="overview-achievements__row">
                  <span className="overview-achievements__name">{a.name}</span>
                  <span className="overview-achievements__progress-text">
                    {Math.min(a.current, a.goal)} / {a.goal}
                  </span>
                </div>
                <span className="overview-achievements__desc">
                  {a.description}
                </span>
                {!isUnlocked && (
                  <div className="overview-achievements__bar-track">
                    <div
                      className="overview-achievements__bar-fill"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {achievements.length > 4 && (
        <button
          type="button"
          className="overview-achievements__toggle"
          onClick={() => setShowAll((v) => !v)}
        >
          {showAll
            ? t('profile.overviewViewLess')
            : interpolateMessage(t('profile.overviewViewAllCount'), {
                count: String(achievements.length),
              })}
        </button>
      )}
    </section>
  );
}
