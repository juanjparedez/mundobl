'use client';

import { useRouter } from 'next/navigation';
import { Badge, Tooltip } from 'antd';
import { BellOutlined, BellFilled } from '@ant-design/icons';
import { useSession } from 'next-auth/react';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';
import './NotificationsBell.css';

interface NotificationsBellProps {
  collapsed?: boolean;
}

export function NotificationsBell({ collapsed }: NotificationsBellProps) {
  const router = useRouter();
  const { t } = useLocale();
  const { status } = useSession();
  const count = useUnreadNotifications();

  if (status !== 'authenticated') return null;

  return (
    <Tooltip title={t('notifications.openTitle')} placement="right">
      <button
        type="button"
        className="notifications-bell"
        onClick={() => router.push('/notificaciones')}
        aria-label={t('notifications.openTitle')}
      >
        <Badge count={count} size="small" overflowCount={99}>
          <span className="notifications-bell__icon" aria-hidden="true">
            {count > 0 ? <BellFilled /> : <BellOutlined />}
          </span>
        </Badge>
        {!collapsed && (
          <span className="notifications-bell__label">
            {t('notifications.label')}
          </span>
        )}
      </button>
    </Tooltip>
  );
}
