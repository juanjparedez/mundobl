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
  Segmented,
  Select,
  Spin,
  Tag,
  Tooltip,
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
  ThunderboltOutlined,
  TrophyOutlined,
  PieChartOutlined,
} from '@ant-design/icons';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { AppLayout } from '@/components/layout/AppLayout/AppLayout';
import { useMessage } from '@/hooks/useMessage';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { interpolateMessage } from '@/lib/i18n-format';
import { ProfileSettings } from './ProfileSettings/ProfileSettings';
import { isSupabaseImageUrl } from '@/lib/image-helpers';
import { SerieCardSkeleton } from '@/components/common/SerieCardSkeleton/SerieCardSkeleton';
import {
  StatWidget,
  StatBar,
  StatWidgetRestoreBar,
} from '@/components/common/StatWidget/StatWidget';
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
    topActors: Array<{ name: string; count: number }>;
    topProductionCompanies: Array<{ name: string; count: number }>;
    completedByYear: Array<{ year: number | null; count: number }>;
    avgRating: number | null;
    topRatedSeries: Array<{
      seriesId: number;
      title: string;
      rating: number;
      imageUrl: string | null;
    }>;
    byType: Array<{ type: string; count: number }>;
    totalEpisodes: number;
    longestStreak: number;
    heatmap: string[];
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
type StatsMode = 'basic' | 'advanced';

const PROFILE_STATS_MODE_STORAGE_KEY = 'profile-stats-mode';
const PROFILE_STATS_TOP_N_STORAGE_KEY = 'profile-stats-top-n';
const PROFILE_HIDDEN_WIDGETS_STORAGE_KEY = 'profile-hidden-widgets';

const ALL_WIDGET_IDS = [
  'hours',
  'streak',
  'episodes',
  'avg-rating',
  'genres',
  'countries',
  'by-type',
  'completed-by-year',
  'top-rated',
  'actors',
  'companies',
] as const;
type WidgetId = (typeof ALL_WIDGET_IDS)[number];

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
            quality={60}
            unoptimized={isSupabaseImageUrl(series.imageUrl)}
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
  const [statsMode, setStatsMode] = useState<StatsMode>('basic');
  const [statsTopN, setStatsTopN] = useState<number>(25);
  const [hiddenWidgets, setHiddenWidgets] = useState<WidgetId[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = window.localStorage.getItem(
        PROFILE_HIDDEN_WIDGETS_STORAGE_KEY
      );
      if (!raw) return [];
      const parsed = JSON.parse(raw) as unknown[];
      return parsed.filter((v): v is WidgetId =>
        (ALL_WIDGET_IDS as readonly string[]).includes(v as string)
      );
    } catch {
      return [];
    }
  });

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

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const storedMode = window.localStorage.getItem(
      PROFILE_STATS_MODE_STORAGE_KEY
    );
    if (storedMode === 'basic' || storedMode === 'advanced') {
      setStatsMode(storedMode);
    }

    const storedTopN = Number.parseInt(
      window.localStorage.getItem(PROFILE_STATS_TOP_N_STORAGE_KEY) || '25',
      10
    );
    if (Number.isFinite(storedTopN) && storedTopN > 0 && storedTopN <= 200) {
      setStatsTopN(storedTopN);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(PROFILE_STATS_MODE_STORAGE_KEY, statsMode);
  }, [statsMode]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(
      PROFILE_STATS_TOP_N_STORAGE_KEY,
      String(statsTopN)
    );
  }, [statsTopN]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(
      PROFILE_HIDDEN_WIDGETS_STORAGE_KEY,
      JSON.stringify(hiddenWidgets)
    );
  }, [hiddenWidgets]);

  const hideWidget = useCallback((id: string) => {
    setHiddenWidgets((prev) =>
      prev.includes(id as WidgetId) ? prev : [...prev, id as WidgetId]
    );
  }, []);

  const restoreWidget = useCallback((id: string) => {
    setHiddenWidgets((prev) => prev.filter((w) => w !== id));
  }, []);

  const loadProfile = useCallback(async () => {
    const params = new URLSearchParams({ topN: String(statsTopN) });
    const response = await fetch(`/api/user/profile?${params.toString()}`);
    if (!response.ok) {
      throw new Error('No se pudo cargar el perfil');
    }
    const profileData = (await response.json()) as ProfileData;
    setData(profileData);
  }, [statsTopN]);

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
        <div className="profile-loading-grid" aria-busy="true">
          <SerieCardSkeleton count={4} />
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
  const visibleTopGenres =
    statsMode === 'basic' ? stats.topGenres.slice(0, 5) : stats.topGenres;
  const visibleTopCountries =
    statsMode === 'basic' ? stats.topCountries.slice(0, 5) : stats.topCountries;
  const visibleTopActors =
    statsMode === 'basic' ? stats.topActors.slice(0, 5) : stats.topActors;
  const visibleTopProductionCompanies =
    statsMode === 'basic'
      ? stats.topProductionCompanies.slice(0, 5)
      : stats.topProductionCompanies;

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
          <div className="profile-rich-stats-controls">
            <div className="profile-rich-stats-controls__group">
              <span className="profile-rich-stats-controls__label">
                {t('profile.statsModeLabel')}
              </span>
              <Segmented<StatsMode>
                value={statsMode}
                onChange={(value) => setStatsMode(value)}
                options={[
                  { value: 'basic', label: t('profile.statsModeBasic') },
                  {
                    value: 'advanced',
                    label: t('profile.statsModeAdvanced'),
                  },
                ]}
              />
            </div>

            <div className="profile-rich-stats-controls__group">
              <span className="profile-rich-stats-controls__label">
                {t('profile.statsTopNLabel')}
              </span>
              <Select
                value={statsTopN}
                onChange={(value: number) => setStatsTopN(value)}
                options={[
                  { value: 5, label: t('profile.statsTopN5') },
                  { value: 10, label: t('profile.statsTopN10') },
                  { value: 25, label: t('profile.statsTopN25') },
                  { value: 50, label: t('profile.statsTopN50') },
                  { value: 200, label: t('profile.statsTopNAll') },
                ]}
                className="profile-rich-stats-controls__select"
              />
            </div>
          </div>

          {/* Restore hidden widgets */}
          <StatWidgetRestoreBar
            hiddenIds={hiddenWidgets}
            onRestore={restoreWidget}
            label={t('profile.statsRestoreWidgets')}
          />

          {/* Widget grid */}
          <div className="profile-widget-grid">
            {/* Hours watched */}
            {!hiddenWidgets.includes('hours') && (
              <StatWidget
                id="hours"
                title={t('profile.statsHoursWatched')}
                icon={<ClockCircleOutlined />}
                hiddenIds={hiddenWidgets}
                onHide={hideWidget}
                accent="var(--primary-color)"
              >
                <div className="profile-widget-kpi">
                  <span className="profile-widget-kpi__value">
                    {stats.hoursWatched}h
                  </span>
                  <span className="profile-widget-kpi__sub">
                    {stats.totalEpisodes.toLocaleString()}{' '}
                    {t('profile.statsEpisodesLabel')}
                  </span>
                </div>
              </StatWidget>
            )}

            {/* Streak */}
            {!hiddenWidgets.includes('streak') && (
              <StatWidget
                id="streak"
                title={t('profile.statsStreakTitle')}
                icon={<FireOutlined />}
                hiddenIds={hiddenWidgets}
                onHide={hideWidget}
                accent="#f59e0b"
              >
                <div className="profile-widget-kpi">
                  <span className="profile-widget-kpi__value">
                    {stats.longestStreak}
                  </span>
                  <span className="profile-widget-kpi__sub">
                    {t('profile.statsStreakDays')}
                  </span>
                </div>
                <div className="profile-heatmap">
                  {(() => {
                    const heatSet = new Set(stats.heatmap);
                    return Array.from({ length: 84 }).map((_, i) => {
                      const d = new Date();
                      d.setDate(d.getDate() - (83 - i));
                      const key = d.toISOString().slice(0, 10);
                      return (
                        <Tooltip key={key} title={key}>
                          <span
                            className={`profile-heatmap__cell${heatSet.has(key) ? ' profile-heatmap__cell--active' : ''}`}
                          />
                        </Tooltip>
                      );
                    });
                  })()}
                </div>
              </StatWidget>
            )}

            {/* Avg rating */}
            {!hiddenWidgets.includes('avg-rating') && (
              <StatWidget
                id="avg-rating"
                title={t('profile.statsAvgRating')}
                icon={<StarOutlined />}
                hiddenIds={hiddenWidgets}
                onHide={hideWidget}
                accent="#faad14"
              >
                <div className="profile-widget-kpi">
                  <span className="profile-widget-kpi__value">
                    {stats.avgRating != null ? `★ ${stats.avgRating}` : '—'}
                  </span>
                  <span className="profile-widget-kpi__sub">
                    {stats.ratings} {t('profile.statsRatingsGiven')}
                  </span>
                </div>
              </StatWidget>
            )}

            {/* Genres */}
            {!hiddenWidgets.includes('genres') && (
              <StatWidget
                id="genres"
                title={t('profile.statsTopGenres')}
                icon={<AppstoreOutlined />}
                hiddenIds={hiddenWidgets}
                onHide={hideWidget}
              >
                {visibleTopGenres.length === 0 ? (
                  <span className="profile-widget-empty">
                    {t('profile.statsNoData')}
                  </span>
                ) : (
                  visibleTopGenres.map((g) => (
                    <StatBar
                      key={g.name}
                      label={g.name}
                      count={g.count}
                      max={visibleTopGenres[0].count}
                    />
                  ))
                )}
              </StatWidget>
            )}

            {/* Countries */}
            {!hiddenWidgets.includes('countries') && (
              <StatWidget
                id="countries"
                title={t('profile.statsTopCountries')}
                icon={<GlobalOutlined />}
                hiddenIds={hiddenWidgets}
                onHide={hideWidget}
              >
                {visibleTopCountries.length === 0 ? (
                  <span className="profile-widget-empty">
                    {t('profile.statsNoData')}
                  </span>
                ) : (
                  visibleTopCountries.map((c) => (
                    <StatBar
                      key={c.name}
                      label={c.name}
                      count={c.count}
                      max={visibleTopCountries[0].count}
                    />
                  ))
                )}
              </StatWidget>
            )}

            {/* By type */}
            {!hiddenWidgets.includes('by-type') && (
              <StatWidget
                id="by-type"
                title={t('profile.statsByType')}
                icon={<PieChartOutlined />}
                hiddenIds={hiddenWidgets}
                onHide={hideWidget}
                accent="#10b981"
              >
                {stats.byType.length === 0 ? (
                  <span className="profile-widget-empty">
                    {t('profile.statsNoData')}
                  </span>
                ) : (
                  stats.byType.map((bt) => (
                    <StatBar
                      key={bt.type}
                      label={bt.type}
                      count={bt.count}
                      max={stats.byType[0].count}
                    />
                  ))
                )}
              </StatWidget>
            )}

            {/* Completed by year */}
            {!hiddenWidgets.includes('completed-by-year') &&
              stats.completedByYear.length > 0 && (
                <StatWidget
                  id="completed-by-year"
                  title={t('profile.statsCompletedByYear')}
                  icon={<CalendarOutlined />}
                  fullWidth
                  hiddenIds={hiddenWidgets}
                  onHide={hideWidget}
                >
                  <div className="profile-year-bars">
                    {(() => {
                      const max = Math.max(
                        ...stats.completedByYear.map((r) => r.count)
                      );
                      return stats.completedByYear.map((y) => (
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
                          <span className="profile-year-bar__year">
                            {y.year}
                          </span>
                        </div>
                      ));
                    })()}
                  </div>
                </StatWidget>
              )}

            {/* Advanced widgets */}
            {statsMode === 'advanced' && (
              <>
                {/* Top rated series */}
                {!hiddenWidgets.includes('top-rated') && (
                  <StatWidget
                    id="top-rated"
                    title={t('profile.statsTopRated')}
                    icon={<TrophyOutlined />}
                    hiddenIds={hiddenWidgets}
                    onHide={hideWidget}
                    accent="#faad14"
                  >
                    {stats.topRatedSeries.length === 0 ? (
                      <span className="profile-widget-empty">
                        {t('profile.statsNoData')}
                      </span>
                    ) : (
                      <div className="profile-top-rated-list">
                        {stats.topRatedSeries.map((s) => (
                          <Link
                            key={s.seriesId}
                            href={`/series/${s.seriesId}`}
                            className="profile-top-rated-item"
                          >
                            <span className="profile-top-rated-item__stars">
                              {'★'.repeat(s.rating)}
                              {'☆'.repeat(5 - s.rating)}
                            </span>
                            <span className="profile-top-rated-item__title">
                              {s.title}
                            </span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </StatWidget>
                )}

                {/* Top actors */}
                {!hiddenWidgets.includes('actors') && (
                  <StatWidget
                    id="actors"
                    title={t('profile.statsTopActors')}
                    icon={<UserOutlined />}
                    hiddenIds={hiddenWidgets}
                    onHide={hideWidget}
                  >
                    {visibleTopActors.length === 0 ? (
                      <span className="profile-widget-empty">
                        {t('profile.statsNoData')}
                      </span>
                    ) : (
                      visibleTopActors.map((a) => (
                        <StatBar
                          key={a.name}
                          label={a.name}
                          count={a.count}
                          max={visibleTopActors[0].count}
                        />
                      ))
                    )}
                  </StatWidget>
                )}

                {/* Top companies */}
                {!hiddenWidgets.includes('companies') && (
                  <StatWidget
                    id="companies"
                    title={t('profile.statsTopProductionCompanies')}
                    icon={<ThunderboltOutlined />}
                    hiddenIds={hiddenWidgets}
                    onHide={hideWidget}
                  >
                    {visibleTopProductionCompanies.length === 0 ? (
                      <span className="profile-widget-empty">
                        {t('profile.statsNoData')}
                      </span>
                    ) : (
                      visibleTopProductionCompanies.map((company) => (
                        <StatBar
                          key={company.name}
                          label={company.name}
                          count={company.count}
                          max={visibleTopProductionCompanies[0].count}
                        />
                      ))
                    )}
                  </StatWidget>
                )}
              </>
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

        <ProfileSettings />
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
