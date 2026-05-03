'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Avatar,
  Button,
  Empty,
  Input,
  Modal,
  Pagination,
  Progress,
  Select,
  Spin,
  Tag,
} from 'antd';
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
  EditOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  AppstoreOutlined,
  UnlockOutlined,
  LockOutlined,
  BarChartOutlined,
  ClockCircleOutlined,
  GlobalOutlined,
  FireOutlined,
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
    hoursWatched: number;
    activeDaysThisWeek: number;
    topGenres: Array<{ name: string; count: number }>;
    topCountries: Array<{ name: string; code: string | null; count: number }>;
    completedByYear: Array<{ year: number | null; count: number }>;
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
  season: {
    id: number;
    seasonNumber: number;
    series: { id: number; title: string } | null;
  } | null;
  episode: {
    id: number;
    episodeNumber: number;
    season: {
      seasonNumber: number;
      series: { id: number; title: string } | null;
    } | null;
  } | null;
}

interface UserCommentsResponse {
  comments: UserComment[];
  total: number;
  page: number;
  pageSize: number;
}

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

type VisibilityFilter = 'all' | 'public' | 'private';
type TargetFilter = 'all' | 'series' | 'season' | 'episode';

function SeriesCard({
  series,
  nextEpisode,
  progress,
}: {
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
          {series.year ?? '-'} · {series.country?.name ?? '-'}
        </span>
        {progress && progress.totalEpisodes > 0 && (
          <Progress
            percent={Math.round(
              (progress.watchedEpisodes / progress.totalEpisodes) * 100
            )}
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
  const [loading, setLoading] = useState(true);

  const [comments, setComments] = useState<UserComment[]>([]);
  const [commentsTotal, setCommentsTotal] = useState(0);
  const [commentsPage, setCommentsPage] = useState(1);
  const [commentsPageSize, setCommentsPageSize] = useState(10);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [selectedCommentIds, setSelectedCommentIds] = useState<number[]>([]);

  const [searchDraft, setSearchDraft] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibilityFilter, setVisibilityFilter] =
    useState<VisibilityFilter>('all');
  const [targetFilter, setTargetFilter] = useState<TargetFilter>('all');
  const [reportedOnly, setReportedOnly] = useState(false);

  const [isDeletingComments, setIsDeletingComments] = useState(false);
  const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false);

  const [editingComment, setEditingComment] = useState<UserComment | null>(
    null
  );
  const [editingContent, setEditingContent] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [disputes, setDisputes] = useState<UserDispute[]>([]);
  const [disputesLoading, setDisputesLoading] = useState(false);
  const [disputeTarget, setDisputeTarget] = useState<UserComment | null>(null);
  const [disputeMessage, setDisputeMessage] = useState('');
  const [isSubmittingDispute, setIsSubmittingDispute] = useState(false);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  const resolveCommentTarget = useCallback(
    (comment: UserComment) => {
      if (comment.episode?.season?.series?.title) {
        return `${comment.episode.season.series.title} · T${comment.episode.season.seasonNumber}E${comment.episode.episodeNumber}`;
      }

      if (comment.season?.series?.title) {
        return `${comment.season.series.title} · T${comment.season.seasonNumber}`;
      }

      if (comment.series?.title) {
        return comment.series.title;
      }

      return t('profile.commentsTargetUnknown');
    },
    [t]
  );

  const loadProfile = useCallback(async () => {
    const response = await fetch('/api/user/profile');
    if (!response.ok) {
      throw new Error('No se pudo cargar el perfil');
    }
    const profileData = (await response.json()) as ProfileData;
    setData(profileData);
  }, []);

  const loadComments = useCallback(async () => {
    if (status !== 'authenticated') return;

    setCommentsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(commentsPage));
      params.set('pageSize', String(commentsPageSize));
      if (searchQuery) params.set('q', searchQuery);
      if (visibilityFilter !== 'all')
        params.set('visibility', visibilityFilter);
      if (targetFilter !== 'all') params.set('target', targetFilter);
      if (reportedOnly) params.set('reported', 'true');

      const response = await fetch(`/api/user/comments?${params.toString()}`);
      if (!response.ok) {
        throw new Error(t('profile.commentsLoadError'));
      }

      const result = (await response.json()) as UserCommentsResponse;
      setComments(result.comments);
      setCommentsTotal(result.total);

      setSelectedCommentIds((prev) =>
        prev.filter((id) =>
          result.comments.some((comment) => comment.id === id)
        )
      );
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : t('profile.commentsLoadError')
      );
    } finally {
      setCommentsLoading(false);
    }
  }, [
    commentsPage,
    commentsPageSize,
    message,
    reportedOnly,
    searchQuery,
    status,
    t,
    targetFilter,
    visibilityFilter,
  ]);

  const loadDisputes = useCallback(async () => {
    if (status !== 'authenticated') return;

    setDisputesLoading(true);
    try {
      const response = await fetch('/api/user/comment-disputes?limit=100');
      if (!response.ok) {
        throw new Error(t('profile.disputesLoadError'));
      }

      const result = (await response.json()) as UserDisputesResponse;
      setDisputes(result.disputes);
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : t('profile.disputesLoadError')
      );
    } finally {
      setDisputesLoading(false);
    }
  }, [message, status, t]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      setLoading(false);
      return;
    }

    if (status !== 'authenticated') return;

    Promise.all([loadProfile(), loadDisputes()])
      .catch((error) => {
        console.error(error);
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [loadDisputes, loadProfile, status]);

  useEffect(() => {
    void loadComments();
  }, [loadComments]);

  const allCommentsSelected =
    comments.length > 0 && selectedCommentIds.length === comments.length;

  const selectedComments = useMemo(
    () => comments.filter((comment) => selectedCommentIds.includes(comment.id)),
    [comments, selectedCommentIds]
  );

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

      setSelectedCommentIds([]);
      await loadComments();

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
        error instanceof Error
          ? error.message
          : t('profile.commentsDeleteError')
      );
    } finally {
      setIsDeletingComments(false);
    }
  };

  const handleSetSelectedVisibility = async (isPrivate: boolean) => {
    if (selectedCommentIds.length === 0) return;

    setIsUpdatingVisibility(true);
    try {
      const response = await fetch('/api/user/comments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'setVisibility',
          ids: selectedCommentIds,
          isPrivate,
        }),
      });

      if (!response.ok) {
        throw new Error(t('profile.commentsVisibilityUpdateError'));
      }

      await loadComments();
      setSelectedCommentIds([]);

      message.success(
        isPrivate
          ? t('profile.commentsVisibilityPrivateSuccess')
          : t('profile.commentsVisibilityPublicSuccess')
      );
    } catch (error) {
      message.error(
        error instanceof Error
          ? error.message
          : t('profile.commentsVisibilityUpdateError')
      );
    } finally {
      setIsUpdatingVisibility(false);
    }
  };

  const openEditModal = (comment: UserComment) => {
    setEditingComment(comment);
    setEditingContent(comment.content);
  };

  const closeEditModal = () => {
    setEditingComment(null);
    setEditingContent('');
  };

  const handleSaveCommentEdit = async () => {
    if (!editingComment) return;

    setIsSavingEdit(true);
    try {
      const response = await fetch('/api/user/comments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateContent',
          id: editingComment.id,
          content: editingContent,
        }),
      });

      if (!response.ok) {
        throw new Error(t('profile.commentsEditError'));
      }

      message.success(t('profile.commentsEditSuccess'));
      closeEditModal();
      await loadComments();
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : t('profile.commentsEditError')
      );
    } finally {
      setIsSavingEdit(false);
    }
  };

  const openDisputeModal = (comment: UserComment) => {
    setDisputeTarget(comment);
    setDisputeMessage('');
  };

  const closeDisputeModal = () => {
    setDisputeTarget(null);
    setDisputeMessage('');
  };

  const handleSubmitDispute = async () => {
    if (!disputeTarget) return;

    setIsSubmittingDispute(true);
    try {
      const response = await fetch('/api/user/comment-disputes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commentId: disputeTarget.id,
          message: disputeMessage,
        }),
      });

      if (!response.ok) {
        const payload =
          ((await response.json().catch(() => ({}))) as { error?: string }) ||
          {};
        throw new Error(payload.error || t('profile.disputeError'));
      }

      message.success(t('profile.disputeSuccess'));
      closeDisputeModal();
      await loadDisputes();
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : t('profile.disputeError')
      );
    } finally {
      setIsSubmittingDispute(false);
    }
  };

  const handleExportComments = () => {
    const exportRows =
      selectedComments.length > 0 ? selectedComments : comments;

    if (exportRows.length === 0) return;

    const payload = exportRows.map((comment) => ({
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

  if (loading) {
    return (
      <AppLayout>
        <div className="profile-loading">
          <Spin size="large" />
        </div>
      </AppLayout>
    );
  }

  if (!session?.user || !data) {
    return (
      <AppLayout>
        <div className="profile-page">
          <Empty
            description={t('profile.loginRequired')}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </div>
      </AppLayout>
    );
  }

  const { user, stats } = data;

  const statItems = [
    {
      icon: <CheckCircleOutlined />,
      value: stats.watched,
      label: t('profile.statWatched'),
    },
    {
      icon: <PlayCircleOutlined />,
      value: stats.watching,
      label: t('profile.statWatching'),
    },
    {
      icon: <CloseCircleOutlined />,
      value: stats.abandoned,
      label: t('profile.statAbandoned'),
    },
    {
      icon: <ReloadOutlined />,
      value: stats.toRewatch,
      label: t('profile.statToRewatch'),
    },
    {
      icon: <HeartOutlined />,
      value: stats.favorites,
      label: t('profile.statFavorites'),
    },
    {
      icon: <StarOutlined />,
      value: stats.ratings,
      label: t('profile.statRatings'),
    },
    {
      icon: <MessageOutlined />,
      value: stats.comments,
      label: t('profile.statComments'),
    },
  ];

  return (
    <AppLayout>
      <div className="profile-page">
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

        <div className="profile-stats">
          {statItems.map((stat, index) => (
            <div key={index} className="profile-stat">
              <div className="profile-stat__icon">{stat.icon}</div>
              <div className="profile-stat__value">{stat.value}</div>
              <div className="profile-stat__label">{stat.label}</div>
            </div>
          ))}
        </div>

        <section className="profile-section">
          <div className="profile-section__header">
            <BarChartOutlined className="profile-section__header-icon" />
            {t('profile.sectionStats')}
          </div>
          <div className="profile-rich-stats">
            {/* Hours watched */}
            <div className="profile-rich-stat-card">
              <div className="profile-rich-stat-card__icon">
                <ClockCircleOutlined />
              </div>
              <div className="profile-rich-stat-card__value">
                {stats.hoursWatched}h
              </div>
              <div className="profile-rich-stat-card__label">
                {t('profile.statsHoursWatched')}
              </div>
            </div>

            {/* Weekly activity */}
            <div className="profile-rich-stat-card">
              <div className="profile-rich-stat-card__icon">
                <FireOutlined />
              </div>
              <div className="profile-rich-stat-card__value">
                {stats.activeDaysThisWeek}/7
              </div>
              <div className="profile-rich-stat-card__label">
                {t('profile.statsActiveDays')}
              </div>
              <div className="profile-weekly-dots">
                {Array.from({ length: 7 }).map((_, i) => (
                  <span
                    key={i}
                    className={`profile-weekly-dot${i < stats.activeDaysThisWeek ? ' profile-weekly-dot--active' : ''}`}
                  />
                ))}
              </div>
            </div>

            {/* Top genres */}
            <div className="profile-rich-stat-card profile-rich-stat-card--wide">
              <div className="profile-rich-stat-card__header">
                <GlobalOutlined />
                {t('profile.statsTopGenres')}
              </div>
              {stats.topGenres.length === 0 ? (
                <span className="profile-rich-stat-card__empty">
                  {t('profile.statsNoData')}
                </span>
              ) : (
                <div className="profile-top-list">
                  {stats.topGenres.map((g) => (
                    <div key={g.name} className="profile-top-list__item">
                      <span className="profile-top-list__name">{g.name}</span>
                      <Progress
                        percent={Math.round(
                          (g.count / stats.topGenres[0].count) * 100
                        )}
                        showInfo={false}
                        size="small"
                        className="profile-top-list__bar"
                      />
                      <span className="profile-top-list__count">{g.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top countries */}
            <div className="profile-rich-stat-card profile-rich-stat-card--wide">
              <div className="profile-rich-stat-card__header">
                <GlobalOutlined />
                {t('profile.statsTopCountries')}
              </div>
              {stats.topCountries.length === 0 ? (
                <span className="profile-rich-stat-card__empty">
                  {t('profile.statsNoData')}
                </span>
              ) : (
                <div className="profile-top-list">
                  {stats.topCountries.map((c) => (
                    <div key={c.name} className="profile-top-list__item">
                      <span className="profile-top-list__name">{c.name}</span>
                      <Progress
                        percent={Math.round(
                          (c.count / stats.topCountries[0].count) * 100
                        )}
                        showInfo={false}
                        size="small"
                        className="profile-top-list__bar"
                      />
                      <span className="profile-top-list__count">{c.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Completed by year */}
            {stats.completedByYear.length > 0 && (
              <div className="profile-rich-stat-card profile-rich-stat-card--full">
                <div className="profile-rich-stat-card__header">
                  <CalendarOutlined />
                  {t('profile.statsCompletedByYear')}
                </div>
                <div className="profile-year-bars">
                  {stats.completedByYear.map((y) => {
                    const max = Math.max(
                      ...stats.completedByYear.map((r) => r.count)
                    );
                    return (
                      <div key={y.year} className="profile-year-bar">
                        <div
                          className="profile-year-bar__fill"
                          style={{
                            height: `${Math.round((y.count / max) * 60)}px`,
                          }}
                        />
                        <span className="profile-year-bar__count">
                          {y.count}
                        </span>
                        <span className="profile-year-bar__year">{y.year}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>

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

          <div className="profile-comments__filters">
            <Input.Search
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              onSearch={() => {
                setCommentsPage(1);
                setSearchQuery(searchDraft.trim());
              }}
              placeholder={t('profile.commentsSearchPlaceholder')}
              allowClear
              className="profile-comments__search"
            />

            <Select
              value={visibilityFilter}
              onChange={(value: VisibilityFilter) => {
                setCommentsPage(1);
                setVisibilityFilter(value);
              }}
              className="profile-comments__select"
              options={[
                { value: 'all', label: t('profile.commentsFilterAll') },
                { value: 'public', label: t('profile.commentsFilterPublic') },
                { value: 'private', label: t('profile.commentsFilterPrivate') },
              ]}
            />

            <Select
              value={targetFilter}
              onChange={(value: TargetFilter) => {
                setCommentsPage(1);
                setTargetFilter(value);
              }}
              className="profile-comments__select"
              options={[
                { value: 'all', label: t('profile.commentsFilterTargetAll') },
                { value: 'series', label: t('profile.commentsTargetSeries') },
                { value: 'season', label: t('profile.commentsTargetSeason') },
                { value: 'episode', label: t('profile.commentsTargetEpisode') },
              ]}
            />

            <Button
              type={reportedOnly ? 'primary' : 'default'}
              icon={<ExclamationCircleOutlined />}
              onClick={() => {
                setCommentsPage(1);
                setReportedOnly((prev) => !prev);
              }}
            >
              {t('profile.commentsFilterReported')}
            </Button>
          </div>

          <div className="profile-comments__toolbar">
            <Button
              onClick={toggleSelectAllComments}
              disabled={comments.length === 0}
            >
              {t('profile.commentsSelectAll')}
            </Button>

            <span className="profile-comments__selected-count">
              {interpolateMessage(t('profile.commentsSelectedCount'), {
                n: String(selectedCommentIds.length),
              })}
            </span>

            <Button
              icon={<UnlockOutlined />}
              onClick={() => {
                void handleSetSelectedVisibility(false);
              }}
              disabled={selectedCommentIds.length === 0 || isUpdatingVisibility}
            >
              {t('profile.commentsSetPublic')}
            </Button>

            <Button
              icon={<LockOutlined />}
              onClick={() => {
                void handleSetSelectedVisibility(true);
              }}
              disabled={selectedCommentIds.length === 0 || isUpdatingVisibility}
            >
              {t('profile.commentsSetPrivate')}
            </Button>

            <Button
              icon={<DownloadOutlined />}
              onClick={handleExportComments}
              disabled={comments.length === 0}
            >
              {t('profile.commentsExport')}
            </Button>

            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={() => {
                void handleDeleteSelectedComments();
              }}
              disabled={selectedCommentIds.length === 0 || isDeletingComments}
            >
              {t('profile.commentsDeleteSelected')}
            </Button>
          </div>

          {commentsLoading ? (
            <div className="profile-comments__loading">
              <Spin />
            </div>
          ) : comments.length === 0 ? (
            <div className="profile-comments__empty">
              <Empty
                description={t('profile.commentsEmpty')}
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            </div>
          ) : (
            <>
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
                            toggleCommentSelection(
                              comment.id,
                              event.target.checked
                            )
                          }
                        />
                        <span className="profile-comment-item__date">
                          {formatDate(comment.createdAt)}
                        </span>
                      </label>

                      <p className="profile-comment-item__content">
                        {comment.content}
                      </p>

                      <div className="profile-comment-item__meta">
                        <Tag color={comment.isPrivate ? 'default' : 'geekblue'}>
                          {comment.isPrivate
                            ? t('profile.commentsPrivate')
                            : t('profile.commentsPublic')}
                        </Tag>

                        <span className="profile-comment-item__target">
                          {resolveCommentTarget(comment)}
                        </span>

                        {comment.reportCount > 0 && (
                          <Tag color="warning">
                            {interpolateMessage(
                              t('profile.commentsReportCount'),
                              {
                                n: String(comment.reportCount),
                              }
                            )}
                          </Tag>
                        )}
                      </div>

                      <div className="profile-comment-item__actions">
                        <Button
                          size="small"
                          icon={<EditOutlined />}
                          onClick={() => openEditModal(comment)}
                        >
                          {t('profile.commentsEdit')}
                        </Button>

                        <Button
                          size="small"
                          icon={<ExclamationCircleOutlined />}
                          disabled={comment.reportCount <= 0}
                          onClick={() => openDisputeModal(comment)}
                        >
                          {t('profile.commentsOpenDispute')}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="profile-comments__pagination-wrap">
                <Pagination
                  current={commentsPage}
                  pageSize={commentsPageSize}
                  total={commentsTotal}
                  showSizeChanger
                  pageSizeOptions={['10', '20', '50']}
                  onChange={(page, pageSize) => {
                    setCommentsPage(page);
                    setCommentsPageSize(pageSize);
                  }}
                />
              </div>
            </>
          )}
        </section>

        <section className="profile-section">
          <div className="profile-section__header">
            <ExclamationCircleOutlined className="profile-section__header-icon" />
            {t('profile.sectionDisputes')}
          </div>

          {disputesLoading ? (
            <div className="profile-comments__loading">
              <Spin />
            </div>
          ) : disputes.length === 0 ? (
            <div className="profile-comments__empty">
              <Empty
                description={t('profile.disputesEmpty')}
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            </div>
          ) : (
            <div className="profile-disputes__list">
              {disputes.map((dispute) => (
                <div key={dispute.id} className="profile-dispute-item">
                  <div className="profile-dispute-item__header">
                    <span className="profile-dispute-item__title">
                      {dispute.title}
                    </span>
                    <Tag>{dispute.status}</Tag>
                  </div>
                  <div className="profile-dispute-item__meta">
                    <span>
                      {interpolateMessage(t('profile.disputeForComment'), {
                        n: String(dispute.commentId ?? 0),
                      })}
                    </span>
                    <span>{formatDate(dispute.createdAt)}</span>
                    <span>{dispute.target}</span>
                  </div>
                  {dispute.message && (
                    <p className="profile-dispute-item__message">
                      {dispute.message}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <Modal
        open={editingComment !== null}
        title={t('profile.commentsEditTitle')}
        okText={t('profile.commentsEditSave')}
        cancelText={t('profile.commentsEditCancel')}
        onCancel={closeEditModal}
        onOk={() => {
          void handleSaveCommentEdit();
        }}
        okButtonProps={{ loading: isSavingEdit }}
      >
        <Input.TextArea
          rows={5}
          maxLength={2000}
          showCount
          value={editingContent}
          onChange={(event) => setEditingContent(event.target.value)}
          placeholder={t('profile.commentsEditPlaceholder')}
        />
      </Modal>

      <Modal
        open={disputeTarget !== null}
        title={t('profile.disputeOpenTitle')}
        okText={t('profile.disputeSubmit')}
        cancelText={t('profile.disputeCancel')}
        onCancel={closeDisputeModal}
        onOk={() => {
          void handleSubmitDispute();
        }}
        okButtonProps={{ loading: isSubmittingDispute }}
      >
        <Input.TextArea
          rows={5}
          maxLength={2000}
          showCount
          value={disputeMessage}
          onChange={(event) => setDisputeMessage(event.target.value)}
          placeholder={t('profile.disputePlaceholder')}
        />
      </Modal>
    </AppLayout>
  );
}
