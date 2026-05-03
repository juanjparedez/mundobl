'use client';

import { useEffect, useState } from 'react';
import { Spin, Table, Tag, Avatar } from 'antd';
import {
  UserOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  MessageOutlined,
  HeartOutlined,
  StarOutlined,
  EyeOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/AppLayout/AppLayout';
import { AdminNav } from '../AdminNav';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { interpolateMessage } from '@/lib/i18n-format';
import '../admin.css';
import './stats.css';

interface SeriesRankItem {
  seriesId: number;
  title: string;
  imageUrl: string | null;
  count: number;
}

interface RatedItem {
  seriesId: number;
  title: string;
  imageUrl: string | null;
  avgScore: number;
  count: number;
}

interface ActiveUser {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: string;
  _count: { viewStatuses: number };
}

interface StatsData {
  summary: {
    totalUsers: number;
    currentlyWatchingDistinct: number;
    completedThisWeek: number;
    commentsThisWeek: number;
  };
  rankings: {
    watching: SeriesRankItem[];
    completed: SeriesRankItem[];
    favorited: SeriesRankItem[];
    commented: SeriesRankItem[];
    rated: RatedItem[];
  };
  activeUsers: ActiveUser[];
}

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'red',
  MODERATOR: 'blue',
  VISITOR: 'default',
};

function SummaryCard({
  icon,
  iconClass,
  value,
  label,
}: {
  icon: React.ReactNode;
  iconClass: string;
  value: number;
  label: string;
}) {
  return (
    <div className="stats-summary-card">
      <div className={`stats-summary-card__icon ${iconClass}`}>{icon}</div>
      <div className="stats-summary-card__body">
        <div className="stats-summary-card__value">
          {value.toLocaleString()}
        </div>
        <div className="stats-summary-card__label">{label}</div>
      </div>
    </div>
  );
}

function RankingCard({
  title,
  icon,
  items,
  badge,
}: {
  title: string;
  icon: React.ReactNode;
  items: SeriesRankItem[];
  badge: (item: SeriesRankItem) => string;
}) {
  const posClass = (i: number) => {
    if (i === 0) return 'stats-ranking-item__pos stats-ranking-item__pos--gold';
    if (i === 1)
      return 'stats-ranking-item__pos stats-ranking-item__pos--silver';
    if (i === 2)
      return 'stats-ranking-item__pos stats-ranking-item__pos--bronze';
    return 'stats-ranking-item__pos';
  };

  return (
    <div className="stats-ranking-card">
      <div className="stats-ranking-card__header">
        <span className="stats-ranking-card__header-icon">{icon}</span>
        {title}
      </div>
      <ul className="stats-ranking-list">
        {items.map((item, i) => (
          <li key={item.seriesId} className="stats-ranking-item">
            <span className={posClass(i)}>{i + 1}</span>
            <span className="stats-ranking-item__title">
              <Link href={`/series/${item.seriesId}`}>{item.title}</Link>
            </span>
            <span className="stats-ranking-item__badge">{badge(item)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RatedRankingCard({
  items,
  title,
}: {
  items: RatedItem[];
  title: string;
}) {
  const posClass = (i: number) => {
    if (i === 0) return 'stats-ranking-item__pos stats-ranking-item__pos--gold';
    if (i === 1)
      return 'stats-ranking-item__pos stats-ranking-item__pos--silver';
    if (i === 2)
      return 'stats-ranking-item__pos stats-ranking-item__pos--bronze';
    return 'stats-ranking-item__pos';
  };

  return (
    <div className="stats-ranking-card">
      <div className="stats-ranking-card__header">
        <span className="stats-ranking-card__header-icon">
          <StarOutlined />
        </span>
        {title}
      </div>
      <ul className="stats-ranking-list">
        {items.map((item, i) => (
          <li key={item.seriesId} className="stats-ranking-item">
            <span className={posClass(i)}>{i + 1}</span>
            <span className="stats-ranking-item__title">
              <Link href={`/series/${item.seriesId}`}>{item.title}</Link>
            </span>
            <span className="stats-ranking-item__badge">
              ⭐ {item.avgScore} ({item.count})
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function StatsClient() {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const { t } = useLocale();

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const userColumns = [
    {
      title: 'Usuario',
      key: 'user',
      render: (_: unknown, u: ActiveUser) => (
        <div className="stats-user-row">
          <Avatar src={u.image} icon={<UserOutlined />} size="small" />
          <span>{u.name ?? u.email}</span>
        </div>
      ),
    },
    {
      title: 'Rol',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <Tag color={ROLE_COLORS[role] ?? 'default'}>{role}</Tag>
      ),
    },
    {
      title: 'Series completadas',
      key: 'completed',
      render: (_: unknown, u: ActiveUser) => u._count.viewStatuses,
    },
  ];
  return (
    <AppLayout>
      <div className="admin-page-wrapper">
        <AdminNav />
        <div className="stats-page">
          {loading ? (
            <div className="stats-loading">
              <Spin size="large" />
            </div>
          ) : data ? (
            <>
              {/* Summary */}
              <div className="stats-summary">
                <SummaryCard
                  icon={<TeamOutlined />}
                  iconClass="stats-summary-card__icon--users"
                  value={data.summary.totalUsers}
                  label={t('adminStats.totalUsers')}
                />
                <SummaryCard
                  icon={<PlayCircleOutlined />}
                  iconClass="stats-summary-card__icon--watching"
                  value={data.summary.currentlyWatchingDistinct}
                  label={t('adminStats.currentlyWatching')}
                />
                <SummaryCard
                  icon={<CheckCircleOutlined />}
                  iconClass="stats-summary-card__icon--completed"
                  value={data.summary.completedThisWeek}
                  label={t('adminStats.completedThisWeek')}
                />
                <SummaryCard
                  icon={<MessageOutlined />}
                  iconClass="stats-summary-card__icon--comments"
                  value={data.summary.commentsThisWeek}
                  label={t('adminStats.commentsThisWeek')}
                />
              </div>

              {/* Rankings */}
              <div className="stats-rankings">
                <RankingCard
                  title={t('adminStats.rankingWatching')}
                  icon={<EyeOutlined />}
                  items={data.rankings.watching}
                  badge={(i) =>
                    interpolateMessage(t('adminStats.badgeWatching'), {
                      n: String(i.count),
                    })
                  }
                />
                <RankingCard
                  title={t('adminStats.rankingCompleted')}
                  icon={<CheckCircleOutlined />}
                  items={data.rankings.completed}
                  badge={(i) =>
                    interpolateMessage(t('adminStats.badgeCompleted'), {
                      n: String(i.count),
                    })
                  }
                />
                <RankingCard
                  title={t('adminStats.rankingFavorited')}
                  icon={<HeartOutlined />}
                  items={data.rankings.favorited}
                  badge={(i) =>
                    interpolateMessage(t('adminStats.badgeFavorited'), {
                      n: String(i.count),
                    })
                  }
                />
                <RankingCard
                  title={t('adminStats.rankingCommented')}
                  icon={<MessageOutlined />}
                  items={data.rankings.commented}
                  badge={(i) =>
                    interpolateMessage(t('adminStats.badgeCommented'), {
                      n: String(i.count),
                    })
                  }
                />
                <RatedRankingCard
                  items={data.rankings.rated}
                  title={t('adminStats.rankingRated')}
                />
              </div>

              {/* Active users */}
              <div className="stats-users-card">
                <div className="stats-users-card__header">
                  <TeamOutlined />
                  {t('adminStats.activeUsers')}
                </div>
                <Table
                  dataSource={data.activeUsers}
                  columns={userColumns}
                  rowKey="id"
                  pagination={false}
                  size="small"
                />
              </div>
            </>
          ) : null}
        </div>
      </div>
    </AppLayout>
  );
}
