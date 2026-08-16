'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Empty, Segmented, Spin, Alert, Button, Space, Tooltip } from 'antd';
import {
  AppstoreOutlined,
  BarsOutlined,
  BarChartOutlined,
  CommentOutlined,
  EyeOutlined,
  GlobalOutlined,
  TeamOutlined,
  VideoCameraOutlined,
  HeartOutlined,
  StarOutlined,
  PlayCircleOutlined,
  SettingOutlined,
  SafetyCertificateOutlined,
  DashboardOutlined,
} from '@ant-design/icons';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { getCountryFlagEmoji } from '@/lib/country-codes';
import { BarChart, DonutChart } from '@/components/charts';
import './public-stats.css';

interface PublicStatsResponse {
  generatedAt: string;
  summary: {
    totalSeries: number;
    totalPublicComments: number;
    totalCompletedViews: number;
    totalCurrentlyWatching: number;
    totalFavorites: number;
    totalActors: number;
    totalDirectors: number;
    averageCommunityRating: number | null;
    totalUserRatings: number;
  };
  rankings: {
    topSeries: Array<{ seriesId: number; title: string; count: number }>;
    topFavorited: Array<{ seriesId: number; title: string; count: number }>;
    topActors: Array<{ actorId: number; name: string; count: number }>;
    topDirectors: Array<{ directorId: number; name: string; count: number }>;
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
  ratings?: {
    averageCommunity: number | null;
    total: number;
    distribution: Array<{ score: number; count: number }>;
  };
}

type ChartMode = 'bar' | 'list';

const CHART_MODE_KEY = 'public-stats-chart-mode';

function truncate(label: string, max = 22): string {
  return label.length > max ? `${label.slice(0, max - 1)}…` : label;
}

interface RankingItem {
  key: string;
  count: number;
  href?: string;
  flag?: string;
}

function RankingBarChart({
  items,
  empty,
  onNavigate,
}: {
  items: RankingItem[];
  empty: string;
  onNavigate?: (href: string) => void;
}) {
  if (items.length === 0) {
    return <div className="app-panel__empty">{empty}</div>;
  }
  const top = items.slice(0, 10);
  const data = top.map((it) => {
    const prefix = it.flag ? `${it.flag} ` : '';
    return {
      label: truncate(`${prefix}${it.key}`),
      fullLabel: `${prefix}${it.key}`,
      count: it.count,
      href: it.href,
    };
  });
  const height = Math.max(180, top.length * 28 + 30);
  return (
    <BarChart
      data={data}
      xAxisKey="label"
      series={[{ dataKey: 'count', name: 'Total' }]}
      horizontal
      multicolor
      height={height}
      onBarClick={(item) => {
        if (item.href && onNavigate) {
          onNavigate(item.href);
        }
      }}
    />
  );
}

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
            {it.flag && (
              <span className="public-stats-list__flag">{it.flag} </span>
            )}
            {it.href ? (
              <Link href={it.href} className="public-stats-list__link">
                {it.key}
              </Link>
            ) : (
              it.key
            )}
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
  onNavigate?: (href: string) => void;
  adminActionHref?: string;
  adminActionLabel?: string;
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
  onNavigate,
  adminActionHref,
  adminActionLabel,
}: RankingPanelProps) {
  return (
    <section className="app-panel">
      <header className="app-panel__header">
        <h3 className="app-panel__title">
          {icon} {title}
        </h3>
        <div className="public-stats-panel__actions">
          {adminActionHref && (
            <Tooltip title={adminActionLabel ?? 'Administrar'}>
              <Link
                href={adminActionHref}
                className="public-stats-panel__admin-link"
              >
                <SettingOutlined />
              </Link>
            </Tooltip>
          )}
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
      </header>
      <div className="app-panel__body">
        {chartMode === 'bar' ? (
          <RankingBarChart
            items={items}
            empty={empty}
            onNavigate={onNavigate}
          />
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
  const router = useRouter();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'ADMIN';

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

  const handleNavigate = useCallback(
    (href: string) => {
      router.push(href);
    },
    [router]
  );

  const copy = useMemo(
    () =>
      locale === 'en'
        ? {
            title: 'Global Community Stats',
            subtitle:
              'Anonymous real-time metrics aggregated across the platform. No black-box algorithms or manipulation.',
            loading: 'Loading stats…',
            empty: 'No data yet',
            updatedAt: 'Updated',
            sectionActivity: 'Community activity',
            sectionCatalog: 'Catalog breakdown',
            sectionRatings: 'Community ratings distribution',
            cardSeries: 'Series in catalog',
            cardPublicComments: 'Public comments',
            cardCompletedViews: 'Completed views',
            cardCurrentlyWatching: 'Watching now',
            cardFavorites: 'Favorited',
            cardActors: 'Actors',
            cardDirectors: 'Directors',
            cardAverageRating: 'Community average',
            topSeries: 'Most watched series',
            topFavorited: 'Most favorited series',
            topActors: 'Most watched actors',
            topDirectors: 'Most watched directors',
            topProductionCompanies: 'Top production companies',
            topCountries: 'Most watched countries',
            byType: 'Views by content type',
            catalogByCountry: 'Series by country',
            catalogByType: 'Series by type',
            catalogByGenre: 'Series by genre',
            catalogByYear: 'Series by release year',
            ratingScore: 'Stars',
            ratingVotes: 'ratings',
            timesWatched: 'times',
            timesSaved: 'saves',
            methodologyTitle: 'Data Transparency & Methodology',
            methodologyText:
              'All metrics displayed on this page are computed dynamically from actual user interactions and curated catalog records. MundoBL does not use sponsored weighting or opaque recommendation algorithms.',
            adminBannerTitle: 'Admin quick access',
            adminManageSeries: 'Manage series',
            adminManageCompanies: 'Manage companies',
            adminManageActors: 'Manage actors',
            adminManageDirectors: 'Manage directors',
            adminDashboard: 'Admin internal stats',
          }
        : {
            title: 'Estadísticas Globales de la Comunidad',
            subtitle:
              'Métricas anónimas agregadas de toda la plataforma en tiempo real. Datos reales, sin algoritmos opacos ni manipulación.',
            loading: 'Cargando estadísticas…',
            empty: 'Sin datos todavía',
            updatedAt: 'Actualizado',
            sectionActivity: 'Actividad de la comunidad',
            sectionCatalog: 'Desglose del catálogo',
            sectionRatings: 'Distribución de calificaciones de la comunidad',
            cardSeries: 'Series en catálogo',
            cardPublicComments: 'Comentarios públicos',
            cardCompletedViews: 'Visualizaciones completadas',
            cardCurrentlyWatching: 'Viendo ahora',
            cardFavorites: 'En favoritos',
            cardActors: 'Actores',
            cardDirectors: 'Directores',
            cardAverageRating: 'Promedio comunidad',
            topSeries: 'Series más vistas',
            topFavorited: 'Series más guardadas en favoritos',
            topActors: 'Actores más vistos',
            topDirectors: 'Directores más vistos',
            topProductionCompanies: 'Productoras más vistas',
            topCountries: 'Países más vistos',
            byType: 'Visualizaciones por tipo',
            catalogByCountry: 'Series por país',
            catalogByType: 'Series por tipo',
            catalogByGenre: 'Series por género',
            catalogByYear: 'Series por año de estreno',
            ratingScore: 'Estrellas',
            ratingVotes: 'votos',
            timesWatched: 'veces',
            timesSaved: 'guardados',
            methodologyTitle: 'Transparencia y Metodología',
            methodologyText:
              'Todas las estadísticas se calculan de manera directa y anónima sobre los registros de actividad de la comunidad y el catálogo curado. En MundoBL no existen algoritmos de relevancia paga ni cajas negras.',
            adminBannerTitle: 'Atajos de administración',
            adminManageSeries: 'Gestionar series',
            adminManageCompanies: 'Gestionar productoras',
            adminManageActors: 'Gestionar actores',
            adminManageDirectors: 'Gestionar directores',
            adminDashboard: 'Métricas internas admin',
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
        <div className="public-stats-hero__main">
          <h1 className="public-stats-hero__title">{copy.title}</h1>
          <p className="public-stats-hero__subtitle">{copy.subtitle}</p>
        </div>
        <p className="public-stats-hero__updated">
          {copy.updatedAt}: {new Date(data.generatedAt).toLocaleString(locale)}
        </p>
      </header>

      {/* ── Admin Toolbar (visible only to admins) ── */}
      {isAdmin && (
        <div className="public-stats-admin-bar">
          <span className="public-stats-admin-bar__label">
            <SafetyCertificateOutlined /> {copy.adminBannerTitle}:
          </span>
          <Space wrap size="small">
            <Button
              size="small"
              icon={<DashboardOutlined />}
              href="/admin/stats"
            >
              {copy.adminDashboard}
            </Button>
            <Button size="small" icon={<AppstoreOutlined />} href="/admin">
              {copy.adminManageSeries}
            </Button>
            <Button
              size="small"
              icon={<AppstoreOutlined />}
              href="/admin/productoras"
            >
              {copy.adminManageCompanies}
            </Button>
            <Button size="small" icon={<TeamOutlined />} href="/admin/actores">
              {copy.adminManageActors}
            </Button>
            <Button
              size="small"
              icon={<VideoCameraOutlined />}
              href="/admin/directores"
            >
              {copy.adminManageDirectors}
            </Button>
          </Space>
        </div>
      )}

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
            icon: <PlayCircleOutlined />,
            value: data.summary.totalCurrentlyWatching,
            label: copy.cardCurrentlyWatching,
          },
          {
            icon: <HeartOutlined />,
            value: data.summary.totalFavorites,
            label: copy.cardFavorites,
          },
          {
            icon: <StarOutlined />,
            value: data.summary.averageCommunityRating
              ? `⭐ ${data.summary.averageCommunityRating}`
              : '—',
            isFormatted: true,
            label: copy.cardAverageRating,
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
            <span className="public-stats-kpi__value">
              {kpi.isFormatted ? kpi.value : fmt(kpi.value as number)}
            </span>
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
          onNavigate={handleNavigate}
          adminActionHref={isAdmin ? '/admin' : undefined}
          adminActionLabel={copy.adminManageSeries}
        />
        <RankingPanel
          title={copy.topFavorited}
          icon={<HeartOutlined />}
          items={data.rankings.topFavorited.map((r) => ({
            key: r.title,
            count: r.count,
            href: `/series/${r.seriesId}`,
          }))}
          empty={copy.empty}
          unit={copy.timesSaved}
          chartMode={chartMode}
          onChartModeChange={persistChartMode}
          formatNumber={fmt}
          onNavigate={handleNavigate}
        />
      </div>

      <div className="app-page__row app-page__row--2">
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
          onNavigate={handleNavigate}
          adminActionHref={isAdmin ? '/admin/actores' : undefined}
          adminActionLabel={copy.adminManageActors}
        />
        <RankingPanel
          title={copy.topDirectors}
          icon={<VideoCameraOutlined />}
          items={data.rankings.topDirectors.map((r) => ({
            key: r.name,
            count: r.count,
            href: `/directores/${r.directorId}`,
          }))}
          empty={copy.empty}
          unit={copy.timesWatched}
          chartMode={chartMode}
          onChartModeChange={persistChartMode}
          formatNumber={fmt}
          onNavigate={handleNavigate}
          adminActionHref={isAdmin ? '/admin/directores' : undefined}
          adminActionLabel={copy.adminManageDirectors}
        />
      </div>

      <div className="app-page__row app-page__row--2">
        <RankingPanel
          title={copy.topProductionCompanies}
          icon={<AppstoreOutlined />}
          items={data.rankings.topProductionCompanies.map((r) => ({
            key: r.name,
            count: r.count,
            href: `/catalogo?productionCompany=${encodeURIComponent(r.name)}`,
          }))}
          empty={copy.empty}
          chartMode={chartMode}
          onChartModeChange={persistChartMode}
          formatNumber={fmt}
          onNavigate={handleNavigate}
          adminActionHref={isAdmin ? '/admin/productoras' : undefined}
          adminActionLabel={copy.adminManageCompanies}
        />
        <RankingPanel
          title={copy.topCountries}
          icon={<GlobalOutlined />}
          items={data.rankings.topCountries.map((r) => ({
            key: r.name,
            count: r.count,
            href: `/catalogo?country=${encodeURIComponent(r.name)}`,
            flag: getCountryFlagEmoji(r.name),
          }))}
          empty={copy.empty}
          unit={copy.timesWatched}
          chartMode={chartMode}
          onChartModeChange={persistChartMode}
          formatNumber={fmt}
          onNavigate={handleNavigate}
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
            href: `/catalogo?country=${encodeURIComponent(r.name)}`,
            flag: getCountryFlagEmoji(r.name),
          }))}
          empty={copy.empty}
          chartMode={chartMode}
          onChartModeChange={persistChartMode}
          formatNumber={fmt}
          onNavigate={handleNavigate}
        />
        <RankingPanel
          title={copy.catalogByGenre}
          icon={<AppstoreOutlined />}
          items={data.catalog.byGenre.map((r) => ({
            key: r.name,
            count: r.count,
            href: `/catalogo?genre=${encodeURIComponent(r.name)}`,
          }))}
          empty={copy.empty}
          chartMode={chartMode}
          onChartModeChange={persistChartMode}
          formatNumber={fmt}
          onNavigate={handleNavigate}
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
                  value: data.catalog.byType.reduce((s, r) => s + r.count, 0),
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
                data={[...data.catalog.byYear]
                  .sort((a, b) => a.year - b.year)
                  .map((y) => ({
                    year: String(y.year),
                    count: y.count,
                    href: `/catalogo?year=${y.year}`,
                  }))}
                xAxisKey="year"
                series={[{ dataKey: 'count', name: copy.cardSeries }]}
                height={220}
                onBarClick={(item) => {
                  if (item.href) handleNavigate(item.href as string);
                }}
              />
            )}
          </div>
        </section>
      </div>

      {/* ── Community Ratings Breakdown ── */}
      {data.ratings && data.ratings.distribution.length > 0 && (
        <>
          <h2 className="public-stats-section-title">{copy.sectionRatings}</h2>
          <section className="app-panel">
            <header className="app-panel__header">
              <h3 className="app-panel__title">
                <StarOutlined /> {copy.sectionRatings} (⭐{' '}
                {data.ratings.averageCommunity ?? '—'} / 10 ·{' '}
                {fmt(data.ratings.total)} {copy.ratingVotes})
              </h3>
            </header>
            <div className="app-panel__body">
              <BarChart
                data={data.ratings.distribution.map((d) => ({
                  label: `${d.score} ⭐`,
                  count: d.count,
                }))}
                xAxisKey="label"
                series={[{ dataKey: 'count', name: copy.ratingVotes }]}
                multicolor
                height={220}
              />
            </div>
          </section>
        </>
      )}

      {/* ── Transparency & Methodology Notice ── */}
      <div className="public-stats-methodology">
        <Alert
          type="info"
          showIcon
          icon={<SafetyCertificateOutlined />}
          message={copy.methodologyTitle}
          description={copy.methodologyText}
          className="public-stats-methodology__alert"
        />
      </div>
    </div>
  );
}
