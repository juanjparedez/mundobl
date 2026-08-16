'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { Button, Checkbox, Popover, Space } from 'antd';
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
  SettingOutlined,
  StarOutlined,
  TagsOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import { Widget } from '@/components/dashboard';
import { EmptyState } from '@/components/design-system';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { interpolateMessage } from '@/lib/i18n-format';
import type { ProfileData } from '../../../types';
import './StatsStripWidget.css';

type StatKey =
  | 'watched'
  | 'watching'
  | 'toRewatch'
  | 'abandoned'
  | 'yearWatched'
  | 'favorites'
  | 'avgRating'
  | 'reviews'
  | 'comments'
  | 'hoursWatched'
  | 'streak'
  | 'totalEpisodes';

const ALL_STATS: StatKey[] = [
  'watched',
  'watching',
  'toRewatch',
  'abandoned',
  'yearWatched',
  'favorites',
  'avgRating',
  'reviews',
  'comments',
  'hoursWatched',
  'streak',
  'totalEpisodes',
];

const STORAGE_KEY = 'profile-stats-visible-v1';

interface StripItem {
  key: StatKey;
  icon: ReactNode;
  value: number | string;
  label: string;
}

interface StatsStripWidgetProps {
  stats: ProfileData['stats'];
}

/** Strip de KPIs movido del flujo fijo del dashboard al sistema de widgets
 *  (iter fine_tunning_1 #7). El user puede:
 *  - Sacar el widget completo del grid (X en modo edit).
 *  - Configurar cuales mini-stats mostrar via popover con checkboxes.
 *  La visibilidad por stat persiste en localStorage. */
function loadInitialVisible(): Set<StatKey> {
  if (typeof window === 'undefined') return new Set(ALL_STATS);
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) return new Set(parsed as StatKey[]);
    }
  } catch {
    // ignore - quota/private mode/etc., usa defaults
  }
  return new Set(ALL_STATS);
}

export function StatsStripWidget({ stats }: StatsStripWidgetProps) {
  const { t } = useLocale();
  // Lazy init evita cascading-render warning de eslint y se ejecuta
  // una sola vez en el mount. SSR friendly: si window no existe,
  // arranca con todos visible (que es el default visual).
  const [visible, setVisible] = useState<Set<StatKey>>(loadInitialVisible);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const persist = (next: Set<StatKey>) => {
    setVisible(next);
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
    } catch {
      // quota / private mode — la pref no persiste pero el toggle si funciona
      // en la sesion actual.
    }
  };

  const toggle = (key: StatKey) => {
    const next = new Set(visible);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    persist(next);
  };

  const currentYear = new Date().getFullYear();
  const yearWatched =
    stats.completedByYear.find((y) => y.year === currentYear)?.count ?? 0;

  const allItems: StripItem[] = useMemo(
    () => [
      {
        key: 'watched',
        icon: <EyeOutlined />,
        value: stats.watched,
        label: t('profile.statWatched'),
      },
      {
        key: 'watching',
        icon: <PlayCircleOutlined />,
        value: stats.watching,
        label: t('profile.statWatching'),
      },
      {
        key: 'toRewatch',
        icon: <ReloadOutlined />,
        value: stats.toRewatch,
        label: t('profile.statToRewatch'),
      },
      {
        key: 'abandoned',
        icon: <CloseCircleOutlined />,
        value: stats.abandoned,
        label: t('profile.statAbandoned'),
      },
      {
        key: 'yearWatched',
        icon: <CalendarOutlined />,
        value: yearWatched,
        label: interpolateMessage(t('profile.overviewYearWatchedLabel'), {
          year: String(currentYear),
        }),
      },
      {
        key: 'favorites',
        icon: <HeartOutlined />,
        value: stats.favorites,
        label: t('profile.statFavorites'),
      },
      {
        key: 'avgRating',
        icon: <StarOutlined />,
        value: stats.avgRating != null ? stats.avgRating.toFixed(1) : '—',
        label: t('profileDashboard.avgRating'),
      },
      {
        key: 'reviews',
        icon: <ReadOutlined />,
        value: stats.reviews,
        label: t('profile.statReviews'),
      },
      {
        key: 'comments',
        icon: <CommentOutlined />,
        value: stats.comments,
        label: t('profile.statComments'),
      },
      {
        key: 'hoursWatched',
        icon: <ClockCircleOutlined />,
        value: Math.round(stats.hoursWatched),
        label: t('profileDashboard.hoursWatched'),
      },
      {
        key: 'streak',
        icon: <FireOutlined />,
        value: stats.longestStreak,
        label: t('profileDashboard.streak'),
      },
      {
        key: 'totalEpisodes',
        icon: <TagsOutlined />,
        value: stats.totalEpisodes,
        label: t('profileDashboard.totalEpisodes'),
      },
    ],
    [stats, yearWatched, currentYear, t]
  );

  const filteredItems = allItems.filter((i) => visible.has(i.key));

  const configContent = (
    <div className="mb-stats-strip-widget__config">
      <p className="mb-stats-strip-widget__config-hint">
        {t('profileDashboard.statsStripConfigHint')}
      </p>
      <Space direction="vertical" size={4}>
        {allItems.map((item) => (
          <Checkbox
            key={item.key}
            checked={visible.has(item.key)}
            onChange={() => toggle(item.key)}
          >
            {item.label}
          </Checkbox>
        ))}
      </Space>
    </div>
  );

  const configBtn = (
    <Popover
      content={configContent}
      title={t('profileDashboard.statsStripConfigTitle')}
      trigger="click"
      open={popoverOpen}
      onOpenChange={setPopoverOpen}
      placement="bottomRight"
    >
      <Button
        size="small"
        type="text"
        icon={<SettingOutlined />}
        aria-label={t('profileDashboard.statsStripConfigTitle')}
      />
    </Popover>
  );

  return (
    <Widget
      title={t('profileDashboard.widgetStatsStrip')}
      icon={<BarChartOutlined />}
      actions={configBtn}
      noPadding
    >
      {filteredItems.length === 0 ? (
        <EmptyState
          title={t('profileDashboard.statsStripAllHidden')}
          variant="soft"
          fullHeight={false}
        />
      ) : (
        <ul className="mb-stats-strip-widget__list">
          {filteredItems.map((item) => (
            <li key={item.key} className="mb-stats-strip-widget__item">
              <span className="mb-stats-strip-widget__icon" aria-hidden>
                {item.icon}
              </span>
              <span className="mb-stats-strip-widget__body">
                <span className="mb-stats-strip-widget__value">
                  {item.value}
                </span>
                <span className="mb-stats-strip-widget__label">
                  {item.label}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </Widget>
  );
}
