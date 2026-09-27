'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Alert, Button, Input, Popconfirm, Skeleton, Tag } from 'antd';
import { EmptyState, PanelCard } from '@/components/design-system';
import { useWatchingLocation } from '@/hooks/useWatchingLocation';
import { useWatchingScroll } from '@/hooks/useWatchingScroll';
import { HistoryEpisodeActions } from '../HistoryEpisodeActions/HistoryEpisodeActions';
import type {
  TrackingHistoryItem,
  TrackingHistoryPage,
} from '@/lib/tracking-history';
import './TrackingHistory.css';

interface Props {
  userId: string;
  locale: string;
  labels: {
    description: string;
    search: string;
    empty: string;
    error: string;
    more: string;
    refresh: string;
    clear: string;
    clearConfirm: string;
    cancel: string;
    watchDate: string;
    previousDate: string;
    unknown: string;
    season: string;
    episode: string;
    series: string;
    note: string;
    comments: string;
    kinds: Record<TrackingHistoryItem['kind'], string>;
    statuses: Record<TrackingHistoryItem['status'], string>;
  };
}

export function TrackingHistory({ userId, locale, labels }: Props) {
  const [items, setItems] = useState<TrackingHistoryItem[]>([]);
  const [cursor, setCursor] = useState<TrackingHistoryPage['nextCursor']>(null);
  const location = useWatchingLocation();
  const search = location.params.get('historyQ') ?? '';
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const request = useRef<AbortController | null>(null);
  const loadedPages = useRef(1);
  useWatchingScroll(
    userId,
    location.params.get('tab') === 'history' && !loading && !failed
  );

  const load = useCallback(
    async (next?: TrackingHistoryPage['nextCursor']) => {
      request.current?.abort();
      const controller = new AbortController();
      request.current = controller;
      setLoading(true);
      setFailed(false);
      try {
        const requested = Number(
          new URLSearchParams(window.location.search).get('historyPages')
        );
        const pageCount =
          !next && Number.isInteger(requested) && requested > 1
            ? Math.min(requested, 20)
            : 1;
        const restored: TrackingHistoryItem[] = [];
        let nextCursor = next ?? null;
        let fetched = 0;
        do {
          const query = new URLSearchParams({ q: search });
          if (nextCursor) {
            query.set('cursorId', nextCursor.id);
            query.set('cursorDate', nextCursor.recordedAt);
          }
          const response = await fetch(`/api/user/tracking-history?${query}`, {
            signal: controller.signal,
          });
          if (!response.ok) throw new Error();
          const page: TrackingHistoryPage = await response.json();
          if (!Array.isArray(page.items)) throw new Error();
          restored.push(...page.items);
          nextCursor = page.nextCursor;
          fetched++;
        } while (!next && nextCursor && fetched < pageCount);
        if (!controller.signal.aborted) {
          setItems((previous) =>
            next
              ? [
                  ...new Map(
                    [...previous, ...restored].map((item) => [item.id, item])
                  ).values(),
                ]
              : [...new Map(restored.map((item) => [item.id, item])).values()]
          );
          setCursor(nextCursor);
          loadedPages.current = next ? loadedPages.current + 1 : fetched;
          return true;
        }
        return false;
      } catch {
        if (!controller.signal.aborted) setFailed(true);
        return false;
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    },
    [search]
  );

  useEffect(() => {
    void load();
    return () => request.current?.abort();
  }, [load]);

  async function clear() {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setLoading(true);
    setFailed(false);
    try {
      const response = await fetch('/api/user/tracking-history', {
        method: 'DELETE',
        signal: controller.signal,
      });
      if (!response.ok) throw new Error();
      if (!controller.signal.aborted) {
        setItems([]);
        setCursor(null);
        location.set('historyPages', '');
      }
    } catch {
      if (!controller.signal.aborted) setFailed(true);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }

  const date = (value: string | null) =>
    value
      ? new Date(value).toLocaleString(locale, {
          dateStyle: 'medium',
          timeStyle: 'short',
        })
      : labels.unknown;

  // User-selected watch dates use UTC calendar days, matching the date editor.
  // Event timestamps above remain local instants showing when the change happened.
  const watchDate = (value: string | null) =>
    value
      ? new Date(value).toLocaleDateString(locale, {
          dateStyle: 'medium',
          timeZone: 'UTC',
        })
      : labels.unknown;

  // The destination identifies the work even when two series share a title.
  // Preserve API chronology within each group and merge subsequent pages.
  const groups = new Map<string, TrackingHistoryItem[]>();
  for (const item of items) {
    const key = item.href.split(/[?#]/)[0];
    const group = groups.get(key) ?? [];
    group.push(item);
    groups.set(key, group);
  }

  return (
    <section className="tracking-history">
      <p className="tracking-history__description">{labels.description}</p>
      <div className="tracking-history__toolbar">
        <Input.Search
          allowClear
          maxLength={100}
          placeholder={labels.search}
          aria-label={labels.search}
          defaultValue={search}
          onSearch={(value) => location.set('historyQ', value)}
        />
        <Button disabled={loading} onClick={() => void load()}>
          {labels.refresh}
        </Button>
        <Popconfirm
          title={labels.clearConfirm}
          okText={labels.clear}
          cancelText={labels.cancel}
          onConfirm={clear}
        >
          <Button danger disabled={loading || items.length === 0}>
            {labels.clear}
          </Button>
        </Popconfirm>
      </div>
      {failed && <Alert type="error" showIcon title={labels.error} />}
      {loading && items.length === 0 ? (
        <Skeleton active />
      ) : !failed && items.length === 0 ? (
        <EmptyState title={labels.empty} fullHeight={false} />
      ) : null}
      <div className="tracking-history__groups">
        {[...groups].map(([href, events]) => (
          <PanelCard key={href} padding="md">
            <h2 className="tracking-history__series">
              <Link href={href}>{events[0].seriesTitle}</Link>
            </h2>
            <ol className="tracking-history__list">
              {events.map((item) => (
                <li key={item.id}>
                  {item.kind !== 'SNAPSHOT' && (
                    <div className="tracking-history__heading">
                      <time dateTime={item.recordedAt}>
                        {date(item.recordedAt)}
                      </time>
                    </div>
                  )}
                  <p>
                    {item.episodeNumber !== null
                      ? labels.episode
                          .replace('{season}', String(item.seasonNumber))
                          .replace('{episode}', String(item.episodeNumber))
                      : item.seasonNumber !== null
                        ? labels.season.replace(
                            '{n}',
                            String(item.seasonNumber)
                          )
                        : labels.series}
                  </p>
                  <div className="tracking-history__state">
                    <span>{labels.kinds[item.kind]}</span>
                    {item.previousStatus &&
                      item.previousStatus !== item.status && (
                        <>
                          <Tag>{labels.statuses[item.previousStatus]}</Tag>
                          <span aria-hidden="true">→</span>
                        </>
                      )}
                    <Tag>{labels.statuses[item.status]}</Tag>
                  </div>
                  {(item.status === 'VISTA' || item.watchedDate) && (
                    <p>
                      {labels.watchDate}: {watchDate(item.watchedDate)}
                    </p>
                  )}
                  {item.kind === 'DATE_CHANGED' && (
                    <p>
                      {labels.previousDate}:{' '}
                      {watchDate(item.previousWatchedDate)}
                    </p>
                  )}
                  {item.chapterTarget && (
                    <HistoryEpisodeActions
                      episodeId={item.chapterTarget.episodeId}
                      chapterLabel={`${item.seriesTitle} · ${labels.episode
                        .replace('{season}', String(item.seasonNumber))
                        .replace(
                          '{episode}',
                          String(item.chapterTarget.chapterNumber)
                        )}`}
                      labels={labels}
                    />
                  )}
                </li>
              ))}
            </ol>
          </PanelCard>
        ))}
      </div>
      {cursor && (
        <Button
          loading={loading}
          onClick={async () => {
            if (await load(cursor)) {
              location.set(
                'historyPages',
                String(Math.min(loadedPages.current, 20))
              );
            }
          }}
        >
          {labels.more}
        </Button>
      )}
    </section>
  );
}
