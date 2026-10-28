'use client';

import { useLocale } from '@/lib/providers/LocaleProvider';
import type { AchievementProgress } from '@/lib/achievements';
import { ACHIEVEMENT_ICONS } from '../achievementIcons';
import '../../overview/sections/Achievements.css';
import './AchievementItem.css';

/** Un logro con icono, nombre, meta y barra de progreso (o la fecha en que
 *  se obtuvo). Lo comparten el widget del resumen y el tablero de la
 *  pestaña Logros. */
export function AchievementItem({ item }: { item: AchievementProgress }) {
  const { t, locale } = useLocale();
  const pct = Math.min(100, Math.round((item.current / item.goal) * 100));
  return (
    <li
      className={`overview-achievements__item overview-achievements__item--${item.tone}${item.unlocked ? '' : ' overview-achievements__item--locked'}`}
    >
      <span className="overview-achievements__icon" aria-hidden>
        {ACHIEVEMENT_ICONS[item.icon]}
      </span>
      <div className="overview-achievements__body">
        <div className="overview-achievements__row">
          <span className="overview-achievements__name">
            {t(`achievements.${item.key}Name`)}
          </span>
          <span className="overview-achievements__progress-text">
            {Math.min(item.current, item.goal)} / {item.goal}
          </span>
        </div>
        <span className="overview-achievements__desc">
          {t(`achievements.${item.key}Desc`)}
        </span>
        {item.unlockedAt && (
          <time
            className="overview-achievements__date"
            dateTime={item.unlockedAt}
          >
            {t('achievements.unlockedOn', {
              date: new Date(item.unlockedAt).toLocaleDateString(locale),
            })}
          </time>
        )}
        {!item.unlocked && (
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
}
