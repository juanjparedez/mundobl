'use client';

import Link from 'next/link';
import {
  HeartFilled,
  ClockCircleOutlined,
  EyeInvisibleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import type { ProfileData } from '../../types';
import './Collections.css';

interface Props {
  stats: ProfileData['stats'];
}

/** "Mis listas" — listas derivables del estado de tracking del usuario
 *  (favoritos, retomar, viendo ahora, abandonadas). Listas personalizadas
 *  no existen como feature todavia en la app; cuando se implemente
 *  Collection en Prisma se agrega aqui un boton 'Nueva lista'. */
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

  // El header lo provee el Widget wrapper (CollectionsWidget) — esta
  // section solo rendea el body. Cuando se usa standalone (raro), no
  // tiene titulo, lo cual esta OK porque la unica via de uso es como
  // widget desde 2026-05-11 (iter 11 limpio /perfil/overview/).
  return (
    <section className="overview-collections">
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
    </section>
  );
}
