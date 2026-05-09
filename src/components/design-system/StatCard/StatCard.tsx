'use client';

import type { CSSProperties, ReactNode } from 'react';
import './StatCard.css';

export interface StatCardProps {
  /** Label superior (provisto traducido). */
  label: ReactNode;
  /** Valor principal grande. */
  value: ReactNode;
  /** Texto secundario debajo del valor (delta, descripcion). */
  hint?: ReactNode;
  /** Indicador de tendencia/cambio. */
  delta?: {
    value: ReactNode;
    direction: 'up' | 'down' | 'neutral';
  };
  /** Icono decorativo (a la derecha, en burbuja accent). */
  icon?: ReactNode;
  /** Color de la burbuja del icono — por defecto usa --primary-color. */
  accent?: string;
  /** Slot adicional (sparkline, micro-chart, etc.). */
  children?: ReactNode;
  /** Hace la card clickable. */
  onClick?: () => void;
  className?: string;
  style?: CSSProperties;
}

export function StatCard({
  label,
  value,
  hint,
  delta,
  icon,
  accent,
  children,
  onClick,
  className,
  style,
}: StatCardProps) {
  const classes = [
    'mb-stat-card',
    onClick ? 'mb-stat-card--interactive' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  const finalStyle: CSSProperties = {
    ...style,
    ...(accent ? ({ '--mb-stat-accent': accent } as CSSProperties) : {}),
  };

  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      type={onClick ? 'button' : undefined}
      className={classes}
      style={finalStyle}
      onClick={onClick}
    >
      <div className="mb-stat-card__top">
        <span className="mb-stat-card__label">{label}</span>
        {icon && (
          <span className="mb-stat-card__icon" aria-hidden="true">
            {icon}
          </span>
        )}
      </div>
      <div className="mb-stat-card__value">{value}</div>
      {(hint || delta) && (
        <div className="mb-stat-card__hint">
          {delta && (
            <span
              className={`mb-stat-card__delta mb-stat-card__delta--${delta.direction}`}
            >
              {delta.value}
            </span>
          )}
          {hint && <span className="mb-stat-card__hint-text">{hint}</span>}
        </div>
      )}
      {children && <div className="mb-stat-card__extra">{children}</div>}
    </Component>
  );
}
