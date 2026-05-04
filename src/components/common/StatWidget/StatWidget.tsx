'use client';

import { CloseOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';
import './StatWidget.css';

interface StatWidgetProps {
  id: string;
  title: string;
  icon?: React.ReactNode;
  /** Full-width across the grid */
  fullWidth?: boolean;
  /** Half-width (default) */
  children: React.ReactNode;
  hiddenIds: string[];
  onHide: (id: string) => void;
  /** Optional accent color (CSS color value) */
  accent?: string;
  className?: string;
}

export function StatWidget({
  id,
  title,
  icon,
  fullWidth,
  children,
  hiddenIds: _hiddenIds,
  onHide,
  accent,
  className,
}: StatWidgetProps) {
  return (
    <div
      className={[
        'stat-widget',
        fullWidth ? 'stat-widget--full' : '',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={
        accent
          ? ({ '--widget-accent': accent } as React.CSSProperties)
          : undefined
      }
    >
      <div className="stat-widget__header">
        {icon && <span className="stat-widget__icon">{icon}</span>}
        <span className="stat-widget__title">{title}</span>
        <Tooltip title="Ocultar widget">
          <button
            className="stat-widget__close"
            onClick={() => onHide(id)}
            aria-label={`Ocultar ${title}`}
            type="button"
          >
            <CloseOutlined />
          </button>
        </Tooltip>
      </div>
      <div className="stat-widget__body">{children}</div>
    </div>
  );
}

/** Horizontal bar chart row — reusable inside StatWidget */
export function StatBar({
  label,
  count,
  max,
  href,
}: {
  label: string;
  count: number;
  max: number;
  href?: string;
}) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;

  return (
    <div className="stat-bar">
      <span className="stat-bar__label">
        {href ? (
          <a href={href} className="stat-bar__link">
            {label}
          </a>
        ) : (
          label
        )}
      </span>
      <div className="stat-bar__track">
        <div
          className="stat-bar__fill"
          style={{ '--bar-pct': `${pct}%` } as React.CSSProperties}
        />
      </div>
      <span className="stat-bar__count">{count}</span>
    </div>
  );
}

/** Restore bar — shown when widgets are hidden */
export function StatWidgetRestoreBar({
  hiddenIds,
  onRestore,
  label,
  labels,
}: {
  hiddenIds: string[];
  onRestore: (id: string) => void;
  label: string;
  labels?: Record<string, string>;
}) {
  if (hiddenIds.length === 0) return null;

  return (
    <div className="stat-widget-restore-bar">
      <span className="stat-widget-restore-bar__text">{label}</span>
      <div className="stat-widget-restore-bar__pills">
        {hiddenIds.map((id) => (
          <button
            key={id}
            type="button"
            className="stat-widget-restore-bar__pill"
            onClick={() => onRestore(id)}
          >
            {labels?.[id] ?? id}
          </button>
        ))}
      </div>
    </div>
  );
}
