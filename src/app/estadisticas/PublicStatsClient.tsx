'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, Empty, Segmented, Spin, Tooltip } from 'antd';
import {
  AppstoreOutlined,
  BarsOutlined,
  BarChartOutlined,
  CommentOutlined,
  EyeOutlined,
  GlobalOutlined,
  TeamOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';
import { useLocale } from '@/lib/providers/LocaleProvider';
import './public-stats.css';

interface PublicStatsResponse {
  generatedAt: string;
  summary: {
    totalSeries: number;
    totalPublicComments: number;
    totalCompletedViews: number;
    totalActors: number;
    totalDirectors: number;
  };
  rankings: {
    topSeries: Array<{ seriesId: number; title: string; count: number }>;
    topActors: Array<{ actorId: number; name: string; count: number }>;
    topProductionCompanies: Array<{ name: string; count: number }>;
    topCountries: Array<{ name: string; count: number }>;
    byType: Array<{ type: string; count: number }>;
  };
  catalog: {
    byCountry: Array<{ name: string; count: number }>;
    byType: Array<{ type: string; count: number }>;
    byGenre: Array<{ name: string; count: number }>;
    byYear: Array<{ year: number; count: number }>;
  };
}

type ChartMode = 'bar' | 'list';

const CHART_MODE_KEY = 'public-stats-chart-mode';

// ─── Reusable chart components ────────────────────────────────────

function HorizontalBar({
  items,
  renderLabel,
  renderValue,
  empty,
  accentColor,
}: {
  items: Array<{ key: string; count: number; href?: string; pos?: number }>;
  renderLabel: (item: { key: string; href?: string }) => React.ReactNode;
  renderValue: (item: { key: string; count: number }) => React.ReactNode;
  empty: string;
  accentColor?: string;
}) {
  if (items.length === 0)
    return <Empty description={empty} image={Empty.PRESENTED_IMAGE_SIMPLE} />;

  const max = items[0]?.count ?? 1;

  return (
    <ol className="public-stats-ranking-list">
      {items.map((item, index) => {
        const pos = item.pos ?? index + 1;
        return (
          <li
            key={`${item.key}-${index}`}
            className="public-stats-ranking-item"
            data-pos={pos}
          >
            <div className="public-stats-ranking-item__row">
              <span className="public-stats-ranking-item__pos">{pos}</span>
              <span className="public-stats-ranking-item__label">
                {renderLabel(item)}
              </span>
              <span className="public-stats-ranking-item__value">
                {renderValue(item)}
              </span>
            </div>
            <div className="public-stats-ranking-item__bar-track">
              <div
                className="public-stats-ranking-item__bar-fill"
                style={
                  {
                    '--bar-pct': `${Math.round((item.count / max) * 100)}%`,
                    ...(accentColor ? { '--bar-accent': accentColor } : {}),
                  } as React.CSSProperties
                }
              />
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function SimpleList({
  items,
  renderLabel,
  renderValue,
  empty,
}: {
  items: Array<{ key: string; count: number; href?: string }>;
  renderLabel: (item: { key: string; href?: string }) => React.ReactNode;
  renderValue: (item: { key: string; count: number }) => React.ReactNode;
  empty: string;
}) {
  if (items.length === 0)
    return <Empty description={empty} image={Empty.PRESENTED_IMAGE_SIMPLE} />;

  return (
    <ul className="public-stats-simple-list">
      {items.map((item, i) => (
        <li key={`${item.key}-${i}`} className="public-stats-simple-list__item">
          <span className="public-stats-simple-list__label">
            {renderLabel(item)}
          </span>
          <span className="public-stats-simple-list__value">
            {renderValue(item)}
          </span>
        </li>
      ))}
    </ul>
  );
}

function YearHistogram({
  items,
  locale,
  empty,
}: {
  items: Array<{ year: number; count: number }>;
  locale: string;
  empty: string;
}) {
  if (items.length === 0)
    return <Empty description={empty} image={Empty.PRESENTED_IMAGE_SIMPLE} />;

  const sorted = [...items].sort((a, b) => a.year - b.year);
  const max = Math.max(...sorted.map((r) => r.count));

  return (
    <div className="public-stats-year-histogram">
      {sorted.map((r) => (
        <Tooltip
          key={r.year}
          title={`${r.year}: ${r.count.toLocaleString(locale)}`}
        >
          <div className="public-stats-year-histogram__col">
            <div
              className="public-stats-year-histogram__bar"
              style={{
                height: `${Math.max(4, Math.round((r.count / max) * 80))}px`,
              }}
            />
            <span className="public-stats-year-histogram__year">{r.year}</span>
          </div>
        </Tooltip>
      ))}
    </div>
  );
}

// ─── Switchable chart card ────────────────────────────────────────

function ChartCard({
  title,
  icon,
  chartMode,
  onChartModeChange,
  barContent,
  listContent,
}: {
  title: string;
  icon?: React.ReactNode;
  chartMode: ChartMode;
  onChartModeChange: (mode: ChartMode) => void;
  barContent: React.ReactNode;
  listContent: React.ReactNode;
}) {
  return (
    <Card
      title={
        <div className="public-stats-card-header">
          {icon && (
            <span className="public-stats-card-header__icon">{icon}</span>
          )}
          <span>{title}</span>
          <div className="public-stats-card-header__toggle">
            <Segmented<ChartMode>
              size="small"
              value={chartMode}
              onChange={onChartModeChange}
              options={[
                { value: 'bar', icon: <BarChartOutlined /> },
                { value: 'list', icon: <BarsOutlined /> },
              ]}
            />
          </div>
        </div>
      }
    >
      {chartMode === 'bar' ? barContent : listContent}
    </Card>
  );
}

// ─── Main component ───────────────────────────────────────────────

export function PublicStatsClient() {
  const { locale } = useLocale();
  const [data, setData] = useState<PublicStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartMode, setChartMode] = useState<ChartMode>(() => {
    if (typeof window === 'undefined') return 'bar';
    return (localStorage.getItem(CHART_MODE_KEY) as ChartMode | null) ?? 'bar';
  });

  const persistChartMode = useCallback((mode: ChartMode) => {
    setChartMode(mode);
    if (typeof window !== 'undefined')
      localStorage.setItem(CHART_MODE_KEY, mode);
  }, []);

  const copy = useMemo(
    () =>
      locale === 'en'
        ? {
            title: 'Global Community Stats',
            subtitle:
              'Anonymous metrics aggregated across the platform. No personal data is exposed.',
            loading: 'Loading stats…',
            empty: 'No data yet',
            updatedAt: 'Updated',
            sectionActivity: 'Community activity',
            sectionCatalog: 'Catalog breakdown',
            cardSeries: 'Series in catalog',
            cardPublicComments: 'Public comments',
            cardCompletedViews: 'Completed views',
            cardActors: 'Actors',
            cardDirectors: 'Directors',
            topSeries: 'Most watched series',
            topActors: 'Most watched actors',
            topProductionCompanies: 'Top production companies',
            topCountries: 'Most watched countries',
            byType: 'Views by content type',
            catalogByCountry: 'Series by country',
            catalogByType: 'Series by type',
            catalogByGenre: 'Series by genre',
            catalogByYear: 'Series by release year',
            timesWatched: 'times',
          }
        : {
            title: 'Estadísticas Globales de la Comunidad',
            subtitle:
              'Métricas anónimas agregadas de toda la plataforma. No se exponen datos personales.',
            loading: 'Cargando estadísticas…',
            empty: 'Sin datos todavía',
            updatedAt: 'Actualizado',
            sectionActivity: 'Actividad de la comunidad',
            sectionCatalog: 'Desglose del catálogo',
            cardSeries: 'Series en catálogo',
            cardPublicComments: 'Comentarios públicos',
            cardCompletedViews: 'Visualizaciones completadas',
            cardActors: 'Actores',
            cardDirectors: 'Directores',
            topSeries: 'Series más vistas',
            topActors: 'Actores más vistos',
            topProductionCompanies: 'Productoras más vistas',
            topCountries: 'Países más vistos',
            byType: 'Visualizaciones por tipo',
            catalogByCountry: 'Series por país',
            catalogByType: 'Series por tipo',
            catalogByGenre: 'Series por género',
            catalogByYear: 'Series por año de estreno',
            timesWatched: 'veces',
          },
    [locale]
  );

  useEffect(() => {
    let cancelled = false;
    fetch('/api/stats/public')
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load');
        return r.json() as Promise<PublicStatsResponse>;
      })
      .then((payload) => {
        if (!cancelled) setData(payload);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="public-stats-loading">
        <Spin size="large" tip={copy.loading} />
      </div>
    );
  }

  if (!data) {
    return (
      <Empty description={copy.empty} image={Empty.PRESENTED_IMAGE_SIMPLE} />
    );
  }

  const renderCount = (item: { count: number }) =>
    item.count.toLocaleString(locale);

  const renderSeriesLabel = (item: { key: string; href?: string }) =>
    item.href ? <Link href={item.href}>{item.key}</Link> : item.key;

  const renderPlainLabel = (item: { key: string }) => item.key;

  return (
    <div className="public-stats-page">
      <header className="public-stats-hero">
        <h1 className="public-stats-hero__title">{copy.title}</h1>
        <p className="public-stats-hero__subtitle">{copy.subtitle}</p>
        <p className="public-stats-hero__updated">
          {copy.updatedAt}: {new Date(data.generatedAt).toLocaleString(locale)}
        </p>
      </header>

      {/* ── Summary KPIs ── */}
      <section className="public-stats-summary">
        <Card className="public-stats-summary__card" data-variant="series">
          <AppstoreOutlined className="public-stats-summary__card-icon" />
          <strong>{data.summary.totalSeries.toLocaleString(locale)}</strong>
          <span>{copy.cardSeries}</span>
        </Card>
        <Card className="public-stats-summary__card" data-variant="views">
          <EyeOutlined className="public-stats-summary__card-icon" />
          <strong>
            {data.summary.totalCompletedViews.toLocaleString(locale)}
          </strong>
          <span>{copy.cardCompletedViews}</span>
        </Card>
        <Card className="public-stats-summary__card" data-variant="comments">
          <CommentOutlined className="public-stats-summary__card-icon" />
          <strong>
            {data.summary.totalPublicComments.toLocaleString(locale)}
          </strong>
          <span>{copy.cardPublicComments}</span>
        </Card>
        <Card className="public-stats-summary__card" data-variant="actors">
          <TeamOutlined className="public-stats-summary__card-icon" />
          <strong>{data.summary.totalActors.toLocaleString(locale)}</strong>
          <span>{copy.cardActors}</span>
        </Card>
        <Card className="public-stats-summary__card" data-variant="directors">
          <VideoCameraOutlined className="public-stats-summary__card-icon" />
          <strong>{data.summary.totalDirectors.toLocaleString(locale)}</strong>
          <span>{copy.cardDirectors}</span>
        </Card>
      </section>

      {/* ── Community activity section ── */}
      <h2 className="public-stats-section-title">{copy.sectionActivity}</h2>
      <section className="public-stats-grid">
        <ChartCard
          title={copy.topSeries}
          icon={<EyeOutlined />}
          chartMode={chartMode}
          onChartModeChange={persistChartMode}
          barContent={
            <HorizontalBar
              items={data.rankings.topSeries.map((r) => ({
                key: r.title,
                count: r.count,
                href: `/series/${r.seriesId}`,
              }))}
              renderLabel={renderSeriesLabel}
              renderValue={(item) =>
                `${renderCount(item)} ${copy.timesWatched}`
              }
              empty={copy.empty}
            />
          }
          listContent={
            <SimpleList
              items={data.rankings.topSeries.map((r) => ({
                key: r.title,
                count: r.count,
                href: `/series/${r.seriesId}`,
              }))}
              renderLabel={renderSeriesLabel}
              renderValue={(item) =>
                `${renderCount(item)} ${copy.timesWatched}`
              }
              empty={copy.empty}
            />
          }
        />

        <ChartCard
          title={copy.topActors}
          icon={<TeamOutlined />}
          chartMode={chartMode}
          onChartModeChange={persistChartMode}
          barContent={
            <HorizontalBar
              items={data.rankings.topActors.map((r) => ({
                key: r.name,
                count: r.count,
                href: `/actores/${r.actorId}`,
              }))}
              renderLabel={renderSeriesLabel}
              renderValue={(item) =>
                `${renderCount(item)} ${copy.timesWatched}`
              }
              empty={copy.empty}
            />
          }
          listContent={
            <SimpleList
              items={data.rankings.topActors.map((r) => ({
                key: r.name,
                count: r.count,
                href: `/actores/${r.actorId}`,
              }))}
              renderLabel={renderSeriesLabel}
              renderValue={(item) =>
                `${renderCount(item)} ${copy.timesWatched}`
              }
              empty={copy.empty}
            />
          }
        />

        <ChartCard
          title={copy.topProductionCompanies}
          icon={<AppstoreOutlined />}
          chartMode={chartMode}
          onChartModeChange={persistChartMode}
          barContent={
            <HorizontalBar
              items={data.rankings.topProductionCompanies.map((r) => ({
                key: r.name,
                count: r.count,
              }))}
              renderLabel={renderPlainLabel}
              renderValue={renderCount}
              empty={copy.empty}
            />
          }
          listContent={
            <SimpleList
              items={data.rankings.topProductionCompanies.map((r) => ({
                key: r.name,
                count: r.count,
              }))}
              renderLabel={renderPlainLabel}
              renderValue={renderCount}
              empty={copy.empty}
            />
          }
        />

        <ChartCard
          title={copy.topCountries}
          icon={<GlobalOutlined />}
          chartMode={chartMode}
          onChartModeChange={persistChartMode}
          barContent={
            <HorizontalBar
              items={data.rankings.topCountries.map((r) => ({
                key: r.name,
                count: r.count,
              }))}
              renderLabel={renderPlainLabel}
              renderValue={(item) =>
                `${renderCount(item)} ${copy.timesWatched}`
              }
              empty={copy.empty}
            />
          }
          listContent={
            <SimpleList
              items={data.rankings.topCountries.map((r) => ({
                key: r.name,
                count: r.count,
              }))}
              renderLabel={renderPlainLabel}
              renderValue={(item) =>
                `${renderCount(item)} ${copy.timesWatched}`
              }
              empty={copy.empty}
            />
          }
        />

        <Card title={copy.byType} className="public-stats-grid__full">
          <HorizontalBar
            items={data.rankings.byType.map((r) => ({
              key: r.type,
              count: r.count,
            }))}
            renderLabel={renderPlainLabel}
            renderValue={(item) => `${renderCount(item)} ${copy.timesWatched}`}
            empty={copy.empty}
            accentColor="var(--primary-color-hover)"
          />
        </Card>
      </section>

      {/* ── Catalog breakdown section ── */}
      <h2 className="public-stats-section-title">{copy.sectionCatalog}</h2>
      <section className="public-stats-grid">
        <ChartCard
          title={copy.catalogByCountry}
          icon={<GlobalOutlined />}
          chartMode={chartMode}
          onChartModeChange={persistChartMode}
          barContent={
            <HorizontalBar
              items={data.catalog.byCountry.map((r) => ({
                key: r.name,
                count: r.count,
              }))}
              renderLabel={renderPlainLabel}
              renderValue={renderCount}
              empty={copy.empty}
              accentColor="#10b981"
            />
          }
          listContent={
            <SimpleList
              items={data.catalog.byCountry.map((r) => ({
                key: r.name,
                count: r.count,
              }))}
              renderLabel={renderPlainLabel}
              renderValue={renderCount}
              empty={copy.empty}
            />
          }
        />

        <ChartCard
          title={copy.catalogByGenre}
          icon={<AppstoreOutlined />}
          chartMode={chartMode}
          onChartModeChange={persistChartMode}
          barContent={
            <HorizontalBar
              items={data.catalog.byGenre.map((r) => ({
                key: r.name,
                count: r.count,
              }))}
              renderLabel={renderPlainLabel}
              renderValue={renderCount}
              empty={copy.empty}
              accentColor="#8b5cf6"
            />
          }
          listContent={
            <SimpleList
              items={data.catalog.byGenre.map((r) => ({
                key: r.name,
                count: r.count,
              }))}
              renderLabel={renderPlainLabel}
              renderValue={renderCount}
              empty={copy.empty}
            />
          }
        />

        <Card
          title={copy.catalogByType}
          className="public-stats-grid__full public-stats-grid__compact"
        >
          <HorizontalBar
            items={data.catalog.byType.map((r) => ({
              key: r.type,
              count: r.count,
            }))}
            renderLabel={renderPlainLabel}
            renderValue={renderCount}
            empty={copy.empty}
            accentColor="#f59e0b"
          />
        </Card>

        <Card title={copy.catalogByYear} className="public-stats-grid__full">
          <YearHistogram
            items={data.catalog.byYear}
            locale={locale}
            empty={copy.empty}
          />
        </Card>
      </section>
    </div>
  );
}
