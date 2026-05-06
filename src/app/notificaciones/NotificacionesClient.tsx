'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Button, Empty, Segmented, Spin, Tag, Tooltip } from 'antd';
import {
  CheckOutlined,
  DeleteOutlined,
  BellOutlined,
  ReloadOutlined,
  PlayCircleOutlined,
  ReadOutlined,
  CommentOutlined,
  AppstoreOutlined,
  ExperimentOutlined,
} from '@ant-design/icons';
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

type FilterMode = 'all' | 'unread';

const TYPE_META: Record<
  string,
  { icon: React.ReactNode; tone: string; label: string }
> = {
  season_added: {
    icon: <PlayCircleOutlined />,
    tone: 'blue',
    label: 'Nueva temporada',
  },
  content_added: {
    icon: <AppstoreOutlined />,
    tone: 'cyan',
    label: 'Nuevo contenido',
  },
  review_published: {
    icon: <ReadOutlined />,
    tone: 'gold',
    label: 'Reseña',
  },
  comment_thread: {
    icon: <CommentOutlined />,
    tone: 'purple',
    label: 'Comentario',
  },
  test: {
    icon: <ExperimentOutlined />,
    tone: 'default',
    label: 'Prueba',
  },
};

function metaFor(type: string) {
  return (
    TYPE_META[type] ?? {
      icon: <BellOutlined />,
      tone: 'default',
      label: 'Aviso',
    }
  );
}

interface DateBucket {
  label: string;
  items: NotificationItem[];
}

function bucketByDate(items: NotificationItem[]): DateBucket[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const buckets: Record<string, NotificationItem[]> = {
    Hoy: [],
    Ayer: [],
    'Esta semana': [],
    Antes: [],
  };
  for (const n of items) {
    const d = new Date(n.createdAt);
    if (d >= today) buckets['Hoy'].push(n);
    else if (d >= yesterday) buckets['Ayer'].push(n);
    else if (d >= weekAgo) buckets['Esta semana'].push(n);
    else buckets['Antes'].push(n);
  }
  return Object.entries(buckets)
    .filter(([, arr]) => arr.length > 0)
    .map(([label, arr]) => ({ label, items: arr }));
}

function timeAgo(value: string): string {
  const ms = Date.now() - new Date(value).getTime();
  const min = Math.round(ms / 60_000);
  if (min < 1) return 'recien';
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  const days = Math.round(h / 24);
  if (days < 7) return `hace ${days} d`;
  const weeks = Math.round(days / 7);
  if (weeks < 5) return `hace ${weeks} sem`;
  return new Date(value).toLocaleDateString();
}

const POLL_MS = 30_000;

export function NotificacionesClient() {
  const { t } = useLocale();
  const { status } = useSession();
  const message = useMessage();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState<FilterMode>('all');

  const refresh = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch('/api/notifications');
      if (!res.ok) return;
      const data = await res.json();
      setItems(data.items ?? []);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // Polling + visibility refresh, mismo patron que la campana.
  useEffect(() => {
    if (status !== 'authenticated') return;
    let interval: number | null = null;
    const startPoll = () => {
      if (interval !== null) return;
      interval = window.setInterval(() => refresh(true), POLL_MS);
    };
    const stopPoll = () => {
      if (interval !== null) {
        window.clearInterval(interval);
        interval = null;
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        refresh(true);
        startPoll();
      } else {
        stopPoll();
      }
    };
    refresh(false);
    if (document.visibilityState === 'visible') startPoll();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stopPoll();
      document.removeEventListener('visibilitychange', onVisibility);
    };
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
    await fetch(`/api/notifications/${id}`, { method: 'PATCH' });
  };

  const filtered = useMemo(
    () => (filter === 'unread' ? items.filter((n) => !n.readAt) : items),
    [items, filter]
  );
  const buckets = useMemo(() => bucketByDate(filtered), [filtered]);
  const unreadCount = useMemo(
    () => items.filter((n) => !n.readAt).length,
    [items]
  );

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

  return (
    <div className="notificaciones-page">
      <PageTitle
        title={t('notifications.title')}
        subtitle={t('notifications.subtitle')}
      />

      <div className="notificaciones-toolbar">
        <Segmented
          value={filter}
          onChange={(v) => setFilter(v as FilterMode)}
          options={[
            { value: 'all', label: `Todas (${items.length})` },
            { value: 'unread', label: `Sin leer (${unreadCount})` },
          ]}
        />
        <div className="notificaciones-toolbar__actions">
          <Tooltip title="Refrescar">
            <Button
              icon={<ReloadOutlined spin={loading} />}
              onClick={() => refresh(false)}
              aria-label="Refrescar"
            />
          </Tooltip>
          <Button
            icon={<CheckOutlined />}
            disabled={unreadCount === 0 || busy}
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

      {loading && items.length === 0 ? (
        <div className="notificaciones-page__loading">
          <Spin />
        </div>
      ) : filtered.length === 0 ? (
        <Empty
          image={<BellOutlined className="notificaciones-empty-icon" />}
          description={
            filter === 'unread'
              ? 'No tenes notificaciones sin leer'
              : t('notifications.empty')
          }
        />
      ) : (
        <div className="notificaciones-buckets">
          {buckets.map((bucket) => (
            <section key={bucket.label} className="notificaciones-bucket">
              <h3 className="notificaciones-bucket__title">{bucket.label}</h3>
              <ul className="notificaciones-list">
                {bucket.items.map((n) => {
                  const meta = metaFor(n.type);
                  const inner = (
                    <>
                      <span
                        className={`notificaciones-item__icon notificaciones-item__icon--${meta.tone}`}
                        aria-hidden="true"
                      >
                        {meta.icon}
                      </span>
                      <div className="notificaciones-item__main">
                        <div className="notificaciones-item__header">
                          <span className="notificaciones-item__title">
                            {n.title}
                          </span>
                          <Tag
                            className="notificaciones-item__type-tag"
                            color={meta.tone}
                          >
                            {meta.label}
                          </Tag>
                          {!n.readAt && (
                            <span className="notificaciones-item__dot" />
                          )}
                        </div>
                        {n.body && (
                          <p className="notificaciones-item__body">{n.body}</p>
                        )}
                        <span className="notificaciones-item__when">
                          {timeAgo(n.createdAt)}
                        </span>
                      </div>
                      <div className="notificaciones-item__actions">
                        {!n.readAt && (
                          <Tooltip title={t('notifications.markRead')}>
                            <Button
                              size="small"
                              type="text"
                              icon={<CheckOutlined />}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                markOneRead(n.id);
                              }}
                              aria-label={t('notifications.markRead')}
                            />
                          </Tooltip>
                        )}
                        <Tooltip title={t('notifications.delete')}>
                          <Button
                            size="small"
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              deleteOne(n.id);
                            }}
                            aria-label={t('notifications.delete')}
                          />
                        </Tooltip>
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
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
