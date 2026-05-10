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
  const [showAll, setShowAll] = useState(false);

  const achievements: Achievement[] = [
    {
      key: 'first-step',
      icon: <CheckCircleFilled />,
      name: 'Primer paso',
      description: 'Marcá tu primera serie como vista',
      current: stats.watched,
      goal: 1,
      tone: 'green',
    },
    {
      key: 'starter',
      icon: <CompassFilled />,
      name: 'Iniciante',
      description: 'Ver 10 series diferentes',
      current: stats.watched,
      goal: 10,
      tone: 'green',
    },
    {
      key: 'explorer',
      icon: <CompassFilled />,
      name: 'Explorador',
      description: 'Ver 50 series diferentes',
      current: stats.watched,
      goal: 50,
      tone: 'gold',
    },
    {
      key: 'completionist',
      icon: <CrownFilled />,
      name: 'Coleccionista',
      description: 'Ver 100 series diferentes',
      current: stats.watched,
      goal: 100,
      tone: 'gold',
    },
    {
      key: 'first-review',
      icon: <ReadFilled />,
      name: 'Primera reseña',
      description: 'Publicar tu primera reseña',
      current: stats.reviews,
      goal: 1,
      tone: 'green',
    },
    {
      key: 'critic',
      icon: <ReadFilled />,
      name: 'Crítico',
      description: 'Publicar 10 reseñas',
      current: stats.reviews,
      goal: 10,
      tone: 'purple',
    },
    {
      key: 'voice',
      icon: <CommentOutlined />,
      name: 'Comunidad',
      description: 'Publicar 50 comentarios',
      current: stats.comments,
      goal: 50,
      tone: 'blue',
    },
    {
      key: 'rater',
      icon: <StarFilled />,
      name: 'Puntuador',
      description: 'Valorar 25 series',
      current: stats.ratings,
      goal: 25,
      tone: 'gold',
    },
    {
      key: 'fan',
      icon: <HeartFilled />,
      name: 'Fan de corazón',
      description: 'Agregar 25 títulos a favoritos',
      current: stats.favorites,
      goal: 25,
      tone: 'red',
    },
    {
      key: 'binger',
      icon: <ClockCircleFilled />,
      name: 'Maratoneador',
      description: 'Acumular 100 horas vistas',
      current: Math.floor(stats.hoursWatched),
      goal: 100,
      tone: 'purple',
    },
    {
      key: 'streak-7',
      icon: <FireFilled />,
      name: 'Racha semanal',
      description: 'Lograr una racha de 7 días',
      current: stats.longestStreak,
      goal: 7,
      tone: 'red',
    },
    {
      key: 'streak-30',
      icon: <ThunderboltFilled />,
      name: 'Mes constante',
      description: 'Lograr una racha de 30 días',
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
          <TrophyOutlined /> Logros y hitos
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
          {showAll ? 'Ver menos' : `Ver todos (${achievements.length})`}
        </button>
      )}
    </section>
  );
}
