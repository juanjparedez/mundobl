'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  LeftOutlined,
  RightOutlined,
  PlayCircleFilled,
  YoutubeFilled,
  VideoCameraFilled,
  GlobalOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { CountryFlag } from '@/components/common/CountryFlag/CountryFlag';
import { useCarouselNav } from '@/hooks/useCarouselNav';
import type { ListPreviewBinding } from '@/components/design-system';
import { isDirectServedImageUrl, cardImageUrl } from '@/lib/image-helpers';
import { getVerUrl } from '@/lib/slug';
import './MediaCarousel.css';

export interface CarouselMediaItem {
  id: number;
  title: string;
  year: number | null;
  type: string;
  imageUrl: string | null;
  imageThumbUrl?: string | null;
  synopsis: string | null;
  country: { name: string; code: string | null } | null;
  episodesWithEmbed: number;
  /** De esos embeds, cuantos se pueden mirar en el mercado del visitante
   *  (ver Episode.playback y src/lib/playability.ts). Menor que
   *  `episodesWithEmbed` = la serie esta incompleta aca. */
  playableEpisodes?: number;
  platforms: string[];
  channels: string[];
  /** Bloqueada en el mercado core del sitio (AR/MX/ES/CL/CO/PE/US) —
   *  muestra un aviso ANTES del click. Ver Series.geoRestrictedCore. */
  geoRestrictedCore?: boolean;
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
  /** Texto del aviso "puede estar bloqueada en tu región" — mismo criterio
   *  de i18n que episodesBadgeLabel. */
  geoRestrictedLabel?: string;
  /** Vista rapida. Cuando esta, cada card suma el boton del ojo y el
   *  hover-preview: sinopsis, plataformas y datos sin abandonar la fila.
   *  El caller arma la data porque es quien tiene i18n y rutas. */
  preview?: ListPreviewBinding<CarouselMediaItem>;
}

export function MediaCarousel({
  title,
  subtitle,
  icon,
  items,
  scrollPrevLabel,
  scrollNextLabel,
  episodesBadgeLabel,
  geoRestrictedLabel,
  preview,
}: MediaCarouselProps) {
  const { trackRef, canScrollPrev, canScrollNext, scrollPrev, scrollNext } =
    useCarouselNav();

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
            className={`media-carousel__arrow media-carousel__arrow--prev${canScrollPrev ? '' : ' mb-carousel-arrow--disabled'}`}
            onClick={scrollPrev}
            aria-label={scrollPrevLabel}
            aria-disabled={!canScrollPrev}
            disabled={!canScrollPrev}
          >
            <LeftOutlined />
          </button>
          <button
            type="button"
            className={`media-carousel__arrow media-carousel__arrow--next${canScrollNext ? '' : ' mb-carousel-arrow--disabled'}`}
            onClick={scrollNext}
            aria-label={scrollNextLabel}
            aria-disabled={!canScrollNext}
            disabled={!canScrollNext}
          >
            <RightOutlined />
          </button>
        </div>
      </div>

      <div className="media-carousel__track-wrap">
        <div className="media-carousel__track" ref={trackRef}>
          {items.map((item) => {
            const hasYoutube = item.platforms.some((p) =>
              p.toLowerCase().includes('youtube')
            );
            const hasVimeo = item.platforms.some((p) =>
              p.toLowerCase().includes('vimeo')
            );

            return (
              <div
                key={item.id}
                className="media-carousel__card-wrap"
                {...(preview?.api.previewTriggerProps(() =>
                  preview.build(item)
                ) ?? {})}
              >
                {/* El boton de vista rapida es hermano del <Link>, no hijo:
                 *  un <button> dentro de un <a> es HTML invalido (contenido
                 *  interactivo anidado). */}
                {preview && (
                  <button
                    type="button"
                    className="media-carousel__preview-btn"
                    aria-label={preview.openLabel}
                    title={preview.openLabel}
                    onClick={() =>
                      preview.api.openPreview(() => preview.build(item))
                    }
                  >
                    <EyeOutlined />
                  </button>
                )}
                <Link
                  href={getVerUrl(item.id, item.title)}
                  prefetch={false}
                  className="media-carousel__card"
                >
                  <div
                    className={`media-carousel__poster-wrap${
                      preview
                        ? ' media-carousel__poster-wrap--with-preview'
                        : ''
                    }`}
                  >
                    {cardImageUrl(item) ? (
                      isDirectServedImageUrl(cardImageUrl(item)) ? (
                        <Image
                          src={cardImageUrl(item)!}
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
                          src={cardImageUrl(item)!}
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

                    {/* Aviso de bloqueo regional — visible ANTES del click,
                     *  no solo cuando ya estas en el player. */}
                    {item.geoRestrictedCore && geoRestrictedLabel && (
                      <span
                        className="media-carousel__georestricted-badge"
                        title={geoRestrictedLabel}
                      >
                        <GlobalOutlined /> {geoRestrictedLabel}
                      </span>
                    )}
                  </div>

                  <div className="media-carousel__info">
                    <h3
                      className="media-carousel__item-title"
                      title={item.title}
                    >
                      {item.country?.code && (
                        <CountryFlag code={item.country.code} />
                      )}{' '}
                      {item.title}
                    </h3>
                    <div className="media-carousel__meta">
                      {item.year && (
                        <span className="media-carousel__year">
                          {item.year}
                        </span>
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
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
