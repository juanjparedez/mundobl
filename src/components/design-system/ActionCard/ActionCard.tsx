'use client';

import type { CSSProperties, ReactNode } from 'react';
import './ActionCard.css';

export interface ActionCardProps {
  /** Icono principal. */
  icon: ReactNode;
  /** Titulo (provisto traducido). */
  title: ReactNode;
  /** Descripcion corta opcional. */
  description?: ReactNode;
  /** Click handler. Para enlaces, envolver el ActionCard en <Link>. */
  onClick?: () => void;
  /** Color de la burbuja del icono. Default: --primary-color. */
  accent?: string;
  /** Indicador de cuenta/badge a la derecha. */
  badge?: ReactNode;
  /** Visualmente destacado (border accent). */
  featured?: boolean;
  className?: string;
  style?: CSSProperties;
  /** aria-label si la card es interactiva y el title no es suficiente. */
  'aria-label'?: string;
}

export function ActionCard({
  icon,
  title,
  description,
  onClick,
  accent,
  badge,
  featured = false,
  className,
  style,
  'aria-label': ariaLabel,
}: ActionCardProps) {
  const classes = [
    'mb-action-card',
    featured ? 'mb-action-card--featured' : '',
    onClick ? 'mb-action-card--interactive' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  const finalStyle: CSSProperties = {
    ...style,
    ...(accent ? ({ '--mb-action-accent': accent } as CSSProperties) : {}),
  };

  const Component = onClick ? 'button' : 'div';
  return (
    <Component
      type={onClick ? 'button' : undefined}
      className={classes}
      style={finalStyle}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      <span className="mb-action-card__icon" aria-hidden="true">
        {icon}
      </span>
      <span className="mb-action-card__body">
        <span className="mb-action-card__title">{title}</span>
        {description && (
          <span className="mb-action-card__description">{description}</span>
        )}
      </span>
      {badge && <span className="mb-action-card__badge">{badge}</span>}
    </Component>
  );
}
