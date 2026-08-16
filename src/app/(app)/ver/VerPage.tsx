'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button, Empty, Input, Select, Tag, Popconfirm, Segmented } from 'antd';
import {
  PlayCircleFilled,
  PlusOutlined,
  SearchOutlined,
  DeleteOutlined,
  FireFilled,
  AppstoreOutlined,
  BarsOutlined,
  VideoCameraFilled,
  YoutubeFilled,
  GlobalOutlined,
} from '@ant-design/icons';
import { CountryFlag } from '@/components/common/CountryFlag/CountryFlag';
import { useMessage } from '@/hooks/useMessage';
import { isSupabaseImageUrl } from '@/lib/image-helpers';
import { HeroBillboard } from '@/components/streaming/HeroBillboard/HeroBillboard';
import {
  MediaCarousel,
  type CarouselMediaItem,
} from '@/components/streaming/MediaCarousel/MediaCarousel';

interface VerItem extends CarouselMediaItem {
  catalogScope: string;
  origin: string;
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

  const [search, setSearch] = useState('');
  const [country, setCountry] = useState<string | null>(null);
  const [platform, setPlatform] = useState<string | null>(null);
  const [onlyCurated, setOnlyCurated] = useState(false);
  const [viewMode, setViewMode] = useState<'streaming' | 'grid'>('streaming');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/series/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('delete failed');
      message.success('Serie eliminada');
      router.refresh();
    } catch (err) {
      console.error(err);
      message.error('Error al eliminar la serie');
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

  // Serie destacada para el Hero Billboard (ej: 2gether, We Are o la primera con poster)
  const featured = useMemo(() => {
    return (
      items.find(
        (i) =>
          i.imageUrl &&
          (i.title.toLowerCase().includes('2gether') ||
            i.title.toLowerCase().includes('we are') ||
            i.title.toLowerCase().includes('cutie pie'))
      ) ||
      items.find((i) => i.imageUrl) ||
      items[0]
    );
  }, [items]);

  // Agrupaciones para Carruseles Temáticos
  const trendingSeries = useMemo(() => {
    return items.slice(0, 10);
  }, [items]);

  const thaiSeries = useMemo(() => {
    return items.filter(
      (i) =>
        i.country?.code === 'th' ||
        i.country?.name?.toLowerCase().includes('tailandia')
    );
  }, [items]);

  const koreanSeries = useMemo(() => {
    return items.filter(
      (i) =>
        i.country?.code === 'kr' ||
        i.country?.name?.toLowerCase().includes('corea')
    );
  }, [items]);

  const vimeoAndIndie = useMemo(() => {
    return items.filter((i) =>
      i.platforms.some((p) => p.toLowerCase().includes('vimeo'))
    );
  }, [items]);

  const isFiltering = Boolean(search || country || platform || onlyCurated);

  return (
    <div className="ver-content">
      {/* Hero Billboard Principal (cuando no hay filtro activo y en modo streaming) */}
      {!isFiltering && viewMode === 'streaming' && featured && (
        <HeroBillboard featured={featured} />
      )}

      {/* Barra de Control, Búsqueda y Filtros de Streaming */}
      <div className="ver-control-bar">
        <div className="ver-control-bar__search-wrap">
          <Input
            prefix={
              <SearchOutlined style={{ color: 'var(--text-secondary)' }} />
            }
            placeholder="Buscar series, productoras o títulos oficiales..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
            size="large"
            className="ver-control-bar__search"
          />
        </div>

        <div className="ver-control-bar__filters">
          <Select
            allowClear
            placeholder="🌍 Todos los países"
            value={country}
            onChange={setCountry}
            className="ver-filter-select"
            size="middle"
            options={countries.map((c) => ({ label: c, value: c }))}
          />

          <Select
            allowClear
            placeholder="🎬 Plataforma"
            value={platform}
            onChange={setPlatform}
            className="ver-filter-select"
            size="middle"
            options={platforms.map((p) => ({ label: p, value: p }))}
          />

          <Segmented
            value={viewMode}
            onChange={(v) => setViewMode(v as 'streaming' | 'grid')}
            options={[
              {
                label: 'Carruseles',
                value: 'streaming',
                icon: <BarsOutlined />,
              },
              {
                label: 'Rejilla',
                value: 'grid',
                icon: <AppstoreOutlined />,
              },
            ]}
          />

          {isAuthenticated && (
            <Link href="/ver/agregar" prefetch={false}>
              <Button type="primary" icon={<PlusOutlined />}>
                Aportar Serie
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* VISTA 1: MODO STREAMING (Carruseles Temáticos) */}
      {viewMode === 'streaming' && !isFiltering && (
        <div className="ver-streaming-view">
          <MediaCarousel
            title="Tendencias & Éxitos Destacados"
            subtitle="Las producciones más seguidas con episodios oficiales completos"
            icon={<FireFilled style={{ color: '#ff4d4f' }} />}
            items={trendingSeries}
          />

          {thaiSeries.length > 0 && (
            <MediaCarousel
              title="Tailandia Oficial (GMMTV & Mandee)"
              subtitle="Emisión legal semanal con subtítulos oficiales en español"
              icon={<span style={{ fontSize: '1.2rem' }}>🇹🇭</span>}
              items={thaiSeries}
            />
          )}

          {koreanSeries.length > 0 && (
            <MediaCarousel
              title="K-BLs & Cine Coreano (Strongberry / Indie)"
              subtitle="Cortometrajes premiados y producciones de autor de Corea del Sur"
              icon={<span style={{ fontSize: '1.2rem' }}>🇰🇷</span>}
              items={koreanSeries}
            />
          )}

          {vimeoAndIndie.length > 0 && (
            <MediaCarousel
              title="Vimeo On Demand & Cine Independiente"
              subtitle="Obras de realizadores independientes que apoyan el cine queer"
              icon={<VideoCameraFilled style={{ color: '#1ab7ea' }} />}
              items={vimeoAndIndie}
            />
          )}
        </div>
      )}

      {/* VISTA 2: MODO REJILLA (o cuando hay un filtro/búsqueda activo) */}
      {(viewMode === 'grid' || isFiltering) && (
        <div className="ver-grid-view">
          <div className="ver-grid-view__head">
            <h2 className="ver-grid-view__title">
              {isFiltering
                ? 'Resultados de Búsqueda'
                : 'Catálogo Completo para Ver'}{' '}
              ({filtered.length})
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
                Limpiar filtros
              </Button>
            )}
          </div>

          {filtered.length === 0 ? (
            <Empty
              description="No encontramos series con esos filtros. Probá buscando por otro país o título."
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
                            {item.episodesWithEmbed}{' '}
                            {item.episodesWithEmbed === 1 ? 'video' : 'videos'}
                          </span>
                        </div>
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
                            title="¿Eliminar serie?"
                            description="Se borrará la serie y todos sus episodios embebidos."
                            onConfirm={() => handleDelete(item.id)}
                            okText="Sí, eliminar"
                            cancelText="Cancelar"
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
                              aria-label="Eliminar serie"
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
                            Reproducir
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
