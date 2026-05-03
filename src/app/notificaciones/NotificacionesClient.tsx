'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Button, Empty, Spin, Tag } from 'antd';
import { CheckOutlined, DeleteOutlined, BellOutlined } from '@ant-design/icons';
import { useSession, signIn } from 'next-auth/react';
import { PageTitle } from '@/components/common/PageTitle/PageTitle';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { useMessage } from '@/hooks/useMessage';
import './notificaciones.css';

interface NotificationItem {
  id: number;
  type: string;
  title: string;
  body: string | null;
  linkPath: string | null;
  refType: string | null;
  refId: string | null;
  readAt: string | null;
  createdAt: string;
}

export function NotificacionesClient() {
  const { t } = useLocale();
  const { status } = useSession();
  const message = useMessage();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/notifications');
      if (!res.ok) return;
      const data = await res.json();
      setItems(data.items ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated') refresh();
  }, [status, refresh]);

  const markAllRead = async () => {
    setBusy(true);
    try {
      await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      });
      setItems((prev) =>
        prev.map((n) =>
          n.readAt ? n : { ...n, readAt: new Date().toISOString() }
        )
      );
    } finally {
      setBusy(false);
    }
  };

  const deleteAll = async () => {
    setBusy(true);
    try {
      await fetch('/api/notifications', { method: 'DELETE' });
      setItems([]);
      message.success(t('notifications.cleared'));
    } finally {
      setBusy(false);
    }
  };

  const deleteOne = async (id: number) => {
    setItems((prev) => prev.filter((n) => n.id !== id));
    await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
  };

  const markOneRead = async (id: number) => {
    setItems((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, readAt: new Date().toISOString() } : n
      )
    );
    await fetch('/api/notifications/mark-read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [id] }),
    });
  };

  if (status === 'loading') {
    return (
      <div className="notificaciones-page">
        <Spin />
      </div>
    );
  }

  if (status !== 'authenticated') {
    return (
      <div className="notificaciones-page">
        <PageTitle title={t('notifications.title')} />
        <Empty description={t('notifications.loginRequired')}>
          <Button type="primary" onClick={() => signIn('google')}>
            {t('bottomNav.login')}
          </Button>
        </Empty>
      </div>
    );
  }

  const unread = items.filter((n) => !n.readAt).length;

  return (
    <div className="notificaciones-page">
      <PageTitle
        title={t('notifications.title')}
        subtitle={t('notifications.subtitle')}
      />

      <div className="notificaciones-toolbar">
        <span className="notificaciones-toolbar__count">
          {unread > 0
            ? `${unread} ${t('notifications.unread')}`
            : t('notifications.allRead')}
        </span>
        <div className="notificaciones-toolbar__actions">
          <Button
            icon={<CheckOutlined />}
            disabled={unread === 0 || busy}
            onClick={markAllRead}
          >
            {t('notifications.markAllRead')}
          </Button>
          <Button
            danger
            icon={<DeleteOutlined />}
            disabled={items.length === 0 || busy}
            onClick={deleteAll}
          >
            {t('notifications.clearAll')}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="notificaciones-page__loading">
          <Spin />
        </div>
      ) : items.length === 0 ? (
        <Empty
          image={<BellOutlined className="notificaciones-empty-icon" />}
          description={t('notifications.empty')}
        />
      ) : (
        <ul className="notificaciones-list">
          {items.map((n) => {
            const inner = (
              <>
                <div className="notificaciones-item__main">
                  <div className="notificaciones-item__header">
                    <span className="notificaciones-item__title">
                      {n.title}
                    </span>
                    {!n.readAt && (
                      <Tag color="blue">{t('notifications.new')}</Tag>
                    )}
                  </div>
                  {n.body && (
                    <p className="notificaciones-item__body">{n.body}</p>
                  )}
                  <span className="notificaciones-item__when">
                    {new Date(n.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="notificaciones-item__actions">
                  {!n.readAt && (
                    <Button
                      size="small"
                      type="text"
                      icon={<CheckOutlined />}
                      onClick={(e) => {
                        e.preventDefault();
                        markOneRead(n.id);
                      }}
                      aria-label={t('notifications.markRead')}
                    />
                  )}
                  <Button
                    size="small"
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={(e) => {
                      e.preventDefault();
                      deleteOne(n.id);
                    }}
                    aria-label={t('notifications.delete')}
                  />
                </div>
              </>
            );
            const className = `notificaciones-item${
              n.readAt ? '' : ' notificaciones-item--unread'
            }`;
            return (
              <li key={n.id} className={className}>
                {n.linkPath ? (
                  <Link
                    href={n.linkPath}
                    className="notificaciones-item__link"
                    onClick={() => !n.readAt && markOneRead(n.id)}
                  >
                    {inner}
                  </Link>
                ) : (
                  <div className="notificaciones-item__link">{inner}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
