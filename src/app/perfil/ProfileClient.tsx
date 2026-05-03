'use client';

import { useEffect, useState } from 'react';
import { Avatar, Tag, Spin, Empty, Progress } from 'antd';
import {
  UserOutlined,
  CalendarOutlined,
  EyeOutlined,
  PlayCircleOutlined,
  HeartOutlined,
  StarOutlined,
  MessageOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { AppLayout } from '@/components/layout/AppLayout/AppLayout';
import { useLocale } from '@/lib/providers/LocaleProvider';
import './profile.css';

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'red',
  MODERATOR: 'blue',
  VISITOR: 'default',
};

interface SeriesMini {
  id: number;
  title: string;
  imageUrl: string | null;
  year: number | null;
  country: { name: string } | null;
}

interface ProfileData {
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    role: string;
    createdAt: string;
  };
  stats: {
    watched: number;
    watching: number;
    abandoned: number;
    toRewatch: number;
    favorites: number;
    ratings: number;
    comments: number;
  };
  recentlyCompleted: Array<{ seriesId: number; series: SeriesMini | null }>;
  currentlyWatching: Array<{
    seriesId: number;
    series: SeriesMini | null;
    progress: { totalEpisodes: number; watchedEpisodes: number };
    nextEpisode: { seasonNumber: number; episodeNumber: number } | null;
  }>;
  favorites: Array<{ seriesId: number; series: SeriesMini | null }>;
}

function SeriesCard({ series, nextEpisode, progress }: {
  series: SeriesMini;
  nextEpisode?: { seasonNumber: number; episodeNumber: number } | null;
  progress?: { totalEpisodes: number; watchedEpisodes: number };
}) {
  return (
    <Link href={`/series/${series.id}`} className="profile-series-card">
      <div className="profile-series-card__cover">
        {series.imageUrl ? (
          <Image
            src={series.imageUrl}
            alt={series.title}
            fill
            sizes="160px"
            className="profile-series-card__image"
          />
        ) : (
          <div className="profile-series-card__cover--placeholder">
            <AppstoreOutlined />
          </div>
        )}
      </div>
      <div className="profile-series-card__body">
        <span className="profile-series-card__title">{series.title}</span>
        <span className="profile-series-card__meta">
          {series.year ?? '—'} · {series.country?.name ?? '—'}
        </span>
        {progress && progress.totalEpisodes > 0 && (
          <Progress
            percent={Math.round((progress.watchedEpisodes / progress.totalEpisodes) * 100)}
            size="small"
            showInfo={false}
            className="profile-series-card__progress"
          />
        )}
        {nextEpisode && (
          <span className="profile-series-card__next">
            ▶ T{nextEpisode.seasonNumber}E{nextEpisode.episodeNumber}
          </span>
        )}
      </div>
    </Link>
  );
}

export function ProfileClient() {
  const { data: session, status } = useSession();
  const { t } = useLocale();
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') { setLoading(false); return; }
    if (status !== 'authenticated') return;
    fetch('/api/user/profile')
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [status]);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

  if (loading) {
    return (
      <AppLayout>
        <div className="profile-loading"><Spin size="large" /></div>
      </AppLayout>
    );
  }

  if (!session?.user || !data) {
    return (
      <AppLayout>
        <div className="profile-page">
          <Empty description={t('profile.loginRequired')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
        </div>
      </AppLayout>
    );
  }

  const { user, stats } = data;

  const statItems = [
    { icon: <CheckCircleOutlined />, value: stats.watched,   label: t('profile.statWatched') },
    { icon: <PlayCircleOutlined />, value: stats.watching,  label: t('profile.statWatching') },
    { icon: <CloseCircleOutlined />, value: stats.abandoned, label: t('profile.statAbandoned') },
    { icon: <ReloadOutlined />,      value: stats.toRewatch, label: t('profile.statToRewatch') },
    { icon: <HeartOutlined />,       value: stats.favorites, label: t('profile.statFavorites') },
    { icon: <StarOutlined />,        value: stats.ratings,   label: t('profile.statRatings') },
    { icon: <MessageOutlined />,     value: stats.comments,  label: t('profile.statComments') },
  ];

  return (
    <AppLayout>
      <div className="profile-page">
        {/* Header */}
        <div className="profile-header">
          <Avatar
            src={user.image}
            icon={!user.image ? <UserOutlined /> : undefined}
            size={96}
          />
          <div className="profile-header__info">
            <h1 className="profile-header__name">{user.name ?? user.email}</h1>
            <p className="profile-header__email">{user.email}</p>
            <div className="profile-header__meta">
              <Tag color={ROLE_COLORS[user.role] ?? 'default'}>{user.role}</Tag>
              <span className="profile-header__member-since">
                <CalendarOutlined />
                {t('profile.memberSince')} {formatDate(user.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="profile-stats">
          {statItems.map((s, i) => (
            <div key={i} className="profile-stat">
              <div className="profile-stat__icon">{s.icon}</div>
              <div className="profile-stat__value">{s.value}</div>
              <div className="profile-stat__label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Currently Watching */}
        {data.currentlyWatching.length > 0 && (
          <section className="profile-section">
            <div className="profile-section__header">
              <EyeOutlined className="profile-section__header-icon" />
              {t('profile.sectionWatching')}
            </div>
            <div className="profile-series-grid">
              {data.currentlyWatching.map((item) =>
                item.series ? (
                  <SeriesCard
                    key={item.seriesId}
                    series={item.series}
                    nextEpisode={item.nextEpisode}
                    progress={item.progress}
                  />
                ) : null
              )}
            </div>
          </section>
        )}

        {/* Recently Completed */}
        {data.recentlyCompleted.length > 0 && (
          <section className="profile-section">
            <div className="profile-section__header">
              <CheckCircleOutlined className="profile-section__header-icon" />
              {t('profile.sectionRecent')}
            </div>
            <div className="profile-series-grid">
              {data.recentlyCompleted.map((item) =>
                item.series ? (
                  <SeriesCard key={item.seriesId} series={item.series} />
                ) : null
              )}
            </div>
          </section>
        )}

        {/* Favorites */}
        {data.favorites.length > 0 && (
          <section className="profile-section">
            <div className="profile-section__header">
              <HeartOutlined className="profile-section__header-icon" />
              {t('profile.sectionFavorites')}
            </div>
            <div className="profile-series-grid">
              {data.favorites.map((item) =>
                item.series ? (
                  <SeriesCard key={item.seriesId} series={item.series} />
                ) : null
              )}
            </div>
          </section>
        )}
      </div>
    </AppLayout>
  );
}
