'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Alert, Button, Empty, Pagination, Select, Skeleton } from 'antd';
import { useSession } from 'next-auth/react';
import { PanelCard } from '@/components/design-system/PanelCard/PanelCard';
import { StatCard } from '@/components/design-system/StatCard/StatCard';
import { useLocale } from '@/lib/providers/LocaleProvider';
import type { InsightsPeriod, TrackingInsights } from '@/lib/tracking-insights';
import './TrackingInsightsPage.css';

export function TrackingInsightsPage() {
  const { t, locale } = useLocale();
  const { data: session, status } = useSession();
  const [days, setDays] = useState<InsightsPeriod>(30);
  const [attempt, setAttempt] = useState(0);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<{
    owner: string;
    days: InsightsPeriod;
    data: TrackingInsights;
  } | null>(null);
  const [error, setError] = useState(false);
  const userId = session?.user?.id;
  const data =
    result?.owner === userId && result?.days === days ? result.data : null;
  useEffect(() => {
    if (!userId) return;
    const controller = new AbortController();
    fetch(`/api/user/tracking-stats?days=${days}`, {
      signal: controller.signal,
      cache: 'no-store',
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('STATS_UNAVAILABLE');
        const next: TrackingInsights = await response.json();
        if (!controller.signal.aborted)
          setResult({ owner: userId, days, data: next });
      })
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      });
    return () => controller.abort();
  }, [userId, days, attempt]);
  const format = (value: number) =>
    new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value);
  const date = (value: string) =>
    new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeZone: 'UTC',
    }).format(new Date(value));
  const retry = () => {
    setError(false);
    setResult(null);
    setAttempt((value) => value + 1);
  };
  return (
    <div className="mb-tracking-insights">
      <nav className="mb-tracking-insights__nav">
        <Link href="/watching">{t('trackingInsights.library')}</Link>
        <Link href="/perfil">{t('trackingInsights.profile')}</Link>
      </nav>
      <header>
        <h1>{t('trackingInsights.title')}</h1>
        <p>{t('trackingInsights.scope')}</p>
      </header>
      <label className="mb-tracking-insights__period">
        <span id="tracking-period-label">{t('trackingInsights.period')}</span>
        <Select
          aria-labelledby="tracking-period-label"
          value={days}
          options={[7, 30, 365].map((value) => ({
            value,
            label: t('trackingInsights.days', { count: value }),
          }))}
          onChange={(value: InsightsPeriod) => {
            setDays(value);
            setPage(1);
            setError(false);
          }}
        />
      </label>
      {status === 'unauthenticated' ? (
        <Alert type="info" description={t('trackingInsights.signIn')} />
      ) : error ? (
        <Alert
          type="error"
          description={t('trackingInsights.error')}
          action={
            <Button onClick={retry}>{t('trackingInsights.retry')}</Button>
          }
        />
      ) : !data ? (
        <Skeleton active />
      ) : (
        <>
          <p>
            {date(data.start)} — {date(data.end)}
            <br />
            {t('trackingInsights.comparison', {
              start: date(data.previousStart),
              end: date(data.previousEnd),
            })}
          </p>
          <div className="mb-tracking-insights__stats">
            {(['chapters', 'series', 'minutes'] as const).map((key) => (
              <StatCard
                key={key}
                label={t(`trackingInsights.${key}`)}
                value={format(data.current[key])}
                hint={t('trackingInsights.previous', {
                  count: format(data.previous[key]),
                  delta: format(data.current[key] - data.previous[key]),
                })}
              />
            ))}
          </div>
          <PanelCard>
            <details>
              <summary>{t('trackingInsights.coverage')}</summary>
              <p>
                {t('trackingInsights.unknownDates', {
                  count: data.unknownDates,
                })}
              </p>
              <p>
                {t('trackingInsights.unknownDurations', {
                  count: data.current.unknownDurations,
                })}
              </p>
              <p>{t('trackingInsights.method')}</p>
            </details>
          </PanelCard>
          <section>
            <h2>{t('trackingInsights.bySeries')}</h2>
            {!data.rows.length ? (
              <Empty description={t('trackingInsights.empty')} />
            ) : (
              <>
                <ul className="mb-tracking-insights__list">
                  {data.rows.slice((page - 1) * 10, page * 10).map((row) => (
                    <li key={row.id}>
                      <PanelCard>
                        <Link href={row.href}>{row.title}</Link>
                        <p>
                          {t('trackingInsights.row', {
                            chapters: row.chapters,
                            minutes: format(row.minutes),
                          })}
                        </p>
                        {row.completed && (
                          <span>{t('trackingInsights.completed')}</span>
                        )}
                      </PanelCard>
                    </li>
                  ))}
                </ul>
                <Pagination
                  current={page}
                  pageSize={10}
                  total={data.rows.length}
                  onChange={setPage}
                  showSizeChanger={false}
                  hideOnSinglePage
                />
              </>
            )}
          </section>
        </>
      )}
    </div>
  );
}
