'use client';

import { CheckOutlined, LoadingOutlined } from '@ant-design/icons';
import './WatchedToggle.css';

interface WatchedToggleProps {
  /** Lo que se ve: el numero del capitulo. */
  label: string;
  /** Nombre accesible, igual este marcado o no ("Vi el capitulo 3"). */
  ariaLabel: string;
  /** Tooltip; puede cambiar con el estado ("Desmarcar el capitulo 3"). */
  hint: string;
  watched: boolean;
  loading?: boolean;
  disabled?: boolean;
  onToggle: () => void;
}

export function WatchedToggle({
  label,
  ariaLabel,
  hint,
  watched,
  loading = false,
  disabled = false,
  onToggle,
}: WatchedToggleProps) {
  return (
    <button
      type="button"
      className={`watched-toggle${watched ? ' watched-toggle--on' : ''}`}
      aria-pressed={watched}
      aria-label={ariaLabel}
      title={hint}
      disabled={disabled || loading}
      onClick={onToggle}
    >
      <span className="watched-toggle__icon" aria-hidden>
        {loading ? <LoadingOutlined /> : <CheckOutlined />}
      </span>
      <span className="watched-toggle__label">{label}</span>
    </button>
  );
}
