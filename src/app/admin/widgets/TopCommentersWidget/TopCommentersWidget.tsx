'use client';

import { useEffect, useState } from 'react';
import { Spin, Avatar, Tag } from 'antd';
import { TeamOutlined, UserOutlined, MessageOutlined } from '@ant-design/icons';
import { Widget } from '@/components/dashboard';
import { EmptyState } from '@/components/design-system';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { formatPublicName } from '@/lib/user-display';
import './TopCommentersWidget.css';

interface Commenter {
  user: {
    id: string;
    name: string | null;
    nickname: string | null;
    image: string | null;
    role: string;
  };
  count: number;
}

/** Widget "Comunidad destacada" — top 5 commenters publicos de los
 *  ultimos 30 dias. Cubre la columna del mock admin.png que muestra
 *  los users mas activos en la comunidad. Fetch a
 *  /api/admin/top-commenters. */
export function TopCommentersWidget() {
  const { t } = useLocale();
  const [commenters, setCommenters] = useState<Commenter[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/admin/top-commenters')
      .then((res) => (res.ok ? res.json() : null))
      .then((payload: { commenters?: Commenter[] } | null) => {
        if (cancelled) return;
        if (payload?.commenters) setCommenters(payload.commenters);
        setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Widget
      title={t('topCommenters.title')}
      icon={<TeamOutlined />}
      noPadding
      fade={commenters.length > 4}
    >
      {!loaded ? (
        <div className="mb-top-commenters__loading">
          <Spin size="small" />
        </div>
      ) : commenters.length === 0 ? (
        <EmptyState
          title={t('topCommenters.empty')}
          variant="soft"
          fullHeight={false}
        />
      ) : (
        <ol className="mb-top-commenters">
          {commenters.map((c, idx) => (
            <li
              key={c.user.id}
              className="mb-top-commenters__item"
              data-rank={idx + 1 <= 3 ? idx + 1 : undefined}
            >
              <span className="mb-top-commenters__rank">{idx + 1}</span>
              <Avatar
                src={c.user.image}
                icon={!c.user.image ? <UserOutlined /> : undefined}
                size={28}
              />
              <span className="mb-top-commenters__name">
                {formatPublicName(c.user)}
              </span>
              {c.user.role === 'ADMIN' && (
                <Tag color="red">{t('topCommenters.roleAdmin')}</Tag>
              )}
              {c.user.role === 'MODERATOR' && (
                <Tag color="blue">{t('topCommenters.roleModerator')}</Tag>
              )}
              <span className="mb-top-commenters__count">
                <MessageOutlined /> {c.count}
              </span>
            </li>
          ))}
        </ol>
      )}
    </Widget>
  );
}
