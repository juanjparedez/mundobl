'use client';

import type { ReactNode } from 'react';
import { CloseOutlined } from '@ant-design/icons';
import { useDismissedNotice } from '@/hooks/useDismissedNotice';
import './DismissibleNotice.css';

export interface DismissibleNoticeProps {
  /** Mismo id en varias paginas = mismo aviso (cerrarlo en una lo cierra en todas). */
  id: string;
  title?: ReactNode;
  children: ReactNode;
  icon?: ReactNode;
  /** Boton o link opcional al pie. */
  action?: ReactNode;
  /** aria-label del boton de cerrar, ya traducido. */
  closeLabel: string;
  className?: string;
}

/** Aviso que se ve hasta que se cierra, una vez por navegador. */
export function DismissibleNotice({
  id,
  title,
  children,
  icon,
  action,
  closeLabel,
  className,
}: DismissibleNoticeProps) {
  const { dismissed, dismiss } = useDismissedNotice(id);
  if (dismissed) return null;

  return (
    <aside className={`mb-notice ${className ?? ''}`}>
      {icon && (
        <span className="mb-notice__icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <div className="mb-notice__body">
        {title && <strong className="mb-notice__title">{title}</strong>}
        <div className="mb-notice__text">{children}</div>
        {action && <div className="mb-notice__action">{action}</div>}
      </div>
      <button
        type="button"
        className="mb-notice__close"
        onClick={dismiss}
        aria-label={closeLabel}
      >
        <CloseOutlined />
      </button>
    </aside>
  );
}
