'use client';

import type { ReactNode } from 'react';
import { Tooltip } from 'antd';
import './IconToggle.css';

export interface IconToggleProps {
  /** Nombre accesible y tooltip, ya traducido. */
  label: string;
  icon: ReactNode;
  /** Con valor, es un toggle: aria-pressed y color de acento cuando esta on. */
  pressed?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

/** Boton redondo de un solo icono (campanita, favorito). */
export function IconToggle({
  label,
  icon,
  pressed,
  disabled = false,
  onClick,
}: IconToggleProps) {
  return (
    <Tooltip title={label}>
      <button
        type="button"
        className={`mb-icon-toggle${pressed ? ' mb-icon-toggle--on' : ''}`}
        aria-label={label}
        aria-pressed={pressed}
        disabled={disabled}
        onClick={onClick}
      >
        {icon}
      </button>
    </Tooltip>
  );
}
