'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import Link from 'next/link';
import { Alert, Button, Input, Segmented, Select, Skeleton, Tabs } from 'antd';
import {
  BookOutlined,
  LockOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import {
  EmptyState,
  SectionHeader,
  StatCard,
} from '@/components/design-system';
import { MyDiaryWidget } from '@/app/(app)/perfil/dashboard/widgets/MyDiaryWidget/MyDiaryWidget';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { useMessage } from '@/hooks/useMessage';
import { useWatchingPreferences } from '@/hooks/useWatchingPreferences';
import { useWatchingLocation } from '@/hooks/useWatchingLocation';
import { useWatchingScroll } from '@/hooks/useWatchingScroll';
import {
  LIBRARY_STATUSES,
  selectWatchingItems,
  watchingProgress,
  type WatchingFilter,
  type WatchingItem,
  type WatchingSort,
} from '@/lib/watching-collection';
import { WatchingSeriesCard } from '../WatchingSeriesCard/WatchingSeriesCard';
import { WatchingEpisodeDrawer } from '../WatchingEpisodeDrawer/WatchingEpisodeDrawer';
import { TrackingHistory } from '../TrackingHistory/TrackingHistory';
import './CurrentlyWatchingDashboard.css';

export function CurrentlyWatchingDashboard() {
  const { data: session, status } = useSession();
  const { t } = useLocale();
  if (status === 'loading') return <Skeleton active />;
  if (!session?.user?.id)
    return (
      <EmptyState
        title={t('watchingDashboard.loginPrompt')}
        action={
          <Button type="primary" onClick={() => void signIn()}>
            {t('trackingWorkspace.signIn')}
          </Button>
        }
      />
    );
  // Changing accounts remounts the workspace before any private data can be shown.
  return <WatchingCollection key={session.user.id} userId={session.user.id} />;
}

function WatchingCollection({ userId }: { userId: string }) {
  const { t, locale } = useLocale();
  const message = useMessage();
  const {
    preferences,
    updatePreferences,
    ready,
    saving,
    failed: preferencesFailed,
    reload: reloadPreferences,
  } = useWatchingPreferences(userId);
  const statusLabels: Record<string, string> = {
    SIN_VER: t('viewStatus.sinVer'),
    VIENDO: t('viewStatus.viendo'),
    VISTA: t('viewStatus.vista'),
    RETOMAR: t('viewStatus.retomar'),
    ABANDONADA: t('viewStatus.abandonada'),
  };
  const [items, setItems] = useState<WatchingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const mutationLock = useRef(false);
  const request = useRef<AbortController | null>(null);
  const location = useWatchingLocation();
  const search = location.params.get('q') ?? '';
  const setSearch = (value: string) => location.set('q', value);
  const rawFilter = location.params.get('status');
  const filter: WatchingFilter =
    rawFilter === 'all' || LIBRARY_STATUSES.some((value) => value === rawFilter)
      ? (rawFilter as WatchingFilter)
      : 'active';
  const setFilter = (value: WatchingFilter) => location.set('status', value);
  const rawTab = location.params.get('tab');
  const tab = rawTab === 'history' || rawTab === 'diary' ? rawTab : 'continue';
  useWatchingScroll(userId, tab === 'continue' && !loading && ready);
  const [selected, setSelected] = useState<WatchingItem | null>(null);

  const load = useCallback(async () => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    try {
      const response = await fetch('/api/user/library', {
        signal: controller.signal,
      });
      if (!response.ok) throw new Error();
      const data: unknown = await response.json();
      if (!Array.isArray(data)) throw new Error();
      if (!controller.signal.aborted) {
        setItems(data as WatchingItem[]);
        setFailed(false);
      }
    } catch {
      if (!controller.signal.aborted) setFailed(true);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    return () => request.current?.abort();
  }, [load]);

  const markNext = async (item: WatchingItem) => {
    const next = watchingProgress(item).next;
    if (!next || mutationLock.current) return;
    mutationLock.current = true;
    setBusy(true);
    try {
      const response = await fetch(`/api/series/${item.series.id}/watched`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ episodeIds: next.episodeIds, watched: true }),
      });
      if (!response.ok) throw new Error();
      message.success(
        t('watchingDashboard.episodeMarkedMessage', { ep: next.label })
      );
      await load();
    } catch {
      message.error(t('watchingDashboard.errorMarkEpisode'));
    } finally {
      mutationLock.current = false;
      setBusy(false);
    }
  };

  const visible = useMemo(
    () => selectWatchingItems(items, search, filter, preferences),
    [items, search, filter, preferences]
  );
  const chapterCount = useMemo(
    () =>
      items.reduce((total, item) => total + watchingProgress(item).watched, 0),
    [items]
  );
  const list = (
    <div className="watching-workspace__continue">
      {loading ? (
        <Skeleton active />
      ) : (
        <>
          <div className="watching-workspace__stats">
            <StatCard
              label={t('libraryWorkspace.title')}
              value={items.length}
              hint={t('libraryWorkspace.scope')}
            />
            <StatCard
              label={t('viewStatus.retomar')}
              value={items.filter((item) => item.status === 'RETOMAR').length}
              hint={t('libraryWorkspace.scope')}
            />
            <StatCard
              label={t('trackingWorkspace.chapters')}
              value={chapterCount}
              hint={t('libraryWorkspace.scope')}
            />
          </div>
          <div className="watching-workspace__toolbar">
            <Input.Search
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t('trackingWorkspace.search')}
              aria-label={t('trackingWorkspace.search')}
              allowClear
            />
            <Select
              value={filter}
              aria-label={t('trackingWorkspace.filter')}
              onChange={setFilter}
              options={[
                { value: 'active', label: t('trackingWorkspace.continue') },
                { value: 'all', label: t('trackingWorkspace.all') },
                ...LIBRARY_STATUSES.map((value) => ({
                  value,
                  label:
                    statusLabels[value] +
                    ' (' +
                    items.filter((item) => item.status === value).length +
                    ')',
                })),
              ]}
            />
            <Select
              disabled={!ready || saving}
              value={preferences.sort}
              aria-label={t('watchingDashboard.sortLabel')}
              onChange={(sort: WatchingSort) =>
                void updatePreferences({ sort })
              }
              options={[
                {
                  value: 'recent',
                  label: t('watchingDashboard.sortLastWatched'),
                },
                { value: 'name', label: t('watchingDashboard.sortName') },
                { value: 'remaining', label: t('trackingWorkspace.remaining') },
              ]}
            />
            <Segmented
              disabled={!ready || saving}
              value={preferences.view}
              onChange={(view: 'list' | 'grid') =>
                void updatePreferences({ view })
              }
              options={[
                { value: 'list', label: t('trackingWorkspace.list') },
                { value: 'grid', label: t('trackingWorkspace.grid') },
              ]}
            />
          </div>
          <p className="watching-workspace__hint">
            {t(
              saving
                ? 'libraryWorkspace.saving'
                : 'libraryWorkspace.preferences'
            )}
          </p>
          {visible.length > 0 ? (
            <div
              className={`watching-collection watching-collection--${preferences.view}`}
            >
              {visible.map((item) => {
                const progress = watchingProgress(item);
                const pinned = preferences.pinned.includes(item.series.id);
                return (
                  <WatchingSeriesCard
                    key={item.series.id}
                    item={item}
                    pinned={pinned}
                    busy={busy}
                    onManage={() => setSelected(item)}
                    onMark={() => void markNext(item)}
                    pinDisabled={!ready || saving}
                    onPin={() =>
                      void updatePreferences({
                        pin: { id: item.series.id, pinned: !pinned },
                      })
                    }
                    labels={{
                      pin: t(
                        pinned
                          ? 'trackingWorkspace.unpin'
                          : 'trackingWorkspace.pin'
                      ),
                      manage: t('trackingWorkspace.manage'),
                      mark: t('watchingDashboard.markNextCode', {
                        code: progress.next?.label ?? '',
                      }),
                      watch: t('watchingDashboard.watchNow'),
                      next: progress.next
                        ? `${t('watchingDashboard.nextLabel')}: ${progress.next.label}`
                        : progress.total > 0
                          ? t(
                              progress.watched === progress.total
                                ? 'trackingWorkspace.upToDate'
                                : 'trackingWorkspace.gaps'
                            )
                          : t('watchingDashboard.noEpisodesHint'),
                      progress: t('trackingWorkspace.progress', {
                        watched: progress.watched,
                        total: progress.total,
                      }),
                      status: statusLabels[item.status] ?? item.status,
                      source: t(
                        item.series.origin === 'CURATED' &&
                          item.series.catalogScope === 'PERSONAL'
                          ? 'trackingWorkspace.curated'
                          : 'trackingWorkspace.viewing'
                      ),
                      lastActivity: item.lastWatchedAt
                        ? new Date(item.lastWatchedAt).toLocaleDateString(
                            locale,
                            { year: 'numeric', month: 'short', day: 'numeric' }
                          )
                        : t('common.neverWatched'),
                    }}
                  />
                );
              })}
            </div>
          ) : (
            !failed && (
              <EmptyState
                title={t(
                  items.length
                    ? 'trackingWorkspace.noResults'
                    : 'libraryWorkspace.empty'
                )}
                action={
                  items.length ? (
                    <Button
                      onClick={() => {
                        setSearch('');
                        setFilter('all');
                      }}
                    >
                      {t('trackingWorkspace.all')}
                    </Button>
                  ) : (
                    <Link href="/catalogo">
                      {t('watchingDashboard.exploreCatalog')}
                    </Link>
                  )
                }
              />
            )
          )}
        </>
      )}
    </div>
  );

  return (
    <div className="watching-workspace">
      <SectionHeader
        as="h1"
        size="lg"
        title={t('trackingWorkspace.title')}
        subtitle={t('trackingWorkspace.subtitle')}
        actions={<Link href="/perfil">{t('trackingWorkspace.settings')}</Link>}
      />
      <p className="watching-workspace__privacy">
        <LockOutlined /> {t('trackingWorkspace.privacy')}
      </p>
      {failed && (
        <Alert
          type="error"
          title={t('trackingWorkspace.loadError')}
          action={
            <Button onClick={() => void load()} icon={<ReloadOutlined />}>
              {t('trackingWorkspace.retry')}
            </Button>
          }
        />
      )}
      {preferencesFailed && (
        <Alert
          type="warning"
          title={t('libraryWorkspace.error')}
          action={
            <Button onClick={() => void reloadPreferences()}>
              {t('trackingWorkspace.retry')}
            </Button>
          }
        />
      )}
      <Tabs
        activeKey={tab}
        onChange={(value) => location.set('tab', value)}
        destroyOnHidden
        items={[
          {
            key: 'continue',
            label: t('libraryWorkspace.title'),
            icon: <PlayCircleOutlined />,
            children: list,
          },
          {
            key: 'history',
            label: t('trackingHistory.title'),
            children: (
              <TrackingHistory
                userId={userId}
                locale={locale}
                labels={{
                  expand: t('trackingHistory.expand'),
                  collapse: t('trackingHistory.collapse'),
                  loaded: t('trackingHistory.loaded'),
                  description: t('trackingHistory.description'),
                  search: t('trackingHistory.search'),
                  empty: t('trackingHistory.empty'),
                  error: t('trackingHistory.error'),
                  more: t('trackingHistory.more'),
                  refresh: t('trackingHistory.refresh'),
                  clear: t('trackingHistory.clear'),
                  clearConfirm: t('trackingHistory.clearConfirm'),
                  cancel: t('trackingHistory.cancel'),
                  watchDate: t('trackingHistory.watchDate'),
                  previousDate: t('trackingHistory.previousDate'),
                  unknown: t('trackingHistory.unknown'),
                  season: t('trackingHistory.season'),
                  episode: t('trackingHistory.episode'),
                  series: t('trackingHistory.series'),
                  note: t('trackingWorkspace.privateNote'),
                  comments: t('trackingWorkspace.publicComment'),
                  kinds: {
                    RECORDED: t('trackingHistory.recorded'),
                    STATUS_CHANGED: t('trackingHistory.changed'),
                    DATE_CHANGED: t('trackingHistory.dateChanged'),
                    SNAPSHOT: t('trackingHistory.snapshot'),
                  },
                  statuses: {
                    VISTA: t('viewStatus.vista'),
                    SIN_VER: t('viewStatus.sinVer'),
                    VIENDO: t('viewStatus.viendo'),
                    RETOMAR: t('viewStatus.retomar'),
                    ABANDONADA: t('viewStatus.abandonada'),
                  },
                }}
              />
            ),
          },
          {
            key: 'diary',
            label: t('trackingWorkspace.diary'),
            icon: <BookOutlined />,
            children: <MyDiaryWidget />,
          },
        ]}
        tabBarExtraContent={
          <Link href="/perfil/estadisticas">
            {t('trackingWorkspace.stats')}
          </Link>
        }
      />
      <WatchingEpisodeDrawer
        item={selected}
        onClose={() => {
          setSelected(null);
          void load();
        }}
        labels={{
          privacy: t('trackingWorkspace.privacy'),
          comments: t('trackingWorkspace.publicComment'),
          note: t('trackingWorkspace.privateNote'),
          season: (n) => t('trackingWorkspace.season', { n }),
        }}
      />
    </div>
  );
}
