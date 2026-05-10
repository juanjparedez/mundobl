'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Empty, Segmented, Spin } from 'antd';
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
import { BarChart, DonutChart } from '@/components/charts';
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

/** Trunca el label cuando es muy largo para que entre en el eje del
 *  chart sin romper layout. Mantiene los primeros 22 chars + ellipsis. */
function truncate(label: string, max = 22): string {
  return label.length > max ? `${label.slice(0, max - 1)}…` : label;
}

interface RankingItem {
  key: string;
  count: number;
  href?: string;
}

/** Bar chart horizontal usando la libreria recharts. Reemplaza la lista
 *  custom con barras simuladas que habia antes — ahora si hay una
 *  visualizacion real con ejes, tooltips, etc. */
function RankingBarChart({
  items,
  empty,
}: {
  items: RankingItem[];
  empty: string;
}) {
  if (items.length === 0) {
    return <div className="app-panel__empty">{empty}</div>;
  }
  const top = items.slice(0, 10);
  const data = top.map((it) => ({
    label: truncate(it.key),
    fullLabel: it.key,
    count: it.count,
  }));
  // Altura proporcional al numero de barras para que no queden apretadas.
  const height = Math.max(180, top.length * 28 + 30);
  return (
    <BarChart
      data={data}
      xAxisKey="label"
      series={[{ dataKey: 'count', name: 'Total' }]}
      horizontal
      multicolor
      height={height}
    />
  );
}

/** Lista compacta cuando el user prefiere vista de lista en lugar de chart. */
function RankingList({
  items,
  empty,
  unit,
  formatNumber,
}: {
  items: RankingItem[];
  empty: string;
  unit?: string;
  formatNumber: (n: number) => string;
}) {
  if (items.length === 0) {
    return <div className="app-panel__empty">{empty}</div>;
  }
  return (
    <ol className="public-stats-list">
      {items.map((it, idx) => (
        <li key={`${it.key}-${idx}`} className="public-stats-list__row">
          <span className="public-stats-list__pos">{idx + 1}</span>
          <span className="public-stats-list__label">
            {it.href ? <Link href={it.href}>{it.key}</Link> : it.key}
          </span>
          <span className="public-stats-list__value">
            {formatNumber(it.count)}
            {unit ? ` ${unit}` : ''}
          </span>
        </li>
      ))}
    </ol>
  );
}

interface RankingPanelProps {
  title: string;
  icon: React.ReactNode;
  items: RankingItem[];
  empty: string;
  unit?: string;
  chartMode: ChartMode;
  onChartModeChange: (mode: ChartMode) => void;
  formatNumber: (n: number) => string;
}

function RankingPanel({
  title,
  icon,
  items,
  empty,
  unit,
  chartMode,
  onChartModeChange,
  formatNumber,
}: RankingPanelProps) {
  return (
    <section className="app-panel">
      <header className="app-panel__header">
        <h3 className="app-panel__title">
          {icon} {title}
        </h3>
        <Segmented<ChartMode>
          size="small"
          value={chartMode}
          onChange={onChartModeChange}
          options={[
            { value: 'bar', icon: <BarChartOutlined /> },
            { value: 'list', icon: <BarsOutlined /> },
          ]}
        />
      </header>
      <div className="app-panel__body">
        {chartMode === 'bar' ? (
          <RankingBarChart items={items} empty={empty} />
        ) : (
          <RankingList
            items={items}
            empty={empty}
            unit={unit}
            formatNumber={formatNumber}
          />
        )}
      </div>
    </section>
  );
}

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
    if (typeof window !== 'undefined') {
      localStorage.setItem(CHART_MODE_KEY, mode);
    }
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
        <Spin size="large" />
        <span>{copy.loading}</span>
      </div>
    );
  }

  if (!data) {
    return (
      <Empty description={copy.empty} image={Empty.PRESENTED_IMAGE_SIMPLE} />
    );
  }

  const fmt = (n: number) => n.toLocaleString(locale);

  return (
    <div className="public-stats-page app-page">
      <header className="public-stats-hero">
        <h1 className="public-stats-hero__title">{copy.title}</h1>
        <p className="public-stats-hero__subtitle">{copy.subtitle}</p>
        <p className="public-stats-hero__updated">
          {copy.updatedAt}: {new Date(data.generatedAt).toLocaleString(locale)}
        </p>
      </header>

      {/* ── KPI summary tiles ── */}
      <section className="public-stats-summary">
        {[
          {
            icon: <AppstoreOutlined />,
            value: data.summary.totalSeries,
            label: copy.cardSeries,
          },
          {
            icon: <EyeOutlined />,
            value: data.summary.totalCompletedViews,
            label: copy.cardCompletedViews,
          },
          {
            icon: <CommentOutlined />,
            value: data.summary.totalPublicComments,
            label: copy.cardPublicComments,
          },
          {
            icon: <TeamOutlined />,
            value: data.summary.totalActors,
            label: copy.cardActors,
          },
          {
            icon: <VideoCameraOutlined />,
            value: data.summary.totalDirectors,
            label: copy.cardDirectors,
          },
        ].map((kpi) => (
          <div key={kpi.label} className="public-stats-kpi">
            <span className="public-stats-kpi__icon" aria-hidden>
              {kpi.icon}
            </span>
            <span className="public-stats-kpi__value">{fmt(kpi.value)}</span>
            <span className="public-stats-kpi__label">{kpi.label}</span>
          </div>
        ))}
      </section>

      {/* ── Community activity ── */}
      <h2 className="public-stats-section-title">{copy.sectionActivity}</h2>
      <div className="app-page__row app-page__row--2">
        <RankingPanel
          title={copy.topSeries}
          icon={<EyeOutlined />}
          items={data.rankings.topSeries.map((r) => ({
            key: r.title,
            count: r.count,
            href: `/series/${r.seriesId}`,
          }))}
          empty={copy.empty}
          unit={copy.timesWatched}
          chartMode={chartMode}
          onChartModeChange={persistChartMode}
          formatNumber={fmt}
        />
        <RankingPanel
          title={copy.topActors}
          icon={<TeamOutlined />}
          items={data.rankings.topActors.map((r) => ({
            key: r.name,
            count: r.count,
            href: `/actores/${r.actorId}`,
          }))}
          empty={copy.empty}
          unit={copy.timesWatched}
          chartMode={chartMode}
          onChartModeChange={persistChartMode}
          formatNumber={fmt}
        />
        <RankingPanel
          title={copy.topProductionCompanies}
          icon={<AppstoreOutlined />}
          items={data.rankings.topProductionCompanies.map((r) => ({
            key: r.name,
            count: r.count,
          }))}
          empty={copy.empty}
          chartMode={chartMode}
          onChartModeChange={persistChartMode}
          formatNumber={fmt}
        />
        <RankingPanel
          title={copy.topCountries}
          icon={<GlobalOutlined />}
          items={data.rankings.topCountries.map((r) => ({
            key: r.name,
            count: r.count,
          }))}
          empty={copy.empty}
          unit={copy.timesWatched}
          chartMode={chartMode}
          onChartModeChange={persistChartMode}
          formatNumber={fmt}
        />
      </div>

      <section className="app-panel">
        <header className="app-panel__header">
          <h3 className="app-panel__title">
            <AppstoreOutlined /> {copy.byType}
          </h3>
        </header>
        <div className="app-panel__body">
          {data.rankings.byType.length === 0 ? (
            <div className="app-panel__empty">{copy.empty}</div>
          ) : (
            <DonutChart
              data={data.rankings.byType.map((r) => ({
                name: r.type,
                value: r.count,
              }))}
              centerLabel={{
                value: data.rankings.byType.reduce((s, r) => s + r.count, 0),
                sublabel: copy.timesWatched,
              }}
              height={220}
              showLegend
            />
          )}
        </div>
      </section>

      {/* ── Catalog breakdown ── */}
      <h2 className="public-stats-section-title">{copy.sectionCatalog}</h2>
      <div className="app-page__row app-page__row--2">
        <RankingPanel
          title={copy.catalogByCountry}
          icon={<GlobalOutlined />}
          items={data.catalog.byCountry.map((r) => ({
            key: r.name,
            count: r.count,
          }))}
          empty={copy.empty}
          chartMode={chartMode}
          onChartModeChange={persistChartMode}
          formatNumber={fmt}
        />
        <RankingPanel
          title={copy.catalogByGenre}
          icon={<AppstoreOutlined />}
          items={data.catalog.byGenre.map((r) => ({
            key: r.name,
            count: r.count,
          }))}
          empty={copy.empty}
          chartMode={chartMode}
          onChartModeChange={persistChartMode}
          formatNumber={fmt}
        />
      </div>

      <div className="app-page__row app-page__row--2">
        <section className="app-panel">
          <header className="app-panel__header">
            <h3 className="app-panel__title">
              <AppstoreOutlined /> {copy.catalogByType}
            </h3>
          </header>
          <div className="app-panel__body">
            {data.catalog.byType.length === 0 ? (
              <div className="app-panel__empty">{copy.empty}</div>
            ) : (
              <DonutChart
                data={data.catalog.byType.map((r) => ({
                  name: r.type,
                  value: r.count,
                }))}
                centerLabel={{
                  value: data.catalog.byType.reduce(
                    (s, r) => s + r.count,
                    0
                  ),
                  sublabel: copy.cardSeries,
                }}
                height={220}
                showLegend
              />
            )}
          </div>
        </section>

        <section className="app-panel">
          <header className="app-panel__header">
            <h3 className="app-panel__title">
              <BarChartOutlined /> {copy.catalogByYear}
            </h3>
          </header>
          <div className="app-panel__body">
            {data.catalog.byYear.length === 0 ? (
              <div className="app-panel__empty">{copy.empty}</div>
            ) : (
              <BarChart
                data={[...data.catalog.byYear].sort(
                  (a, b) => a.year - b.year
                )}
                xAxisKey="year"
                series={[{ dataKey: 'count', name: copy.cardSeries }]}
                height={220}
              />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
