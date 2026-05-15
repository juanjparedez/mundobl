'use client';

import { useEffect, useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout/AppLayout';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs/Breadcrumbs';
import { Card, Tag, Row, Col, Empty, Input, Select, Space, Button } from 'antd';
import {
  LinkOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import Image from 'next/image';
import { isSupabaseImageUrl } from '@/lib/image-helpers';
import { getFaviconUrl, getDisplayHostname } from '@/lib/site-helpers';
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  CATEGORY_SELECT_OPTIONS,
} from '@/constants/sitios';
import './sitios.css';
import { useLocale } from '@/lib/providers/LocaleProvider';

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

export function SitiosPage({ sites }: SitiosPageProps) {
  const { t } = useLocale();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    if (typeof window === 'undefined') return 'grid';
    return window.localStorage.getItem('sitios-view-mode') === 'list'
      ? 'list'
      : 'grid';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('sitios-view-mode', viewMode);
  }, [viewMode]);

  const hasActiveFilters = Boolean(categoryFilter || searchTerm);
  const clearFilters = () => {
    setCategoryFilter(null);
    setSearchTerm('');
  };

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
          <Breadcrumbs
            items={[
              { name: t('sitiosPage.breadcrumbsHome'), href: '/' },
              { name: t('sitiosPage.breadcrumbsSitios') },
            ]}
          />
          <h1 className="sitios-public__title">{t('sitiosPage.pageTitle')}</h1>
          <Empty description={t('sitiosPage.emptySitesDescription')} />
        </div>
      </AppLayout>
    );
  }

  const renderCard = (site: Site) => {
    const cat = site.category || 'otro';
    const faviconUrl = getFaviconUrl(site.url, 64);
    return (
      <a
        href={site.url}
        target="_blank"
        rel="noopener noreferrer nofollow"
        style={{ textDecoration: 'none' }}
      >
        <Card
          className={`sitios-card sitios-card--${cat}`}
          size="small"
          title={
            <span className="sitios-card__title-row">
              {/* Favicon: si el sitio tiene logo propio en DB, lo usamos;
               *  si no, fallback al favicon de Google's S2 service. Asi
               *  cada card tiene una identidad visual propia. */}
              <span className="sitios-card__favicon-wrap">
                {site.imageUrl ? (
                  <Image
                    src={site.imageUrl}
                    alt={t('sitiosPage.siteLogoAlt', { siteName: site.name })}
                    width={32}
                    height={32}
                    quality={75}
                    unoptimized={isSupabaseImageUrl(site.imageUrl)}
                    className="sitios-card__favicon"
                  />
                ) : faviconUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={faviconUrl}
                    alt=""
                    width={32}
                    height={32}
                    className="sitios-card__favicon"
                    loading="lazy"
                  />
                ) : (
                  <LinkOutlined className="sitios-card__favicon-fallback" />
                )}
              </span>
              <span className="sitios-card__name">{site.name}</span>
            </span>
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
              {getDisplayHostname(site.url)}
            </span>
            {site.language && <Tag>{site.language}</Tag>}
          </div>
        </Card>
      </a>
    );
  };

  const renderListItem = (site: Site) => {
    const cat = site.category || 'otro';
    const faviconUrl = getFaviconUrl(site.url, 32);
    return (
      <a
        key={site.id}
        href={site.url}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className={`sitios-list-item sitios-list-item--${cat}`}
      >
        <div className="sitios-list-item__content">
          <span className="sitios-list-item__name">
            <span className="sitios-list-item__favicon-wrap">
              {faviconUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={faviconUrl}
                  alt=""
                  width={20}
                  height={20}
                  className="sitios-list-item__favicon"
                  loading="lazy"
                />
              ) : (
                <LinkOutlined />
              )}
            </span>
            {site.name}
          </span>
          <div className="sitios-list-item__meta">
            <Tag
              color={CATEGORY_COLORS[cat] || 'default'}
              className="sitios-list-item__tag"
            >
              {CATEGORY_LABELS[cat] || cat}
            </Tag>
            <span>{getDisplayHostname(site.url)}</span>
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
        <Breadcrumbs
          items={[
            { name: t('sitiosPage.breadcrumbsHome'), href: '/' },
            { name: t('sitiosPage.breadcrumbsSitios') },
          ]}
        />
        <h1 className="sitios-public__title">{t('sitiosPage.pageTitle')}</h1>
        <p className="sitios-public__subtitle">
          {t('sitiosPage.pageSubtitle')}
        </p>

        <div className="sitios-public__toolbar">
          <Space wrap>
            <Input.Search
              placeholder={t('sitiosPage.searchPlaceholder')}
              allowClear
              style={{ width: 220 }}
              onSearch={setSearchTerm}
              onChange={(e) => {
                if (!e.target.value) setSearchTerm('');
              }}
            />
            <Select
              placeholder={t('sitiosPage.categoryPlaceholder')}
              options={CATEGORY_SELECT_OPTIONS}
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
          <Empty description={t('sitiosPage.noSitesWithFilters')}>
            {hasActiveFilters && (
              <Button type="primary" onClick={clearFilters}>
                {t('sitiosPage.clearFiltersButton')}
              </Button>
            )}
          </Empty>
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
