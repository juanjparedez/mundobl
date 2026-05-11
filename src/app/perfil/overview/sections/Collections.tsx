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

interface CollectionItem {
  key: string;
  icon: React.ReactNode;
  label: string;
  count: number;
  /** Solo si existe una ruta dedicada con la lista completa. Sin href
   *  el item renderea como display-only (no clickable). */
  href?: string;
  tone: string;
}

/** "Mis listas" — listas derivables del estado de tracking del usuario
 *  (favoritos, retomar, viendo ahora, abandonadas). Listas personalizadas
 *  no existen como feature todavia en la app; cuando se implemente
 *  Collection en Prisma se agrega aqui un boton 'Nueva lista'.
 *  Solo "Viendo ahora" tiene ruta dedicada (/watching). Los otros 3
 *  esperan rutas /favoritos, /retomar, /abandonadas — pendientes
 *  como feature request. Mientras tanto se renderean como counters
 *  display-only. */
export function OverviewCollections({ stats }: Props) {
  const items: CollectionItem[] = [
    {
      key: 'favorites',
      icon: <HeartFilled />,
      label: 'Favoritos',
      count: stats.favorites,
      tone: 'red',
    },
    {
      key: 'rewatch',
      icon: <ReloadOutlined />,
      label: 'Para volver a ver',
      count: stats.toRewatch,
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
      tone: 'gray',
    },
  ];

  return (
    <section className="overview-collections">
      <ul className="overview-collections__list">
        {items.map((it) => {
          const className = `overview-collections__item overview-collections__item--${it.tone}${it.href ? '' : ' overview-collections__item--static'}`;
          const content = (
            <>
              <span className="overview-collections__icon" aria-hidden>
                {it.icon}
              </span>
              <span className="overview-collections__label">{it.label}</span>
              <span className="overview-collections__count">{it.count}</span>
            </>
          );
          return (
            <li key={it.key}>
              {it.href ? (
                <Link href={it.href} className={className}>
                  {content}
                </Link>
              ) : (
                <div className={className}>{content}</div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
