'use client';

import {
  CompassFilled,
  ReadFilled,
  HeartFilled,
  TrophyOutlined,
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
  unlocked: boolean;
  tone: 'gold' | 'purple' | 'red';
}

/** "Logros y hitos" del style-guide. La app no tiene un modelo Achievement
 *  en DB todavia — derivamos hitos basicos de stats reales (vistos,
 *  reseñas, favoritos). Los que no se cumplieron se muestran bloqueados
 *  con la condicion para desbloquear. */
export function OverviewAchievements({ stats }: Props) {
  const achievements: Achievement[] = [
    {
      key: 'explorer',
      icon: <CompassFilled />,
      name: 'Explorador',
      description: 'Ver 50 series diferentes',
      unlocked: stats.watched >= 50,
      tone: 'gold',
    },
    {
      key: 'critic',
      icon: <ReadFilled />,
      name: 'Crítico',
      description: 'Publicar 10 reseñas',
      unlocked: stats.reviews >= 10,
      tone: 'purple',
    },
    {
      key: 'fan',
      icon: <HeartFilled />,
      name: 'Fan de corazón',
      description: 'Agregar 25 títulos a favoritos',
      unlocked: stats.favorites >= 25,
      tone: 'red',
    },
  ];

  return (
    <section className="overview-achievements">
      <header className="overview-achievements__head">
        <h3 className="overview-achievements__title">
          <TrophyOutlined /> Logros y hitos
        </h3>
      </header>
      <ul className="overview-achievements__list">
        {achievements.map((a) => (
          <li
            key={a.key}
            className={`overview-achievements__item overview-achievements__item--${a.tone}${a.unlocked ? '' : ' overview-achievements__item--locked'}`}
          >
            <span className="overview-achievements__icon" aria-hidden>
              {a.icon}
            </span>
            <div className="overview-achievements__body">
              <span className="overview-achievements__name">{a.name}</span>
              <span className="overview-achievements__desc">
                {a.description}
              </span>
            </div>
            <span className="overview-achievements__status">
              {a.unlocked ? 'Desbloqueado' : 'Pendiente'}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
