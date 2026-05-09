'use client';

import { useRouter } from 'next/navigation';
import { Badge, Tooltip } from 'antd';
import { BellOutlined, BellFilled } from '@ant-design/icons';
import { useSession } from 'next-auth/react';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';
import './NotificationsBell.css';

interface NotificationsBellProps {
  /** 'sidebar' (default): boton ancho con icono + label.
   *  'topbar': solo icono, layout compacto para el TopBar. */
  variant?: 'sidebar' | 'topbar';
  /** Solo aplica a variant='sidebar': oculta la label cuando el sidebar
   *  esta colapsado. */
  collapsed?: boolean;
}

export function NotificationsBell({
  variant = 'sidebar',
  collapsed,
}: NotificationsBellProps) {
  const router = useRouter();
  const { t } = useLocale();
  const { status } = useSession();
  const count = useUnreadNotifications();

  if (status !== 'authenticated') return null;

  const isTopbar = variant === 'topbar';
  const showLabel = !isTopbar && !collapsed;

  return (
    <Tooltip
      title={t('notifications.openTitle')}
      placement={isTopbar ? 'bottom' : 'right'}
    >
      <button
        type="button"
        className={`notifications-bell notifications-bell--${variant}`}
        onClick={() => router.push('/notificaciones')}
        aria-label={t('notifications.openTitle')}
      >
        <Badge count={count} size="small" overflowCount={99}>
          <span className="notifications-bell__icon" aria-hidden="true">
            {count > 0 ? <BellFilled /> : <BellOutlined />}
          </span>
        </Badge>
        {showLabel && (
          <span className="notifications-bell__label">
            {t('notifications.label')}
          </span>
        )}
      </button>
    </Tooltip>
  );
}
