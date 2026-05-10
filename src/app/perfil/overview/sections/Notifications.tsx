'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BellOutlined } from '@ant-design/icons';
import './Notifications.css';

interface Notification {
  id: number;
  type: string;
  title: string;
  body: string | null;
  url: string | null;
  readAt: string | null;
  createdAt: string;
}

/** "Notificaciones recientes" del style-guide. Lee /api/notifications
 *  (data real). Sin chrome de Widget — composicion propia mas compacta. */
export function OverviewNotifications() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/notifications')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { items: Notification[] } | null) => {
        if (cancelled || !data) return;
        setItems((data.items ?? []).slice(0, 4));
      })
      .catch(() => {
        /* silent */
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="overview-notifications">
      <header className="overview-notifications__head">
        <h3 className="overview-notifications__title">
          <BellOutlined /> Notificaciones recientes
        </h3>
        <Link
          href="/notificaciones"
          className="overview-notifications__see-all"
        >
          Ver todas
        </Link>
      </header>

      {loading ? (
        <div className="overview-notifications__empty">Cargando...</div>
      ) : items.length === 0 ? (
        <div className="overview-notifications__empty">
          No tenés notificaciones recientes.
        </div>
      ) : (
        <ul className="overview-notifications__list">
          {items.map((n) => (
            <li key={n.id} className="overview-notifications__item">
              <span
                className={`overview-notifications__dot${n.readAt ? '' : ' overview-notifications__dot--unread'}`}
                aria-hidden
              />
              <div className="overview-notifications__body">
                {n.url ? (
                  <Link
                    href={n.url}
                    className="overview-notifications__title-link"
                  >
                    {n.title}
                  </Link>
                ) : (
                  <span className="overview-notifications__title-text">
                    {n.title}
                  </span>
                )}
                {n.body && (
                  <p className="overview-notifications__desc">{n.body}</p>
                )}
              </div>
              <span className="overview-notifications__time">
                {formatRelative(n.createdAt)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function formatRelative(iso: string): string {
  try {
    const d = new Date(iso);
    const diffMs = Date.now() - d.getTime();
    const diffH = Math.floor(diffMs / 3_600_000);
    if (diffH < 1) return 'Ahora';
    if (diffH < 24) return `Hace ${diffH}h`;
    const diffD = Math.floor(diffH / 24);
    if (diffD < 7) return `Hace ${diffD}d`;
    return `Hace ${Math.floor(diffD / 7)}sem`;
  } catch {
    return '';
  }
}
