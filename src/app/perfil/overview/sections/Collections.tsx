'use client';

import Link from 'next/link';
import {
  HeartFilled,
  ClockCircleOutlined,
  EyeInvisibleOutlined,
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import type { ProfileData } from '../../types';
import './Collections.css';

interface Props {
  stats: ProfileData['stats'];
}

/** "Mis listas y colecciones" del style-guide. La app todavia no tiene
 *  un modelo Collection en DB; mostramos las "listas" derivables del
 *  estado de tracking (favorites, retomar, ver despues) con contadores
 *  reales y un aviso de que las listas custom estan en desarrollo. */
export function OverviewCollections({ stats }: Props) {
  const items = [
    {
      key: 'favorites',
      icon: <HeartFilled />,
      label: 'Favoritos',
      count: stats.favorites,
      href: '/perfil/clasico#favorites',
      tone: 'red',
    },
    {
      key: 'rewatch',
      icon: <ReloadOutlined />,
      label: 'Para volver a ver',
      count: stats.toRewatch,
      href: '/perfil/clasico#rewatch',
      tone: 'gold',
    },
    {
      key: 'watching',
      icon: <ClockCircleOutlined />,
      label: 'Viendo ahora',
      count: stats.watching,
      href: '/watching',
      tone: 'blue',
    },
    {
      key: 'abandoned',
      icon: <EyeInvisibleOutlined />,
      label: 'Abandonadas',
      count: stats.abandoned,
      href: '/perfil/clasico#abandoned',
      tone: 'gray',
    },
  ];

  return (
    <section className="overview-collections">
      <header className="overview-collections__head">
        <h3 className="overview-collections__title">Mis listas</h3>
      </header>
      <ul className="overview-collections__list">
        {items.map((it) => (
          <li key={it.key}>
            <Link
              href={it.href}
              className={`overview-collections__item overview-collections__item--${it.tone}`}
            >
              <span className="overview-collections__icon" aria-hidden>
                {it.icon}
              </span>
              <span className="overview-collections__label">{it.label}</span>
              <span className="overview-collections__count">{it.count}</span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="overview-collections__custom" aria-disabled>
        <PlusOutlined />
        <span>Listas personalizadas — próximamente</span>
      </div>
    </section>
  );
}
