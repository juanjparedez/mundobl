'use client';

import type { CSSProperties, ReactNode } from 'react';
import './Chip.css';

export type ChipTone =
  | 'neutral'
  | 'accent'
  | 'success'
  | 'warning'
  | 'error'
  | 'info';

export interface ChipProps {
  /** Texto del chip — provisto ya traducido por la pagina. */
  children: ReactNode;
  /** Color semantico. Por defecto 'neutral'. */
  tone?: ChipTone;
  /** 'sm' | 'md'. */
  size?: 'sm' | 'md';
  /** Icono opcional a la izquierda. */
  icon?: ReactNode;
  /** Icono/boton opcional a la derecha (ej. close x). */
  trailing?: ReactNode;
  /** Outline en lugar de fill. */
  outline?: boolean;
  /** Hace el chip clickeable como filtro. */
  onClick?: () => void;
  /** aria-pressed para chips toggle. */
  pressed?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function Chip({
  children,
  tone = 'neutral',
  size = 'md',
  icon,
  trailing,
  outline = false,
  onClick,
  pressed,
  className,
  style,
}: ChipProps) {
  const classes = [
    'mb-chip',
    `mb-chip--${tone}`,
    `mb-chip--${size}`,
    outline ? 'mb-chip--outline' : '',
    onClick ? 'mb-chip--interactive' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  if (onClick) {
    return (
      <button
        type="button"
        className={classes}
        style={style}
        onClick={onClick}
        aria-pressed={pressed}
      >
        {icon && (
          <span className="mb-chip__icon" aria-hidden="true">
            {icon}
          </span>
        )}
        <span className="mb-chip__label">{children}</span>
        {trailing && <span className="mb-chip__trailing">{trailing}</span>}
      </button>
    );
  }

  return (
    <span className={classes} style={style}>
      {icon && (
        <span className="mb-chip__icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <span className="mb-chip__label">{children}</span>
      {trailing && <span className="mb-chip__trailing">{trailing}</span>}
    </span>
  );
}
