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
  CommentOutlined,
  DownloadOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { AppLayout } from '@/components/layout/AppLayout/AppLayout';
import { useMessage } from '@/hooks/useMessage';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { interpolateMessage } from '@/lib/i18n-format';
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

interface UserComment {
  id: number;
  content: string;
  isPrivate: boolean;
  reportCount: number;
  createdAt: string;
  series: { id: number; title: string } | null;
  season: { id: number; seasonNumber: number; series: { id: number; title: string } | null } | null;
  episode: {
    id: number;
    episodeNumber: number;
    season: { seasonNumber: number; series: { id: number; title: string } | null } | null;
  } | null;
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
  const message = useMessage();
  const { data: session, status } = useSession();
  const { t } = useLocale();
  const [data, setData] = useState<ProfileData | null>(null);
  const [comments, setComments] = useState<UserComment[]>([]);
  const [selectedCommentIds, setSelectedCommentIds] = useState<number[]>([]);
  const [isDeletingComments, setIsDeletingComments] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      setLoading(false);
      return;
    }
    if (status !== 'authenticated') return;

    Promise.all([fetch('/api/user/profile'), fetch('/api/user/comments?limit=120')])
      .then(async ([profileRes, commentsRes]) => {
        if (!profileRes.ok) {
          throw new Error('No se pudo cargar el perfil');
        }

        const profileData = (await profileRes.json()) as ProfileData;
        setData(profileData);

        if (commentsRes.ok) {
          const commentsData = (await commentsRes.json()) as { comments: UserComment[] };
          setComments(commentsData.comments);
        } else {
          setComments([]);
        }
      })
      .catch((error) => {
        console.error(error);
        setData(null);
      })
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
  const allCommentsSelected =
    comments.length > 0 && selectedCommentIds.length === comments.length;

  const resolveCommentTarget = (comment: UserComment) => {
    if (comment.episode?.season?.series?.title && comment.episode.season.seasonNumber) {
      return `${comment.episode.season.series.title} · T${comment.episode.season.seasonNumber}E${comment.episode.episodeNumber}`;
    }

    if (comment.season?.series?.title) {
      return `${comment.season.series.title} · T${comment.season.seasonNumber}`;
    }

    if (comment.series?.title) {
      return comment.series.title;
    }

    return t('profile.commentsTargetUnknown');
  };

  const toggleSelectAllComments = () => {
    if (allCommentsSelected) {
      setSelectedCommentIds([]);
      return;
    }
    setSelectedCommentIds(comments.map((comment) => comment.id));
  };

  const toggleCommentSelection = (commentId: number, checked: boolean) => {
    setSelectedCommentIds((prev) => {
      if (checked) {
        return prev.includes(commentId) ? prev : [...prev, commentId];
      }
      return prev.filter((id) => id !== commentId);
    });
  };

  const handleDeleteSelectedComments = async () => {
    if (selectedCommentIds.length === 0) return;

    setIsDeletingComments(true);
    try {
      const response = await fetch('/api/user/comments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedCommentIds }),
      });

      if (!response.ok) {
        throw new Error(t('profile.commentsDeleteError'));
      }

      const result = (await response.json()) as { deleted: number };
      const deletedCount = Math.max(result.deleted ?? 0, 0);

      setComments((prev) =>
        prev.filter((comment) => !selectedCommentIds.includes(comment.id))
      );
      setSelectedCommentIds([]);
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          stats: {
            ...prev.stats,
            comments: Math.max(prev.stats.comments - deletedCount, 0),
          },
        };
      });

      message.success(
        interpolateMessage(t('profile.commentsDeleteSuccess'), {
          n: String(deletedCount),
        })
      );
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : t('profile.commentsDeleteError')
      );
    } finally {
      setIsDeletingComments(false);
    }
  };

  const handleExportComments = () => {
    if (comments.length === 0) return;

    const payload = comments.map((comment) => ({
      id: comment.id,
      content: comment.content,
      visibility: comment.isPrivate ? 'private' : 'public',
      reportCount: comment.reportCount,
      target: resolveCommentTarget(comment),
      createdAt: comment.createdAt,
    }));

    const fileContent = JSON.stringify(payload, null, 2);
    const blob = new Blob([fileContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `mundobl-comments-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

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

        <section className="profile-section">
          <div className="profile-section__header">
            <CommentOutlined className="profile-section__header-icon" />
            {t('profile.sectionMyComments')}
          </div>

          <div className="profile-comments__toolbar">
            <button
              type="button"
              className="profile-comments__toolbar-btn"
              onClick={toggleSelectAllComments}
              disabled={comments.length === 0}
            >
              {t('profile.commentsSelectAll')}
            </button>

            <span className="profile-comments__selected-count">
              {interpolateMessage(t('profile.commentsSelectedCount'), {
                n: String(selectedCommentIds.length),
              })}
            </span>

            <button
              type="button"
              className="profile-comments__toolbar-btn"
              onClick={handleExportComments}
              disabled={comments.length === 0}
            >
              <DownloadOutlined /> {t('profile.commentsExport')}
            </button>

            <button
              type="button"
              className="profile-comments__toolbar-btn profile-comments__toolbar-btn--danger"
              onClick={handleDeleteSelectedComments}
              disabled={selectedCommentIds.length === 0 || isDeletingComments}
            >
              <DeleteOutlined /> {t('profile.commentsDeleteSelected')}
            </button>
          </div>

          {comments.length === 0 ? (
            <div className="profile-comments__empty">
              <Empty description={t('profile.commentsEmpty')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
            </div>
          ) : (
            <div className="profile-comments__list">
              {comments.map((comment) => {
                const isSelected = selectedCommentIds.includes(comment.id);
                return (
                  <div key={comment.id} className="profile-comment-item">
                    <label className="profile-comment-item__header">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(event) =>
                          toggleCommentSelection(comment.id, event.target.checked)
                        }
                      />
                      <span className="profile-comment-item__date">
                        {formatDate(comment.createdAt)}
                      </span>
                    </label>

                    <p className="profile-comment-item__content">{comment.content}</p>

                    <div className="profile-comment-item__meta">
                      <Tag color={comment.isPrivate ? 'default' : 'geekblue'}>
                        {comment.isPrivate
                          ? t('profile.commentsPrivate')
                          : t('profile.commentsPublic')}
                      </Tag>
                      <span className="profile-comment-item__target">
                        {resolveCommentTarget(comment)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </AppLayout>
  );
}
