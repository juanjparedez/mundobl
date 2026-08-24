'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Button,
  Checkbox,
  Empty,
  Input,
  Select,
  Popconfirm,
  Segmented,
  Tooltip,
} from 'antd';
import {
  PlayCircleFilled,
  PlusOutlined,
  SearchOutlined,
  DeleteOutlined,
  AppstoreOutlined,
  BarsOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { CountryFlag } from '@/components/common/CountryFlag/CountryFlag';
import { useMessage } from '@/hooks/useMessage';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { isSupabaseImageUrl } from '@/lib/image-helpers';
import { HeroBillboard } from '@/components/streaming/HeroBillboard/HeroBillboard';
import {
  MediaCarousel,
  type CarouselMediaItem,
} from '@/components/streaming/MediaCarousel/MediaCarousel';
import { useReorderablePrefs } from '@/components/carousel/useReorderablePrefs';
import { ReorderConfigDrawer } from '@/components/carousel/ReorderConfigDrawer/ReorderConfigDrawer';
import { VER_CAROUSEL_CATEGORIES } from './carousel/verCarouselCategories';

const VER_CAROUSEL_CATEGORY_IDS = VER_CAROUSEL_CATEGORIES.map((c) => c.id);

interface VerItem extends CarouselMediaItem {
  catalogScope: string;
  origin: string;
  createdAt?: string;
  linkedSeries: { id: number; title: string } | null;
}

interface VerPageProps {
  items: VerItem[];
}

export function VerPage({ items }: VerPageProps) {
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated';
  const isAdmin = session?.user?.role === 'ADMIN';
  const router = useRouter();
  const message = useMessage();
  const { t } = useLocale();

  const [search, setSearch] = useState('');
  const [country, setCountry] = useState<string | null>(null);
  const [platform, setPlatform] = useState<string | null>(null);
  const [onlyCurated, setOnlyCurated] = useState(false);
  const [viewMode, setViewMode] = useState<'streaming' | 'grid'>('streaming');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [carouselConfigOpen, setCarouselConfigOpen] = useState(false);

  const [heroCollapsed, setHeroCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem('ver-hero-collapsed') === 'true';
  });
  const [searchOpen, setSearchOpen] = useState(() => {
    if (typeof window === 'undefined') return true;
    const raw = window.localStorage.getItem('ver-search-open');
    return raw === null ? true : raw === 'true';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('ver-hero-collapsed', String(heroCollapsed));
  }, [heroCollapsed]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('ver-search-open', String(searchOpen));
  }, [searchOpen]);

  const carouselPrefs = useReorderablePrefs(
    'ver-carousel-prefs',
    VER_CAROUSEL_CATEGORY_IDS
  );

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/series/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('delete failed');
      message.success(t('ver.deleteSuccess'));
      router.refresh();
    } catch (err) {
      console.error(err);
      message.error(t('ver.deleteError'));
    } finally {
      setDeletingId(null);
    }
  };

  const countries = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => i.country?.name && set.add(i.country.name));
    return Array.from(set).sort();
  }, [items]);

  const platforms = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => i.platforms.forEach((p) => set.add(p)));
    return Array.from(set).sort();
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((i) => {
      if (q && !i.title.toLowerCase().includes(q)) return false;
      if (country && i.country?.name !== country) return false;
      if (platform && !i.platforms.includes(platform)) return false;
      if (onlyCurated && i.origin !== 'CURATED') return false;
      return true;
    });
  }, [items, search, country, platform, onlyCurated]);

  // Serie destacada para el Hero Billboard (ej: 2gether, We Are o la primera
  // con poster). Se excluyen las geo-restringidas: no tiene sentido dedicar
  // el lugar mas visible de la pagina a algo que la mayoria no puede mirar
  // (bug real: "2gether" estaba hardcodeada como primera preferencia y es
  // justo una de las series bloqueadas en el mercado core).
  const featured = useMemo(() => {
    const eligible = items.filter((i) => !i.geoRestrictedCore);
    return (
      eligible.find(
        (i) =>
          i.imageUrl &&
          (i.title.toLowerCase().includes('2gether') ||
            i.title.toLowerCase().includes('we are') ||
            i.title.toLowerCase().includes('cutie pie'))
      ) ||
      eligible.find((i) => i.imageUrl) ||
      eligible[0] ||
      items[0]
    );
  }, [items]);

  // Filas de carrusel: pool curado en verCarouselCategories.ts, orden y
  // visibilidad los elige el usuario via ReorderConfigDrawer (persistido
  // en localStorage por useReorderablePrefs). Se descartan las filas que
  // quedan vacias para esta base de datos.
  const carouselRows = useMemo(() => {
    return carouselPrefs.orderedVisibleIds
      .map((id) => VER_CAROUSEL_CATEGORIES.find((c) => c.id === id))
      .filter((c): c is (typeof VER_CAROUSEL_CATEGORIES)[number] => !!c)
      .map((category) => {
        const rowItems = [...items].filter(category.filter);
        if (category.sort) rowItems.sort(category.sort);
        return { category, rowItems };
      })
      .filter((row) => row.rowItems.length > 0);
  }, [items, carouselPrefs.orderedVisibleIds]);

  const isFiltering = Boolean(search || country || platform || onlyCurated);

  return (
    <div className="ver-content">
      {/* Hero Billboard Principal (cuando no hay filtro activo y en modo streaming) */}
      {!isFiltering && viewMode === 'streaming' && featured && (
        <HeroBillboard
          featured={featured}
          collapsed={heroCollapsed}
          onToggleCollapse={() => setHeroCollapsed((v) => !v)}
          spotlightBadgeLabel={t('ver.heroSpotlightBadge')}
          youtubeTagLabel={t('ver.heroYoutubeTag')}
          vimeoTagLabel={t('ver.heroVimeoTag')}
          episodesBadgeLabel={t('ver.heroEpisodesBadge', {
            count: featured.episodesWithEmbed,
          })}
          playButtonLabel={t('ver.heroPlayButton')}
          infoButtonLabel={t('ver.heroInfoButton')}
          collapseTooltip={t('ver.heroCollapseTooltip')}
          expandTooltip={t('ver.heroExpandTooltip')}
          geoRestrictedLabel={t('ver.geoRestrictedBadge')}
        />
      )}

      {/* Barra de Control, Búsqueda y Filtros de Streaming */}
      <div className="ver-control-bar">
        {searchOpen && (
          <div className="ver-control-bar__search-wrap">
            <Input
              prefix={
                <SearchOutlined style={{ color: 'var(--text-secondary)' }} />
              }
              placeholder={t('ver.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
              size="large"
              className="ver-control-bar__search"
            />
          </div>
        )}

        <div className="ver-control-bar__filters">
          <Tooltip
            title={
              searchOpen
                ? t('ver.searchHideTooltip')
                : t('ver.searchShowTooltip')
            }
          >
            <Button
              icon={<SearchOutlined />}
              type={searchOpen ? 'primary' : 'default'}
              onClick={() => setSearchOpen((v) => !v)}
              aria-label={
                searchOpen
                  ? t('ver.searchHideTooltip')
                  : t('ver.searchShowTooltip')
              }
            />
          </Tooltip>

          <Select
            allowClear
            placeholder={t('ver.countryPlaceholder')}
            value={country}
            onChange={setCountry}
            className="ver-filter-select"
            size="middle"
            options={countries.map((c) => ({ label: c, value: c }))}
          />

          <Select
            allowClear
            placeholder={t('ver.platformPlaceholder')}
            value={platform}
            onChange={setPlatform}
            className="ver-filter-select"
            size="middle"
            options={platforms.map((p) => ({ label: p, value: p }))}
          />

          <Checkbox
            checked={onlyCurated}
            onChange={(e) => setOnlyCurated(e.target.checked)}
          >
            {t('ver.onlyCuratedLabel')}
          </Checkbox>

          <Segmented
            value={viewMode}
            onChange={(v) => setViewMode(v as 'streaming' | 'grid')}
            options={[
              {
                label: t('ver.viewStreaming'),
                value: 'streaming',
                icon: <BarsOutlined />,
              },
              {
                label: t('ver.viewGrid'),
                value: 'grid',
                icon: <AppstoreOutlined />,
              },
            ]}
          />

          {viewMode === 'streaming' && !isFiltering && (
            <Tooltip title={t('ver.configureButton')}>
              <Button
                icon={<SettingOutlined />}
                onClick={() => setCarouselConfigOpen(true)}
                aria-label={t('ver.configureButton')}
              />
            </Tooltip>
          )}

          {isAuthenticated && (
            <Link href="/ver/agregar" prefetch={false}>
              <Button type="primary" icon={<PlusOutlined />}>
                {t('ver.contributeButton')}
              </Button>
            </Link>
          )}
        </div>
      </div>

      <ReorderConfigDrawer
        open={carouselConfigOpen}
        onClose={() => setCarouselConfigOpen(false)}
        items={VER_CAROUSEL_CATEGORIES.map((c) => ({
          id: c.id,
          label: t(c.labelKey),
        }))}
        order={carouselPrefs.order}
        hidden={carouselPrefs.hidden}
        onReorder={carouselPrefs.reorder}
        onToggleHidden={carouselPrefs.toggleHidden}
        onReset={carouselPrefs.reset}
        title={t('ver.drawerTitle')}
        hint={t('ver.drawerHint')}
        resetLabel={t('ver.resetButton')}
        dragHandleAria={t('ver.dragHandleAria')}
      />

      {/* VISTA 1: MODO STREAMING (Carruseles Temáticos) */}
      {viewMode === 'streaming' && !isFiltering && (
        <div className="ver-streaming-view">
          {carouselRows.map(({ category, rowItems }) => {
            const Icon = category.icon;
            return (
              <MediaCarousel
                key={category.id}
                title={t(category.labelKey)}
                icon={<Icon />}
                items={rowItems}
                scrollPrevLabel={t('ver.scrollPrev')}
                scrollNextLabel={t('ver.scrollNext')}
                episodesBadgeLabel={(count) =>
                  t('ver.cardEpisodesBadge', { count })
                }
                geoRestrictedLabel={t('ver.geoRestrictedBadge')}
              />
            );
          })}
        </div>
      )}

      {/* VISTA 2: MODO REJILLA (o cuando hay un filtro/búsqueda activo) */}
      {(viewMode === 'grid' || isFiltering) && (
        <div className="ver-grid-view">
          <div className="ver-grid-view__head">
            <h2 className="ver-grid-view__title">
              {isFiltering ? t('ver.resultsTitle') : t('ver.catalogTitle')} (
              {filtered.length})
            </h2>
            {isFiltering && (
              <Button
                type="link"
                onClick={() => {
                  setSearch('');
                  setCountry(null);
                  setPlatform(null);
                  setOnlyCurated(false);
                }}
              >
                {t('ver.clearFilters')}
              </Button>
            )}
          </div>

          {filtered.length === 0 ? (
            <Empty
              description={t('ver.emptyDescription')}
              className="ver-empty"
            />
          ) : (
            <div className="ver-grid">
              {filtered.map((item) => {
                const isDeleting = deletingId === item.id;
                return (
                  <article key={item.id} className="ver-card">
                    <Link
                      href={`/ver/${item.id}`}
                      className="ver-card__cover-link"
                      prefetch={false}
                    >
                      <div className="ver-card__cover-wrap">
                        {item.imageUrl ? (
                          isSupabaseImageUrl(item.imageUrl) ? (
                            <Image
                              src={item.imageUrl}
                              alt={item.title}
                              fill
                              sizes="(max-width: 600px) 100vw, (max-width: 1024px) 50vw, 33vw"
                              className="ver-card__cover-img"
                              unoptimized
                            />
                          ) : (
                            // imageUrl externa arbitraria, no whitelisteada
                            // en next.config.ts remotePatterns.
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.imageUrl}
                              alt={item.title}
                              className="ver-card__cover-img"
                              loading="lazy"
                            />
                          )
                        ) : (
                          <div className="ver-card__cover-placeholder">
                            <span>{item.title}</span>
                          </div>
                        )}
                        <div className="ver-card__cover-overlay">
                          <PlayCircleFilled className="ver-card__play-icon" />
                          <span className="ver-card__episodes-badge">
                            {t('ver.cardEpisodesBadge', {
                              count: item.episodesWithEmbed,
                            })}
                          </span>
                        </div>
                        {item.geoRestrictedCore && (
                          <span
                            className="ver-card__georestricted-badge"
                            title={t('ver.geoRestrictedBadge')}
                          >
                            🌍 {t('ver.geoRestrictedBadge')}
                          </span>
                        )}
                      </div>
                    </Link>

                    <div className="ver-card__body">
                      <div className="ver-card__header-row">
                        <Link
                          href={`/ver/${item.id}`}
                          className="ver-card__title-link"
                          prefetch={false}
                        >
                          <h3 className="ver-card__title">
                            {item.country?.code && (
                              <CountryFlag code={item.country.code} />
                            )}{' '}
                            {item.title}
                          </h3>
                        </Link>
                        {isAdmin && (
                          <Popconfirm
                            title={t('ver.deleteConfirmTitle')}
                            description={t('ver.deleteConfirmDescription')}
                            onConfirm={() => handleDelete(item.id)}
                            okText={t('ver.deleteConfirmOk')}
                            cancelText={t('ver.deleteConfirmCancel')}
                            okButtonProps={{
                              danger: true,
                              loading: isDeleting,
                            }}
                          >
                            <Button
                              type="text"
                              danger
                              size="small"
                              icon={<DeleteOutlined />}
                              aria-label={t('ver.deleteAriaLabel')}
                            />
                          </Popconfirm>
                        )}
                      </div>

                      <div className="ver-card__meta">
                        {item.year && <span>{item.year}</span>}
                        {item.country?.name && (
                          <span>· {item.country.name}</span>
                        )}
                        {item.platforms.length > 0 && (
                          <span>· {item.platforms.join(', ')}</span>
                        )}
                      </div>

                      {item.synopsis && (
                        <p className="ver-card__synopsis">{item.synopsis}</p>
                      )}

                      <div className="ver-card__footer">
                        <Link href={`/ver/${item.id}`} prefetch={false}>
                          <Button
                            type="primary"
                            icon={<PlayCircleFilled />}
                            block
                          >
                            {t('ver.cardPlayButton')}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
