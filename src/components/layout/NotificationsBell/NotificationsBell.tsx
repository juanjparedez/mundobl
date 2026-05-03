'use client';

import { startTransition, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge, Tooltip } from 'antd';
import { BellOutlined, BellFilled } from '@ant-design/icons';
import { useSession } from 'next-auth/react';
import { useLocale } from '@/lib/providers/LocaleProvider';
import './NotificationsBell.css';

interface NotificationsBellProps {
  collapsed?: boolean;
}

const POLL_MS = 90_000;

export function NotificationsBell({ collapsed }: NotificationsBellProps) {
  const router = useRouter();
  const { t } = useLocale();
  const { data: session, status } = useSession();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (status !== 'authenticated') {
      startTransition(() => setCount(0));
      return;
    }
    let aborted = false;
    const controller = new AbortController();

    const refresh = () => {
      fetch('/api/notifications/unread-count', { signal: controller.signal })
        .then((res) => (res.ok ? res.json() : { count: 0 }))
        .then((data: { count: number }) => {
          if (!aborted) setCount(data.count ?? 0);
        })
        .catch(() => {});
    };

    refresh();
    const interval = window.setInterval(refresh, POLL_MS);
    return () => {
      aborted = true;
      controller.abort();
      window.clearInterval(interval);
    };
  }, [status, session?.user?.id]);

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
