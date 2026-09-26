'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Alert, Button, Input, Popconfirm, Skeleton, Tag } from 'antd';
import { EmptyState, PanelCard } from '@/components/design-system';
import type {
  TrackingHistoryItem,
  TrackingHistoryPage,
} from '@/lib/tracking-history';
import './TrackingHistory.css';

interface Props {
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
    kinds: Record<TrackingHistoryItem['kind'], string>;
    statuses: Record<TrackingHistoryItem['status'], string>;
  };
}

export function TrackingHistory({ locale, labels }: Props) {
  const [items, setItems] = useState<TrackingHistoryItem[]>([]);
  const [cursor, setCursor] = useState<TrackingHistoryPage['nextCursor']>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const request = useRef<AbortController | null>(null);

  const load = useCallback(
    async (next?: TrackingHistoryPage['nextCursor']) => {
      request.current?.abort();
      const controller = new AbortController();
      request.current = controller;
      setLoading(true);
      setFailed(false);
      try {
        const query = new URLSearchParams({ q: search });
        if (next) {
          query.set('cursorId', next.id);
          query.set('cursorDate', next.recordedAt);
        }
        const response = await fetch(`/api/user/tracking-history?${query}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error();
        const page: TrackingHistoryPage = await response.json();
        if (!Array.isArray(page.items)) throw new Error();
        if (!controller.signal.aborted) {
          setItems((previous) =>
            next
              ? [
                  ...new Map(
                    [...previous, ...page.items].map((item) => [item.id, item])
                  ).values(),
                ]
              : page.items
          );
          setCursor(page.nextCursor);
        }
      } catch {
        if (!controller.signal.aborted) setFailed(true);
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

  return (
    <section className="tracking-history">
      <p className="tracking-history__description">{labels.description}</p>
      <div className="tracking-history__toolbar">
        <Input.Search
          allowClear
          maxLength={100}
          placeholder={labels.search}
          aria-label={labels.search}
          onSearch={setSearch}
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
      <ol className="tracking-history__list">
        {items.map((item) => (
          <li key={item.id}>
            <PanelCard padding="sm">
              <div className="tracking-history__heading">
                <Link href={item.href}>{item.seriesTitle}</Link>
                {item.kind !== 'SNAPSHOT' && (
                  <time dateTime={item.recordedAt}>
                    {date(item.recordedAt)}
                  </time>
                )}
              </div>
              <p>
                {item.episodeNumber !== null
                  ? labels.episode
                      .replace('{season}', String(item.seasonNumber))
                      .replace('{episode}', String(item.episodeNumber))
                  : item.seasonNumber !== null
                    ? labels.season.replace('{n}', String(item.seasonNumber))
                    : labels.series}
              </p>
              <div className="tracking-history__state">
                <span>{labels.kinds[item.kind]}</span>
                {item.previousStatus && item.previousStatus !== item.status && (
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
                  {labels.previousDate}: {watchDate(item.previousWatchedDate)}
                </p>
              )}
            </PanelCard>
          </li>
        ))}
      </ol>
      {cursor && (
        <Button loading={loading} onClick={() => void load(cursor)}>
          {labels.more}
        </Button>
      )}
    </section>
  );
}
