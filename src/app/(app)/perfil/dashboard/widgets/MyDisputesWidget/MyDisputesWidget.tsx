'use client';

import { useEffect, useState } from 'react';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { Spin, Tag } from 'antd';
import { useSession } from 'next-auth/react';
import { Widget } from '@/components/dashboard';
import { EmptyState } from '@/components/design-system';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { interpolateMessage } from '@/lib/i18n-format';
import './MyDisputesWidget.css';

interface UserDispute {
  id: number;
  title: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  commentId: number | null;
  message: string;
  reportCount: number;
  isPrivate: boolean;
  commentPreview: string;
  target: string;
}

interface UserDisputesResponse {
  disputes: UserDispute[];
}

/** Lista de disputas que el usuario abrió contra reportes en sus
 *  propios comentarios. Carga sus datos directamente desde
 *  `/api/user/comment-disputes` (desacoplado del payload de profile). */
export function MyDisputesWidget() {
  const { t, locale } = useLocale();
  const { status } = useSession();
  const [disputes, setDisputes] = useState<UserDispute[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status !== 'authenticated') return;
    let cancelled = false;
    fetch('/api/user/comment-disputes?limit=50')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: UserDisputesResponse | null) => {
        if (cancelled || !data) return;
        setDisputes(data.disputes);
      })
      .catch(() => {
        /* silencio: el render usa estado vacio */
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [status]);

  if (loading) {
    return (
      <Widget
        title={t('profileDashboard.widgetMyDisputes')}
        icon={<ExclamationCircleOutlined />}
      >
        <div className="mb-my-disputes__loading">
          <Spin size="small" />
        </div>
      </Widget>
    );
  }

  if (disputes.length === 0) {
    return (
      <Widget
        title={t('profileDashboard.widgetMyDisputes')}
        icon={<ExclamationCircleOutlined />}
      >
        <EmptyState
          title={t('profile.disputesEmpty')}
          variant="soft"
          fullHeight={false}
        />
      </Widget>
    );
  }

  return (
    <Widget
      title={t('profileDashboard.widgetMyDisputes')}
      icon={<ExclamationCircleOutlined />}
      noPadding
      fade={disputes.length > 4}
    >
      <ul className="mb-my-disputes">
        {disputes.map((d) => (
          <li key={d.id} className="mb-my-disputes__item">
            <div className="mb-my-disputes__head">
              <span className="mb-my-disputes__title">{d.title}</span>
              <Tag>{d.status}</Tag>
            </div>
            <div className="mb-my-disputes__meta">
              <span>
                {interpolateMessage(t('profile.disputeForComment'), {
                  n: String(d.commentId ?? 0),
                })}
              </span>
              <span>·</span>
              <span>{new Date(d.createdAt).toLocaleDateString(locale)}</span>
              {d.target && (
                <>
                  <span>·</span>
                  <span className="mb-my-disputes__target">{d.target}</span>
                </>
              )}
            </div>
            {d.message && (
              <p className="mb-my-disputes__message">{d.message}</p>
            )}
          </li>
        ))}
      </ul>
    </Widget>
  );
}
