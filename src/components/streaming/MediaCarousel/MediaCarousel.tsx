'use client';

import { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  LeftOutlined,
  RightOutlined,
  PlayCircleFilled,
  YoutubeFilled,
  VideoCameraFilled,
} from '@ant-design/icons';
import { CountryFlag } from '@/components/common/CountryFlag/CountryFlag';
import { isSupabaseImageUrl } from '@/lib/image-helpers';
import './MediaCarousel.css';

export interface CarouselMediaItem {
  id: number;
  title: string;
  year: number | null;
  type: string;
  imageUrl: string | null;
  synopsis: string | null;
  country: { name: string; code: string | null } | null;
  episodesWithEmbed: number;
  platforms: string[];
  channels: string[];
}

interface MediaCarouselProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  items: CarouselMediaItem[];
  scrollPrevLabel: string;
  scrollNextLabel: string;
  /** Caller resuelve el texto del badge por item (ya interpolado con
   *  el count) — este componente no conoce i18n. */
  episodesBadgeLabel: (count: number) => string;
}

export function MediaCarousel({
  title,
  subtitle,
  icon,
  items,
  scrollPrevLabel,
  scrollNextLabel,
  episodesBadgeLabel,
}: MediaCarouselProps) {
  const rowRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!rowRef.current) return;
    const { scrollLeft, clientWidth } = rowRef.current;
    const scrollAmount = clientWidth * 0.75;
    rowRef.current.scrollTo({
      left:
        direction === 'left'
          ? scrollLeft - scrollAmount
          : scrollLeft + scrollAmount,
      behavior: 'smooth',
    });
  };

  if (!items || items.length === 0) return null;

  return (
    <section className="media-carousel">
      <div className="media-carousel__head">
        <div className="media-carousel__titles">
          <h2 className="media-carousel__title">
            {icon && <span className="media-carousel__icon">{icon}</span>}
            {title}
          </h2>
          {subtitle && <p className="media-carousel__subtitle">{subtitle}</p>}
        </div>
        <div className="media-carousel__nav-buttons">
          <button
            type="button"
            className="media-carousel__arrow media-carousel__arrow--prev"
            onClick={() => handleScroll('left')}
            aria-label={scrollPrevLabel}
          >
            <LeftOutlined />
          </button>
          <button
            type="button"
            className="media-carousel__arrow media-carousel__arrow--next"
            onClick={() => handleScroll('right')}
            aria-label={scrollNextLabel}
          >
            <RightOutlined />
          </button>
        </div>
      </div>

      <div className="media-carousel__track-wrap">
        <div className="media-carousel__track" ref={rowRef}>
          {items.map((item) => {
            const hasYoutube = item.platforms.some((p) =>
              p.toLowerCase().includes('youtube')
            );
            const hasVimeo = item.platforms.some((p) =>
              p.toLowerCase().includes('vimeo')
            );

            return (
              <Link
                key={item.id}
                href={`/ver/${item.id}`}
                prefetch={false}
                className="media-carousel__card"
              >
                <div className="media-carousel__poster-wrap">
                  {item.imageUrl ? (
                    isSupabaseImageUrl(item.imageUrl) ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.title}
                        fill
                        sizes="(max-width: 768px) 160px, 200px"
                        unoptimized
                        className="media-carousel__poster"
                      />
                    ) : (
                      // imageUrl puede ser una URL externa arbitraria no
                      // whitelisteada en next.config.ts remotePatterns.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="media-carousel__poster"
                        loading="lazy"
                      />
                    )
                  ) : (
                    <div className="media-carousel__poster-placeholder">
                      <span>{item.title}</span>
                    </div>
                  )}

                  <div className="media-carousel__overlay">
                    <PlayCircleFilled className="media-carousel__play-btn" />
                    <span className="media-carousel__episodes-badge">
                      {episodesBadgeLabel(item.episodesWithEmbed)}
                    </span>
                  </div>

                  {/* Badges de plataforma en la esquina superior */}
                  <div className="media-carousel__platform-tag">
                    {hasYoutube && (
                      <YoutubeFilled
                        style={{ color: '#ff0000', fontSize: '1.1rem' }}
                      />
                    )}
                    {hasVimeo && (
                      <VideoCameraFilled
                        style={{ color: '#1ab7ea', fontSize: '1.1rem' }}
                      />
                    )}
                  </div>
                </div>

                <div className="media-carousel__info">
                  <h3 className="media-carousel__item-title" title={item.title}>
                    {item.country?.code && (
                      <CountryFlag code={item.country.code} />
                    )}{' '}
                    {item.title}
                  </h3>
                  <div className="media-carousel__meta">
                    {item.year && (
                      <span className="media-carousel__year">{item.year}</span>
                    )}
                    {item.channels[0] && (
                      <span
                        className="media-carousel__channel"
                        title={item.channels[0]}
                      >
                        {item.channels[0]}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
