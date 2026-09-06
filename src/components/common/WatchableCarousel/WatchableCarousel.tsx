'use client';

import Link from 'next/link';
import {
  PlayCircleFilled,
  LeftOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { CountryFlag } from '@/components/common/CountryFlag/CountryFlag';
import { useCarouselNav } from '@/hooks/useCarouselNav';
import { cardImageUrl } from '@/lib/image-helpers';
import { getVerUrl } from '@/lib/slug';
import './WatchableCarousel.css';

export interface WatchableCarouselItem {
  id: number;
  title: string;
  imageUrl: string | null;
  imageThumbUrl?: string | null;
  imagePosition: string | null;
  year: number | null;
  type: string;
  country: { name: string; code: string | null } | null;
}

interface WatchableCarouselProps {
  items: WatchableCarouselItem[];
  /** Titulo opcional para mostrar arriba del carousel (header). */
  title?: string;
}

/** Carrusel tipo Netflix de series watchable (con embedUrl). Click va a
 *  /ver/[id] (player). Reutilizable en landing, novedades y donde aplique.
 *
 *  Implementado como scroll horizontal con scroll-snap (NO AntD Carousel —
 *  ese con slidesToShow rendereaba 1 card a pantalla completa con
 *  aspect-ratio 2:3 gigante, bug fine_tunning_3 #3). Cada card tiene ancho
 *  fijo y poster 2:3 chico. El usuario scrollea con el dedo / trackpad. */
export function WatchableCarousel({ items, title }: WatchableCarouselProps) {
  const { t } = useLocale();
  // Scroll por "paginas" (75% del ancho visible), estado de los extremos y
  // drag con mouse — compartido con MediaCarousel y CatalogCarouselRow. El
  // scrollbar nativo se oculta via CSS (fea, gorda y desalineada con el
  // tema en algunos navegadores) y estas flechas quedan como affordance.
  const { trackRef, canScrollPrev, canScrollNext, scrollPrev, scrollNext } =
    useCarouselNav();

  if (items.length === 0) return null;

  return (
    <section className="watchable-carousel">
      {title && (
        <header className="watchable-carousel__header">
          <div className="watchable-carousel__header-titlewrap">
            <PlayCircleFilled className="watchable-carousel__header-icon" />
            <h2 className="watchable-carousel__title">{title}</h2>
          </div>
          <div className="watchable-carousel__nav-buttons">
            <button
              type="button"
              className={`watchable-carousel__arrow${canScrollPrev ? '' : ' mb-carousel-arrow--disabled'}`}
              onClick={scrollPrev}
              aria-label={t('watchableCarousel.scrollPrev')}
              aria-disabled={!canScrollPrev}
              disabled={!canScrollPrev}
            >
              <LeftOutlined />
            </button>
            <button
              type="button"
              className={`watchable-carousel__arrow${canScrollNext ? '' : ' mb-carousel-arrow--disabled'}`}
              onClick={scrollNext}
              aria-label={t('watchableCarousel.scrollNext')}
              aria-disabled={!canScrollNext}
              disabled={!canScrollNext}
            >
              <RightOutlined />
            </button>
          </div>
        </header>
      )}
      <div className="watchable-carousel__track" ref={trackRef}>
        {items.map((item) => (
          <Link
            key={item.id}
            href={getVerUrl(item.id, item.title)}
            className="watchable-carousel__slide"
            prefetch={false}
          >
            <div className="watchable-carousel__cover">
              {cardImageUrl(item) ? (
                // <img> regular en vez de next/image: las portadas de
                // series pueden venir de cualquier CDN (YouTube thumbs,
                // etc.) que no esta en remotePatterns. next/image fallaba
                // silenciosamente -> "sin imagen" (bug fine_tunning_3 #3).
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={cardImageUrl(item)!}
                  alt={item.title}
                  loading="lazy"
                  className="watchable-carousel__img"
                  style={{ objectPosition: item.imagePosition ?? 'center' }}
                />
              ) : (
                <div className="watchable-carousel__cover-placeholder">
                  <PlayCircleFilled className="watchable-carousel__cover-placeholder-icon" />
                  <span className="watchable-carousel__cover-placeholder-title">
                    {item.title}
                  </span>
                </div>
              )}
              <div className="watchable-carousel__overlay">
                <PlayCircleFilled className="watchable-carousel__play-icon" />
                <span className="watchable-carousel__cta">
                  {t('watchableCarousel.watchNow')}
                </span>
              </div>
            </div>
            <div className="watchable-carousel__meta">
              <div className="watchable-carousel__series-title">
                {item.title}
              </div>
              <div className="watchable-carousel__series-sub">
                {item.country?.code && (
                  <CountryFlag code={item.country.code} size="small" />
                )}
                <span>{item.country?.name ?? ''}</span>
                {item.year && <span>· {item.year}</span>}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
