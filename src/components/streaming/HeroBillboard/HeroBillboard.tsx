'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button, Tag, Tooltip } from 'antd';
import {
  PlayCircleFilled,
  InfoCircleOutlined,
  FireFilled,
  BankOutlined,
  CalendarOutlined,
  YoutubeFilled,
  VideoCameraFilled,
  UpOutlined,
  DownOutlined,
} from '@ant-design/icons';
import { CountryFlag } from '@/components/common/CountryFlag/CountryFlag';
import { isSupabaseImageUrl } from '@/lib/image-helpers';
import type { CarouselMediaItem } from '../MediaCarousel/MediaCarousel';
import './HeroBillboard.css';

interface HeroBillboardProps {
  featured: CarouselMediaItem;
  collapsed: boolean;
  onToggleCollapse: () => void;
  spotlightBadgeLabel: string;
  youtubeTagLabel: string;
  vimeoTagLabel: string;
  episodesBadgeLabel: string;
  playButtonLabel: string;
  infoButtonLabel: string;
  collapseTooltip: string;
  expandTooltip: string;
  geoRestrictedLabel?: string;
}

/** Hero destacado de /ver. Colapsable: en vez de desaparecer del todo,
 *  se reduce a una tira delgada (titulo + bandera + acceso rapido a
 *  reproducir) para que el usuario no pierda el rastro de que existe
 *  mientras recupera espacio vertical para el resto del contenido. El
 *  estado de colapso lo maneja y persiste el caller (VerPage). */
export function HeroBillboard({
  featured,
  collapsed,
  onToggleCollapse,
  spotlightBadgeLabel,
  youtubeTagLabel,
  vimeoTagLabel,
  episodesBadgeLabel,
  playButtonLabel,
  infoButtonLabel,
  collapseTooltip,
  expandTooltip,
  geoRestrictedLabel,
}: HeroBillboardProps) {
  if (!featured) return null;

  if (collapsed) {
    return (
      <div className="hero-billboard hero-billboard--collapsed">
        <span className="hero-billboard__strip-title">
          {featured.country?.code && (
            <CountryFlag code={featured.country.code} />
          )}{' '}
          {featured.title}
        </span>
        <div className="hero-billboard__strip-actions">
          <Link href={`/ver/${featured.id}`} prefetch={false}>
            <Button
              type="text"
              size="small"
              icon={<PlayCircleFilled />}
              aria-label={playButtonLabel}
              className="hero-billboard__strip-play-btn"
            />
          </Link>
          <Tooltip title={expandTooltip}>
            <Button
              type="text"
              size="small"
              icon={<DownOutlined />}
              onClick={onToggleCollapse}
              aria-label={expandTooltip}
            />
          </Tooltip>
        </div>
      </div>
    );
  }

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
        {featured.imageUrl &&
          (isSupabaseImageUrl(featured.imageUrl) ? (
            <Image
              src={featured.imageUrl}
              alt={featured.title}
              fill
              sizes="100vw"
              unoptimized
              className="hero-billboard__backdrop"
            />
          ) : (
            // imageUrl puede ser una URL externa arbitraria (pegada a mano
            // en el admin, o donde fallo el re-hosteo a Supabase) que no
            // esta necesariamente en next.config.ts remotePatterns.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={featured.imageUrl}
              alt={featured.title}
              className="hero-billboard__backdrop"
            />
          ))}
        <div className="hero-billboard__gradient-overlay" />
      </div>

      <Tooltip title={collapseTooltip}>
        <Button
          type="text"
          size="small"
          icon={<UpOutlined />}
          onClick={onToggleCollapse}
          aria-label={collapseTooltip}
          className="hero-billboard__collapse-btn"
        />
      </Tooltip>

      {/* Contenido en primer plano */}
      <div className="hero-billboard__content">
        <div className="hero-billboard__badge-row">
          <span className="hero-billboard__spotlight-badge">
            <FireFilled /> {spotlightBadgeLabel}
          </span>
          {hasYoutube && (
            <Tag color="red" icon={<YoutubeFilled />}>
              {youtubeTagLabel}
            </Tag>
          )}
          {hasVimeo && (
            <Tag color="blue" icon={<VideoCameraFilled />}>
              {vimeoTagLabel}
            </Tag>
          )}
          {featured.geoRestrictedCore && geoRestrictedLabel && (
            <Tag color="warning">{geoRestrictedLabel}</Tag>
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
            {episodesBadgeLabel}
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
              {playButtonLabel}
            </Button>
          </Link>
          <Link href={`/series/${featured.id}`} prefetch={false}>
            <Button
              size="large"
              icon={<InfoCircleOutlined />}
              className="hero-billboard__info-btn"
            >
              {infoButtonLabel}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
