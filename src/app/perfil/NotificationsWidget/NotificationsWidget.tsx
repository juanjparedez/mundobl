'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Button, Empty, Spin, Tag } from 'antd';
import {
  BellOutlined,
  PlayCircleOutlined,
  ReadOutlined,
  CommentOutlined,
  AppstoreOutlined,
  ExperimentOutlined,
  ArrowRightOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import './NotificationsWidget.css';
import { useLocale } from '@/lib/providers/LocaleProvider';

interface Notification {
  id: number;
  type: string;
  title: string;
  body: string | null;
  linkPath: string | null;
  readAt: string | null;
  createdAt: string;
}

const PREVIEW_COUNT = 5;

export function NotificationsWidget() {
  const { t } = useLocale();
  const [items, setItems] = useState<Notification[] | null>(null);
  const [unreadTotal, setUnreadTotal] = useState(0);

  const TYPE_META: Record<
    string,
    { icon: React.ReactNode; tone: string; label: string }
  > = {
    season_added: {
      icon: <PlayCircleOutlined />,
      tone: 'blue',
      label: t('notificationsWidget.seasonAddedLabel'),
    },
    content_added: {
      icon: <AppstoreOutlined />,
      tone: 'cyan',
      label: t('notificationsWidget.contentAddedLabel'),
    },
    review_published: {
      icon: <ReadOutlined />,
      tone: 'gold',
      label: t('notificationsWidget.reviewPublishedLabel'),
    },
    comment_thread: {
      icon: <CommentOutlined />,
      tone: 'purple',
      label: t('notificationsWidget.commentThreadLabel'),
    },
    test: {
      icon: <ExperimentOutlined />,
      tone: 'default',
      label: t('notificationsWidget.testLabel'),
    },
  };

  const metaFor = useCallback((type: string) => {
    return (
      TYPE_META[type] ?? {
        icon: <BellOutlined />,
        tone: 'default',
        label: t('notificationsWidget.defaultNotificationLabel'),
      }
    );
  }, [TYPE_META, t]);

  const timeAgo = useCallback((value: string): string => {
    const ms = Date.now() - new Date(value).getTime();
    const min = Math.round(ms / 60_000);
    if (min < 1) return t('notificationsWidget.timeAgoRecent');
    if (min < 60) return t('notificationsWidget.timeAgoMinutes', { min });
    const h = Math.round(min / 60);
    if (h < 24) return t('notificationsWidget.timeAgoHours', { h });
    const days = Math.round(h / 24);
    return t('notificationsWidget.timeAgoDays', { days });
  }, [t]);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications');
      if (!res.ok) {
        setItems([]);
        return;
      }
      const data: { items: Notification[]; unreadCount: number } =
        await res.json();
      setItems(data.items.slice(0, PREVIEW_COUNT));
      setUnreadTotal(data.unreadCount ?? 0);
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    // setState ocurre en microtask tras el fetch — el rule no lo detecta
    // pero no es cascada sincronica.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);

  const markAllRead = async () => {
    setItems((prev) =>
      prev
        ? prev.map((n) =>
            n.readAt ? n : { ...n, readAt: new Date().toISOString() }
          )
        : prev
    );
    setUnreadTotal(0);
    await fetch('/api/notifications/mark-read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true }),
    }).catch(() => undefined);
  };

  if (items === null) {
    return (
      <div className="nw__loading">
        <Spin />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <Empty
        image={<BellOutlined className="nw__empty-icon" />}
        description={t('notificationsWidget.emptyDescription')}
      >
        <Link href="/notificaciones" className="nw__empty-link">
          {t('notificationsWidget.emptyLink')} <ArrowRightOutlined />
        </Link>
      </Empty>
    );
  }

  return (
    <div className="nw">
      <div className="nw__header">
        <span className="nw__count">
          {unreadTotal > 0 ? t('notificationsWidget.unreadCount', { unreadTotal }) : t('notificationsWidget.allCaughtUp')}
        </span>
        <div className="nw__header-actions">
          {unreadTotal > 0 && (
            <Button
              size="small"
              type="text"
              icon={<CheckOutlined />}
              onClick={markAllRead}
            >
              {t('notificationsWidget.markAllReadButton')}
            </Button>
          )}
          <Link href="/notificaciones" className="nw__see-all">
            {t('notificationsWidget.seeAllLink')} <ArrowRightOutlined />
          </Link>
        </div>
      </div>

      <ul className="nw__list">
        {items.map((n) => {
          const meta = metaFor(n.type);
          const inner = (
            <>
              <span
                className={`nw__icon nw__icon--${meta.tone}`}
                aria-hidden="true"
              >
                {meta.icon}
              </span>
              <div className="nw__main">
                <div className="nw__title-row">
                  <span className="nw__title">{n.title}</span>
                  <Tag className="nw__type-tag" color={meta.tone}>
                    {meta.label}
                  </Tag>
                  {!n.readAt && <span className="nw__dot" />}
                </div>
                {n.body && <p className="nw__body">{n.body}</p>}
                <span className="nw__when">{timeAgo(n.createdAt)}</span>
              </div>
            </>
          );
          const className = `nw__item${n.readAt ? '' : ' nw__item--unread'}`;
          return (
            <li key={n.id} className={className}>
              {n.linkPath ? (
                <Link
                  href={n.linkPath}
                  className="nw__item-link"
                  prefetch={false}
                >
                  {inner}
                </Link>
              ) : (
                <div className="nw__item-link">{inner}</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}