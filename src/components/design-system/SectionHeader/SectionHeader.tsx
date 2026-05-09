'use client';

import type { ReactNode } from 'react';
import './SectionHeader.css';

export interface SectionHeaderProps {
  /** Texto principal del encabezado. Lo provee la pagina ya traducido. */
  title: ReactNode;
  /** Opcional: icono a la izquierda del titulo. */
  icon?: ReactNode;
  /** Opcional: subtitulo / descripcion bajo el titulo. */
  subtitle?: ReactNode;
  /** Opcional: cluster de acciones a la derecha (botones, tags, etc.). */
  actions?: ReactNode;
  /** Tamaño del titulo. */
  size?: 'sm' | 'md' | 'lg';
  /** Heading semantico al renderizar. Default: h2. */
  as?: 'h1' | 'h2' | 'h3' | 'h4';
  className?: string;
}

export function SectionHeader({
  title,
  icon,
  subtitle,
  actions,
  size = 'md',
  as: Heading = 'h2',
  className,
}: SectionHeaderProps) {
  const classes = [
    'mb-section-header',
    `mb-section-header--${size}`,
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <header className={classes}>
      <div className="mb-section-header__main">
        {icon && (
          <span className="mb-section-header__icon" aria-hidden="true">
            {icon}
          </span>
        )}
        <div className="mb-section-header__text">
          <Heading className="mb-section-header__title">{title}</Heading>
          {subtitle && (
            <p className="mb-section-header__subtitle">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && <div className="mb-section-header__actions">{actions}</div>}
    </header>
  );
}
