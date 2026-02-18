'use client';

import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout/AppLayout';
import { Card, Tag, Row, Col, Empty, Input, Select, Space, Button } from 'antd';
import {
  LinkOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import './sitios.css';

const CATEGORY_COLORS: Record<string, string> = {
  noticias: 'blue',
  comunidad: 'green',
  streaming: 'purple',
  info: 'cyan',
  otro: 'default',
};

const CATEGORY_LABELS: Record<string, string> = {
  noticias: 'Noticias',
  comunidad: 'Comunidad',
  streaming: 'Streaming',
  info: 'Información',
  otro: 'Otros',
};

const CATEGORY_FILTER_OPTIONS = [
  { label: 'Streaming', value: 'streaming' },
  { label: 'Noticias', value: 'noticias' },
  { label: 'Información', value: 'info' },
  { label: 'Comunidad', value: 'comunidad' },
  { label: 'Otros', value: 'otro' },
];

interface Site {
  id: number;
  name: string;
  url: string;
  description: string | null;
  category: string | null;
  language: string | null;
  imageUrl: string | null;
  sortOrder: number;
}

interface SitiosPageProps {
  sites: Site[];
}

const CATEGORY_ORDER = ['streaming', 'noticias', 'info', 'comunidad', 'otro'];

export function SitiosPage({ sites }: SitiosPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredSites = useMemo(
    () =>
      sites.filter((site) => {
        const cat = site.category || 'otro';
        if (categoryFilter && cat !== categoryFilter) return false;
        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          return (
            site.name.toLowerCase().includes(term) ||
            (site.description?.toLowerCase().includes(term) ?? false)
          );
        }
        return true;
      }),
    [sites, searchTerm, categoryFilter]
  );

  const grouped = useMemo(() => {
    const acc: Record<string, Site[]> = {};
    for (const site of filteredSites) {
      const cat = site.category || 'otro';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(site);
    }
    return acc;
  }, [filteredSites]);

  const sortedCategories = useMemo(
    () =>
      Object.keys(grouped).sort(
        (a, b) => CATEGORY_ORDER.indexOf(a) - CATEGORY_ORDER.indexOf(b)
      ),
    [grouped]
  );

  if (sites.length === 0) {
    return (
      <AppLayout>
        <div className="sitios-public">
          <h1 className="sitios-public__title">Sitios de Interés</h1>
          <Empty description="Aún no hay sitios recomendados" />
        </div>
      </AppLayout>
    );
  }

  const renderCard = (site: Site) => {
    const cat = site.category || 'otro';
    return (
      <a
        href={site.url}
        target="_blank"
        rel="noopener noreferrer"
        style={{ textDecoration: 'none' }}
      >
        <Card
          className={`sitios-card sitios-card--${cat}`}
          size="small"
          title={
            <>
              <LinkOutlined /> {site.name}
            </>
          }
          extra={
            <Tag color={CATEGORY_COLORS[cat] || 'default'}>
              {CATEGORY_LABELS[cat] || cat}
            </Tag>
          }
        >
          {site.description && (
            <p className="sitios-card__description">{site.description}</p>
          )}
          <div className="sitios-card__footer">
            <span className="sitios-card__link">
              {new URL(site.url).hostname}
            </span>
            {site.language && <Tag>{site.language}</Tag>}
          </div>
        </Card>
      </a>
    );
  };

  const renderListItem = (site: Site) => {
    const cat = site.category || 'otro';
    return (
      <a
        key={site.id}
        href={site.url}
        target="_blank"
        rel="noopener noreferrer"
        className={`sitios-list-item sitios-list-item--${cat}`}
      >
        <div className="sitios-list-item__content">
          <span className="sitios-list-item__name">
            <LinkOutlined /> {site.name}
          </span>
          <div className="sitios-list-item__meta">
            <Tag
              color={CATEGORY_COLORS[cat] || 'default'}
              className="sitios-list-item__tag"
            >
              {CATEGORY_LABELS[cat] || cat}
            </Tag>
            <span>{new URL(site.url).hostname}</span>
            {site.language && (
              <Tag className="sitios-list-item__tag">{site.language}</Tag>
            )}
          </div>
        </div>
        {site.description && (
          <span className="sitios-list-item__description">
            {site.description}
          </span>
        )}
      </a>
    );
  };

  return (
    <AppLayout>
      <div className="sitios-public">
        <h1 className="sitios-public__title">Sitios de Interés</h1>
        <p className="sitios-public__subtitle">
          Sitios recomendados relacionados con el mundo BL
        </p>

        <div className="sitios-public__toolbar">
          <Space wrap>
            <Input.Search
              placeholder="Buscar sitio..."
              allowClear
              style={{ width: 220 }}
              onSearch={setSearchTerm}
              onChange={(e) => {
                if (!e.target.value) setSearchTerm('');
              }}
            />
            <Select
              placeholder="Categoría"
              options={CATEGORY_FILTER_OPTIONS}
              allowClear
              style={{ width: 160 }}
              onChange={(val: string | undefined) =>
                setCategoryFilter(val ?? null)
              }
            />
          </Space>
          <Space.Compact>
            <Button
              icon={<AppstoreOutlined />}
              type={viewMode === 'grid' ? 'primary' : 'default'}
              onClick={() => setViewMode('grid')}
            />
            <Button
              icon={<UnorderedListOutlined />}
              type={viewMode === 'list' ? 'primary' : 'default'}
              onClick={() => setViewMode('list')}
            />
          </Space.Compact>
        </div>

        {filteredSites.length === 0 ? (
          <Empty description="No hay sitios con estos filtros" />
        ) : viewMode === 'list' ? (
          <div className="sitios-list">
            {(categoryFilter
              ? filteredSites
              : filteredSites.sort((a, b) => {
                  const catA = CATEGORY_ORDER.indexOf(a.category || 'otro');
                  const catB = CATEGORY_ORDER.indexOf(b.category || 'otro');
                  return catA - catB || a.sortOrder - b.sortOrder;
                })
            ).map((site) => renderListItem(site))}
          </div>
        ) : categoryFilter || searchTerm ? (
          <Row gutter={[16, 16]}>
            {filteredSites.map((site) => (
              <Col xs={24} sm={12} md={8} lg={6} key={site.id}>
                {renderCard(site)}
              </Col>
            ))}
          </Row>
        ) : (
          sortedCategories.map((category) => (
            <div key={category}>
              <h2 className="sitios-public__category-title">
                {CATEGORY_LABELS[category] || category}
              </h2>
              <Row gutter={[16, 16]}>
                {grouped[category].map((site) => (
                  <Col xs={24} sm={12} md={8} lg={6} key={site.id}>
                    {renderCard(site)}
                  </Col>
                ))}
              </Row>
            </div>
          ))
        )}
      </div>
    </AppLayout>
  );
}
