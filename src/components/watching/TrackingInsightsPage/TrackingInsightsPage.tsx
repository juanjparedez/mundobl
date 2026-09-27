'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Alert, Button, Empty, Pagination, Select, Skeleton } from 'antd';
import { useSession } from 'next-auth/react';
import { PanelCard } from '@/components/design-system/PanelCard/PanelCard';
import { StatCard } from '@/components/design-system/StatCard/StatCard';
import { useLocale } from '@/lib/providers/LocaleProvider';
import type { InsightsPeriod, TrackingInsights } from '@/lib/tracking-insights';
import { InsightDistribution } from '../InsightDistribution/InsightDistribution';
import {
  insightDistribution,
  filterInsightRows,
  type InsightDimension,
  type InsightCategory,
} from '@/lib/insight-distributions';
import './TrackingInsightsPage.css';

export function TrackingInsightsPage() {
  const { t, locale } = useLocale();
  const { data: session, status } = useSession();
  const [days, setDays] = useState<InsightsPeriod>(30);
  const [attempt, setAttempt] = useState(0);
  const [filter, setFilter] = useState<{
    dimension: InsightDimension;
    key: string;
    label: string;
  } | null>(null);
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
  const filteredRows = filterInsightRows(data?.rows ?? [], filter);
  const categoryLabel = (
    dimension: InsightDimension,
    category: InsightCategory
  ) => {
    if (category.key === 'unknown') return t('insightDistribution.unknown');
    if (
      dimension === 'country' &&
      category.code &&
      /^[A-Z]{2}$/.test(category.code)
    ) {
      return (
        new Intl.DisplayNames([locale], { type: 'region' }).of(category.code) ??
        category.name
      );
    }
    if (dimension === 'type') {
      const labels: Record<string, string> = {
        serie: t('seriesForm.typeOption_serie'),
        pelicula: t('seriesForm.typeOption_pelicula'),
        corto: t('seriesForm.typeOption_corto'),
        especial: t('seriesForm.typeOption_especial'),
      };
      return labels[category.key] ?? category.name;
    }
    if (dimension === 'format') {
      if (category.key === 'regular')
        return t('seriesForm.formatOption_regular');
      if (category.key === 'vertical')
        return t('seriesForm.formatOption_vertical');
    }
    return category.name;
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
            setFilter(null);
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
          {data.rows.length > 0 && (
            <section>
              <h2>{t('insightDistribution.title')}</h2>
              <p>
                {t('insightDistribution.scope', { count: data.rows.length })}
              </p>
              <div className="mb-tracking-insights__distributions">
                {(['country', 'genre', 'type', 'format'] as const).map(
                  (dimension) => {
                    const categories = insightDistribution(
                      data.rows,
                      dimension
                    );
                    return (
                      <InsightDistribution
                        key={dimension}
                        title={t(`insightDistribution.${dimension}`)}
                        categories={categories}
                        total={data.rows.length}
                        locale={locale}
                        more={t('insightDistribution.more')}
                        label={(category) => categoryLabel(dimension, category)}
                        selected={
                          filter?.dimension === dimension ? filter.key : null
                        }
                        onSelect={(key) => {
                          const category = categories.find(
                            (item) => item.key === key
                          )!;
                          setFilter(
                            filter?.dimension === dimension &&
                              filter.key === key
                              ? null
                              : {
                                  dimension,
                                  key,
                                  label: categoryLabel(dimension, category),
                                }
                          );
                          setPage(1);
                          requestAnimationFrame(() =>
                            document
                              .getElementById('tracking-insights-results')
                              ?.focus()
                          );
                        }}
                      />
                    );
                  }
                )}
              </div>
            </section>
          )}
          <section>
            <h2 id="tracking-insights-results" tabIndex={-1}>
              {t('trackingInsights.bySeries')}
            </h2>
            {filter && (
              <div className="mb-tracking-insights__filter" role="status">
                <span>
                  {filter.label} · {filteredRows.length}
                </span>
                <Button
                  onClick={() => {
                    setFilter(null);
                    setPage(1);
                  }}
                >
                  {t('insightDistribution.clear')}
                </Button>
              </div>
            )}
            {!data.rows.length ? (
              <Empty description={t('trackingInsights.empty')} />
            ) : (
              <>
                <ul className="mb-tracking-insights__list">
                  {filteredRows.slice((page - 1) * 10, page * 10).map((row) => (
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
                  total={filteredRows.length}
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
