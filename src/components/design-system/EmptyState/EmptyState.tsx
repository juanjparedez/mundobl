'use client';

import type { ReactNode } from 'react';
import './EmptyState.css';

export interface EmptyStateProps {
  /** Icono o ilustracion. La pagina decide cual mostrar (ya traducido si tiene texto). */
  icon?: ReactNode;
  /** Titulo principal. Provisto traducido por la pagina. */
  title: ReactNode;
  /** Mensaje de soporte. Provisto traducido por la pagina. */
  description?: ReactNode;
  /** Slot para CTA(s). */
  action?: ReactNode;
  /** Si true, ocupa toda la columna y centra vertical. Default: true. */
  fullHeight?: boolean;
  /** Variante visual. */
  variant?: 'default' | 'soft';
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  fullHeight = true,
  variant = 'default',
  className,
}: EmptyStateProps) {
  const classes = [
    'mb-empty-state',
    `mb-empty-state--${variant}`,
    fullHeight ? 'mb-empty-state--full' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} role="status">
      {icon && (
        <span className="mb-empty-state__icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <h3 className="mb-empty-state__title">{title}</h3>
      {description && (
        <p className="mb-empty-state__description">{description}</p>
      )}
      {action && <div className="mb-empty-state__action">{action}</div>}
    </div>
  );
}
