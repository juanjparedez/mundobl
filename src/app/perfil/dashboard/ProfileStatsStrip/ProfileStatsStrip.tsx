'use client';

import {
  CalendarOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  CommentOutlined,
  EyeOutlined,
  FireOutlined,
  HeartOutlined,
  PlayCircleOutlined,
  ReadOutlined,
  ReloadOutlined,
  StarOutlined,
  TagsOutlined,
} from '@ant-design/icons';
import type { ReactNode } from 'react';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { interpolateMessage } from '@/lib/i18n-format';
import type { ProfileData } from '../../types';
import './ProfileStatsStrip.css';

interface StripItem {
  icon: ReactNode;
  value: number | string;
  label: string;
  hint?: string;
}

export interface ProfileStatsStripProps {
  stats: ProfileData['stats'];
}

/** Fila horizontal compacta con los KPIs principales del usuario,
 *  alineada al style-guide (avatar header + stats strip + grid de widgets).
 *  Vive FUERA del DashboardGrid: es siempre visible y no reordenable. */
export function ProfileStatsStrip({ stats }: ProfileStatsStripProps) {
  const { t } = useLocale();
  const currentYear = new Date().getFullYear();
  const yearWatched =
    stats.completedByYear.find((y) => y.year === currentYear)?.count ?? 0;

  const items: StripItem[] = [
    {
      icon: <EyeOutlined />,
      value: stats.watched,
      label: t('profile.statWatched'),
    },
    {
      icon: <PlayCircleOutlined />,
      value: stats.watching,
      label: t('profile.statWatching'),
    },
    {
      icon: <ReloadOutlined />,
      value: stats.toRewatch,
      label: t('profile.statToRewatch'),
    },
    {
      icon: <CloseCircleOutlined />,
      value: stats.abandoned,
      label: t('profile.statAbandoned'),
    },
    {
      icon: <CalendarOutlined />,
      value: yearWatched,
      label: interpolateMessage(t('profile.overviewYearWatchedLabel'), {
        year: String(currentYear),
      }),
    },
    {
      icon: <HeartOutlined />,
      value: stats.favorites,
      label: t('profile.statFavorites'),
    },
    {
      icon: <StarOutlined />,
      value: stats.avgRating != null ? stats.avgRating.toFixed(1) : '—',
      label: t('profileDashboard.avgRating'),
    },
    {
      icon: <ReadOutlined />,
      value: stats.reviews,
      label: t('profile.statReviews'),
    },
    {
      icon: <CommentOutlined />,
      value: stats.comments,
      label: t('profile.statComments'),
    },
    {
      icon: <ClockCircleOutlined />,
      value: Math.round(stats.hoursWatched),
      label: t('profileDashboard.hoursWatched'),
    },
    {
      icon: <FireOutlined />,
      value: stats.longestStreak,
      label: t('profileDashboard.streak'),
    },
    {
      icon: <TagsOutlined />,
      value: stats.totalEpisodes,
      label: t('profileDashboard.totalEpisodes'),
    },
  ];

  return (
    <ul className="mb-profile-stats-strip">
      {items.map((item, idx) => (
        <li key={idx} className="mb-profile-stats-strip__item">
          <span className="mb-profile-stats-strip__icon" aria-hidden>
            {item.icon}
          </span>
          <span className="mb-profile-stats-strip__body">
            <span className="mb-profile-stats-strip__value">{item.value}</span>
            <span className="mb-profile-stats-strip__label">{item.label}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
