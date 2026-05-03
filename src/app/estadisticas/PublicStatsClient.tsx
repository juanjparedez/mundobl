'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, Empty, Spin } from 'antd';
import {
  AppstoreOutlined,
  CommentOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useLocale } from '@/lib/providers/LocaleProvider';
import './public-stats.css';

interface PublicStatsResponse {
  generatedAt: string;
  summary: {
    totalSeries: number;
    totalPublicComments: number;
    totalCompletedViews: number;
  };
  rankings: {
    topSeries: Array<{ seriesId: number; title: string; count: number }>;
    topActors: Array<{ actorId: number; name: string; count: number }>;
    topProductionCompanies: Array<{ name: string; count: number }>;
    topCountries: Array<{ name: string; count: number }>;
    byType: Array<{ type: string; count: number }>;
  };
}

interface Copy {
  title: string;
  subtitle: string;
  loading: string;
  empty: string;
  updatedAt: string;
  cardSeries: string;
  cardPublicComments: string;
  cardCompletedViews: string;
  topSeries: string;
  topActors: string;
  topProductionCompanies: string;
  topCountries: string;
  byType: string;
}

function RankingList({
  items,
  renderLabel,
  renderValue,
  empty,
}: {
  items: Array<{ key: string; count: number; href?: string }>;
  renderLabel: (item: {
    key: string;
    count: number;
    href?: string;
  }) => React.ReactNode;
  renderValue: (item: {
    key: string;
    count: number;
    href?: string;
  }) => React.ReactNode;
  empty: string;
}) {
  if (items.length === 0) {
    return <Empty description={empty} image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  }

  return (
    <ol className="public-stats-ranking-list">
      {items.map((item, index) => (
        <li key={`${item.key}-${index}`} className="public-stats-ranking-item">
          <span className="public-stats-ranking-item__pos">{index + 1}</span>
          <span className="public-stats-ranking-item__label">
            {renderLabel(item)}
          </span>
          <span className="public-stats-ranking-item__value">
            {renderValue(item)}
          </span>
        </li>
      ))}
    </ol>
  );
}

export function PublicStatsClient() {
  const { locale } = useLocale();
  const [data, setData] = useState<PublicStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const copy: Copy = useMemo(
    () =>
      locale === 'en'
        ? {
            title: 'Global Community Stats',
            subtitle:
              'Anonymous metrics aggregated across the platform. No personal data is exposed.',
            loading: 'Loading global stats...',
            empty: 'No data yet',
            updatedAt: 'Updated',
            cardSeries: 'Series in catalog',
            cardPublicComments: 'Public comments',
            cardCompletedViews: 'Completed views',
            topSeries: 'Most watched series',
            topActors: 'Most watched actors',
            topProductionCompanies: 'Top production companies',
            topCountries: 'Top countries',
            byType: 'Views by content type',
          }
        : {
            title: 'Estadisticas Globales de la Comunidad',
            subtitle:
              'Metricas anonimas agregadas de toda la plataforma. No se exponen datos personales.',
            loading: 'Cargando estadisticas globales...',
            empty: 'Sin datos todavia',
            updatedAt: 'Actualizado',
            cardSeries: 'Series en catalogo',
            cardPublicComments: 'Comentarios publicos',
            cardCompletedViews: 'Visualizaciones completadas',
            topSeries: 'Series mas vistas',
            topActors: 'Actores mas vistos',
            topProductionCompanies: 'Productoras mas vistas',
            topCountries: 'Paises mas vistos',
            byType: 'Visualizaciones por tipo',
          },
    [locale]
  );

  useEffect(() => {
    let cancelled = false;

    fetch('/api/stats/public')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to load');
        }
        return response.json() as Promise<PublicStatsResponse>;
      })
      .then((payload) => {
        if (cancelled) return;
        setData(payload);
      })
      .catch(() => {
        if (cancelled) return;
        setData(null);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
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

  return (
    <div className="public-stats-page">
      <header className="public-stats-hero">
        <h1 className="public-stats-hero__title">{copy.title}</h1>
        <p className="public-stats-hero__subtitle">{copy.subtitle}</p>
        <p className="public-stats-hero__updated">
          {copy.updatedAt}: {new Date(data.generatedAt).toLocaleString(locale)}
        </p>
      </header>

      <section className="public-stats-summary">
        <Card className="public-stats-summary__card">
          <AppstoreOutlined />
          <strong>{data.summary.totalSeries.toLocaleString(locale)}</strong>
          <span>{copy.cardSeries}</span>
        </Card>
        <Card className="public-stats-summary__card">
          <CommentOutlined />
          <strong>
            {data.summary.totalPublicComments.toLocaleString(locale)}
          </strong>
          <span>{copy.cardPublicComments}</span>
        </Card>
        <Card className="public-stats-summary__card">
          <EyeOutlined />
          <strong>
            {data.summary.totalCompletedViews.toLocaleString(locale)}
          </strong>
          <span>{copy.cardCompletedViews}</span>
        </Card>
      </section>

      <section className="public-stats-grid">
        <Card title={copy.topSeries}>
          <RankingList
            items={data.rankings.topSeries.map((row) => ({
              key: row.title,
              count: row.count,
              href: `/series/${row.seriesId}`,
            }))}
            renderLabel={(item) =>
              item.href ? <Link href={item.href}>{item.key}</Link> : item.key
            }
            renderValue={(item) => item.count.toLocaleString(locale)}
            empty={copy.empty}
          />
        </Card>

        <Card title={copy.topActors}>
          <RankingList
            items={data.rankings.topActors.map((row) => ({
              key: row.name,
              count: row.count,
              href: `/actores/${row.actorId}`,
            }))}
            renderLabel={(item) =>
              item.href ? <Link href={item.href}>{item.key}</Link> : item.key
            }
            renderValue={(item) => item.count.toLocaleString(locale)}
            empty={copy.empty}
          />
        </Card>

        <Card title={copy.topProductionCompanies}>
          <RankingList
            items={data.rankings.topProductionCompanies.map((row) => ({
              key: row.name,
              count: row.count,
            }))}
            renderLabel={(item) => item.key}
            renderValue={(item) => item.count.toLocaleString(locale)}
            empty={copy.empty}
          />
        </Card>

        <Card title={copy.topCountries}>
          <RankingList
            items={data.rankings.topCountries.map((row) => ({
              key: row.name,
              count: row.count,
            }))}
            renderLabel={(item) => item.key}
            renderValue={(item) => item.count.toLocaleString(locale)}
            empty={copy.empty}
          />
        </Card>

        <Card title={copy.byType} className="public-stats-grid__full">
          <RankingList
            items={data.rankings.byType.map((row) => ({
              key: row.type,
              count: row.count,
            }))}
            renderLabel={(item) => item.key}
            renderValue={(item) => item.count.toLocaleString(locale)}
            empty={copy.empty}
          />
        </Card>
      </section>
    </div>
  );
}
