'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { Button, Empty, Input, Select, Tag, Alert } from 'antd';
import {
  PlayCircleFilled,
  PlusOutlined,
  SearchOutlined,
  YoutubeOutlined,
} from '@ant-design/icons';
import { CountryFlag } from '@/components/common/CountryFlag/CountryFlag';
import { isSupabaseImageUrl } from '@/lib/image-helpers';

interface VerItem {
  id: number;
  title: string;
  year: number | null;
  type: string;
  imageUrl: string | null;
  synopsis: string | null;
  catalogScope: string;
  origin: string;
  submittedByNickname: string | null;
  country: { name: string; code: string | null } | null;
  episodesWithEmbed: number;
  platforms: string[];
  channels: string[];
}

interface VerPageProps {
  items: VerItem[];
}

export function VerPage({ items }: VerPageProps) {
  const { status } = useSession();
  const isAuthenticated = status === 'authenticated';
  const [search, setSearch] = useState('');
  const [country, setCountry] = useState<string | null>(null);
  const [platform, setPlatform] = useState<string | null>(null);
  const [onlyCurated, setOnlyCurated] = useState(false);

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

  return (
    <div className="ver-content">
      <header className="ver-hero">
        <h1 className="ver-hero__title">
          <PlayCircleFilled /> Ver series completas
        </h1>
        <p className="ver-hero__subtitle">
          Series y películas BL/GL que se pueden mirar embebidas desde los
          canales oficiales de las productoras.
        </p>
        {isAuthenticated && (
          <div className="ver-hero__cta">
            <Link href="/ver/agregar" prefetch={false}>
              <Button type="primary" icon={<PlusOutlined />}>
                Agregar una serie
              </Button>
            </Link>
          </div>
        )}
      </header>

      <Alert
        type="info"
        showIcon
        className="ver-disclaimer"
        title="Contenido reproducido desde plataformas oficiales"
        description={
          <span>
            Todos los videos son embebidos desde canales oficiales (YouTube,
            Vimeo, etc.) y los derechos pertenecen a sus titulares. MundoBL no
            hostea ningún video. <Link href="/legal">Ver aviso completo</Link>.
          </span>
        }
      />

      <div className="ver-filters">
        <Input
          allowClear
          size="large"
          prefix={<SearchOutlined />}
          placeholder="Buscar serie..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="ver-filters__search"
        />
        <Select
          allowClear
          size="large"
          placeholder="País"
          value={country}
          onChange={(v) => setCountry(v ?? null)}
          options={countries.map((c) => ({ value: c, label: c }))}
          className="ver-filters__select"
        />
        <Select
          allowClear
          size="large"
          placeholder="Plataforma"
          value={platform}
          onChange={(v) => setPlatform(v ?? null)}
          options={platforms.map((p) => ({ value: p, label: p }))}
          className="ver-filters__select"
        />
        <Button
          size="large"
          type={onlyCurated ? 'primary' : 'default'}
          onClick={() => setOnlyCurated((v) => !v)}
          className="ver-filters__toggle"
        >
          Solo curadas por Flor
        </Button>
      </div>

      <p className="ver-count">
        {filtered.length} {filtered.length === 1 ? 'serie' : 'series'}{' '}
        disponibles
      </p>

      {filtered.length === 0 ? (
        <Empty description="No hay series disponibles con esos filtros" />
      ) : (
        <div className="ver-grid">
          {filtered.map((item) => (
            <Link
              key={item.id}
              href={`/ver/${item.id}`}
              className="ver-card"
              prefetch={false}
            >
              <div className="ver-card__cover">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    width={300}
                    height={420}
                    sizes="(max-width: 600px) 50vw, 300px"
                    quality={70}
                    unoptimized={isSupabaseImageUrl(item.imageUrl)}
                  />
                ) : (
                  <div className="ver-card__cover-placeholder">
                    <PlayCircleFilled />
                  </div>
                )}
                <div className="ver-card__play-overlay" aria-hidden>
                  <PlayCircleFilled />
                </div>
                {item.country?.code && (
                  <span className="ver-card__flag">
                    <CountryFlag code={item.country.code} />
                  </span>
                )}
                {item.catalogScope === 'PERSONAL' && (
                  <span
                    className="ver-card__personal-badge"
                    title="También está en mi catálogo personal"
                  >
                    ★
                  </span>
                )}
                {item.origin === 'USER_EMBED' && item.submittedByNickname && (
                  <span
                    className="ver-card__submitted-badge"
                    title={`Aportado por @${item.submittedByNickname}`}
                  >
                    @{item.submittedByNickname}
                  </span>
                )}
              </div>
              <div className="ver-card__info">
                <h3 className="ver-card__title">{item.title}</h3>
                <div className="ver-card__meta">
                  {item.year && <span>{item.year}</span>}
                  {item.country?.name && <span>· {item.country.name}</span>}
                </div>
                <div className="ver-card__tags">
                  <Tag color="blue">
                    {item.episodesWithEmbed}{' '}
                    {item.episodesWithEmbed === 1 ? 'episodio' : 'episodios'}
                  </Tag>
                  {item.platforms.includes('YouTube') && (
                    <Tag color="red" icon={<YoutubeOutlined />}>
                      YouTube
                    </Tag>
                  )}
                </div>
                {item.channels.length > 0 && (
                  <span className="ver-card__channels">
                    Vía {item.channels.slice(0, 2).join(', ')}
                    {item.channels.length > 2 ? '...' : ''}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
