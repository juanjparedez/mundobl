'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Spin, Tag, Avatar } from 'antd';
import {
  TeamOutlined,
  UserOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ExportOutlined,
} from '@ant-design/icons';
import { Widget } from '@/components/dashboard';
import { AutoFitList, EmptyState } from '@/components/design-system';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { formatPublicName } from '@/lib/user-display';
import { interpolateMessage } from '@/lib/i18n-format';
import './RecentAdminActivityWidget.css';

interface ActivityEvent {
  id: number;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  path: string;
  method: string | null;
  createdAt: string;
  user: {
    name: string | null;
    nickname: string | null;
    image: string | null;
    role: string;
  } | null;
}

/** Widget de actividad reciente del equipo admin/moderator — eventos
 *  CREATE/UPDATE/DELETE sobre /admin/* del AccessLog. Cubre la columna
 *  "Actividad del equipo" del mock catalogo.png y del mock admin.png.
 *  Fetch a /api/admin/recent-activity. */
export function RecentAdminActivityWidget() {
  const { t, locale } = useLocale();
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/admin/recent-activity')
      .then((res) => (res.ok ? res.json() : null))
      .then((payload: { events?: ActivityEvent[] } | null) => {
        if (cancelled) return;
        if (payload?.events) setEvents(payload.events);
        setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const actionConfig: Record<
    string,
    { icon: React.ReactNode; color: string; label: string }
  > = {
    CREATE: {
      icon: <PlusOutlined />,
      color: 'green',
      label: t('adminActivity.actionCreate'),
    },
    UPDATE: {
      icon: <EditOutlined />,
      color: 'blue',
      label: t('adminActivity.actionUpdate'),
    },
    DELETE: {
      icon: <DeleteOutlined />,
      color: 'red',
      label: t('adminActivity.actionDelete'),
    },
  };

  return (
    <Widget title={t('adminActivity.title')} icon={<TeamOutlined />} noPadding>
      {!loaded ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            padding: 'var(--spacing-md)',
          }}
        >
          <Spin size="small" />
        </div>
      ) : events.length === 0 ? (
        <EmptyState
          title={t('adminActivity.empty')}
          variant="soft"
          fullHeight={false}
        />
      ) : (
        <AutoFitList
          as="ul"
          listClassName="mb-recent-activity"
          viewLessLabel={t('profile.overviewViewLess')}
          viewMoreLabel={(count) =>
            interpolateMessage(t('profile.overviewViewAllCount'), {
              count: String(count),
            })
          }
        >
          {events.map((e) => {
            const cfg = actionConfig[e.action] ?? actionConfig.UPDATE;
            const author = e.user
              ? formatPublicName(e.user)
              : t('adminActivity.anonymous');
            const date = new Date(e.createdAt).toLocaleDateString(locale);
            const pathShort = e.path.replace('/admin/', '/');
            // Referencia externa real: lleva al registro completo
            // filtrado por esta ruta + accion, en vez de dejar el path
            // como texto suelto sin adonde ir (el tooltip del Tag no
            // alcanza para ver el detalle real del evento).
            const logsHref = `/admin/logs?path=${encodeURIComponent(e.path)}&action=${e.action}`;
            return (
              <li key={e.id} className="mb-recent-activity__item">
                <Avatar
                  src={e.user?.image}
                  icon={!e.user?.image ? <UserOutlined /> : undefined}
                  size={24}
                />
                <div className="mb-recent-activity__body">
                  <div className="mb-recent-activity__row">
                    <span className="mb-recent-activity__author">{author}</span>
                    <Tag color={cfg.color} icon={cfg.icon}>
                      {cfg.label}
                    </Tag>
                  </div>
                  <div className="mb-recent-activity__row">
                    <Link
                      href={logsHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mb-recent-activity__link"
                      title={t('adminActivity.viewInLogs')}
                    >
                      <code>{pathShort}</code>
                      <ExportOutlined />
                    </Link>
                    <span className="mb-recent-activity__date">{date}</span>
                  </div>
                </div>
              </li>
            );
          })}
        </AutoFitList>
      )}
    </Widget>
  );
}
