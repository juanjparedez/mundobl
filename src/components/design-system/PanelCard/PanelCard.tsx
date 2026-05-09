'use client';

import { forwardRef, type CSSProperties, type ReactNode } from 'react';
import './PanelCard.css';

export interface PanelCardProps {
  /** Slot opcional arriba del contenido (suele ir SectionHeader). */
  header?: ReactNode;
  /** Slot opcional abajo del contenido. */
  footer?: ReactNode;
  /** 'default' (panel base) | 'soft' (transparente con borde) | 'flat' (sin sombra). */
  variant?: 'default' | 'soft' | 'flat';
  /** 'md' | 'lg' (mas padding). */
  padding?: 'sm' | 'md' | 'lg' | 'none';
  /** Sin bordes — para tarjetas internas dentro de otra PanelCard. */
  borderless?: boolean;
  /** Hover lift + cursor pointer. */
  interactive?: boolean;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
  onClick?: () => void;
  role?: string;
  'aria-label'?: string;
}

export const PanelCard = forwardRef<HTMLDivElement, PanelCardProps>(
  function PanelCard(
    {
      header,
      footer,
      variant = 'default',
      padding = 'md',
      borderless = false,
      interactive = false,
      className,
      style,
      children,
      onClick,
      role,
      'aria-label': ariaLabel,
    },
    ref
  ) {
    const classes = [
      'mb-panel-card',
      `mb-panel-card--${variant}`,
      `mb-panel-card--pad-${padding}`,
      borderless ? 'mb-panel-card--borderless' : '',
      interactive ? 'mb-panel-card--interactive' : '',
      className ?? '',
    ]
      .filter(Boolean)
      .join(' ');

    const Component = onClick || interactive ? 'button' : 'div';
    return (
      <Component
        ref={ref as never}
        type={Component === 'button' ? 'button' : undefined}
        className={classes}
        style={style}
        onClick={onClick}
        role={role}
        aria-label={ariaLabel}
      >
        {header && <div className="mb-panel-card__header">{header}</div>}
        <div className="mb-panel-card__body">{children}</div>
        {footer && <div className="mb-panel-card__footer">{footer}</div>}
      </Component>
    );
  }
);
