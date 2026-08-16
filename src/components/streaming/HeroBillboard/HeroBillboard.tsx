'use client';

import Link from 'next/link';
import { Button, Tag } from 'antd';
import {
  PlayCircleFilled,
  InfoCircleOutlined,
  FireFilled,
  BankOutlined,
  CalendarOutlined,
  YoutubeFilled,
  VideoCameraFilled,
} from '@ant-design/icons';
import { CountryFlag } from '@/components/common/CountryFlag/CountryFlag';
import type { CarouselMediaItem } from '../MediaCarousel/MediaCarousel';
import './HeroBillboard.css';

interface HeroBillboardProps {
  featured: CarouselMediaItem;
}

export function HeroBillboard({ featured }: HeroBillboardProps) {
  if (!featured) return null;

  const hasYoutube = featured.platforms.some((p) =>
    p.toLowerCase().includes('youtube')
  );
  const hasVimeo = featured.platforms.some((p) =>
    p.toLowerCase().includes('vimeo')
  );

  return (
    <div className="hero-billboard">
      {/* Imagen de fondo / Backdrop */}
      <div className="hero-billboard__backdrop-wrap">
        {featured.imageUrl && (
          <img
            src={featured.imageUrl}
            alt={featured.title}
            className="hero-billboard__backdrop"
          />
        )}
        <div className="hero-billboard__gradient-overlay" />
      </div>

      {/* Contenido en primer plano */}
      <div className="hero-billboard__content">
        <div className="hero-billboard__badge-row">
          <span className="hero-billboard__spotlight-badge">
            <FireFilled /> Serie Destacada de la Semana
          </span>
          {hasYoutube && (
            <Tag color="red" icon={<YoutubeFilled />}>
              Emisión Oficial YouTube
            </Tag>
          )}
          {hasVimeo && (
            <Tag color="blue" icon={<VideoCameraFilled />}>
              Vimeo On Demand
            </Tag>
          )}
        </div>

        <h1 className="hero-billboard__title">
          {featured.country?.code && (
            <CountryFlag code={featured.country.code} />
          )}{' '}
          {featured.title}
        </h1>

        <div className="hero-billboard__meta">
          {featured.year && (
            <span className="hero-billboard__meta-item">
              <CalendarOutlined /> {featured.year}
            </span>
          )}
          {featured.channels[0] && (
            <span className="hero-billboard__meta-item">
              <BankOutlined /> {featured.channels[0]}
            </span>
          )}
          <span className="hero-billboard__meta-item hero-billboard__meta-episodes">
            {featured.episodesWithEmbed} Episodios Oficiales
          </span>
        </div>

        {featured.synopsis && (
          <p className="hero-billboard__synopsis">
            {featured.synopsis.length > 220
              ? `${featured.synopsis.slice(0, 215)}...`
              : featured.synopsis}
          </p>
        )}

        <div className="hero-billboard__actions">
          <Link href={`/ver/${featured.id}`} prefetch={false}>
            <Button
              type="primary"
              size="large"
              icon={<PlayCircleFilled />}
              className="hero-billboard__play-btn"
            >
              Reproducir Ahora
            </Button>
          </Link>
          <Link href={`/series/${featured.id}`} prefetch={false}>
            <Button
              size="large"
              icon={<InfoCircleOutlined />}
              className="hero-billboard__info-btn"
            >
              Ficha & Reparto
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
