'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Carousel } from 'antd';
import { PlayCircleFilled } from '@ant-design/icons';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { CountryFlag } from '@/components/common/CountryFlag/CountryFlag';
import { isSupabaseImageUrl } from '@/lib/image-helpers';
import './WatchableCarousel.css';

export interface WatchableCarouselItem {
  id: number;
  title: string;
  imageUrl: string | null;
  imagePosition: string | null;
  year: number | null;
  type: string;
  country: { name: string; code: string | null } | null;
}

interface WatchableCarouselProps {
  items: WatchableCarouselItem[];
  /** Titulo opcional para mostrar arriba del carousel (header). */
  title?: string;
  /** Cantidad de slides visibles por viewport en desktop. Mobile usa 1. */
  slidesPerView?: number;
}

/** Carousel tipo Netflix de series watchable (con embedUrl). Click va a
 *  /ver/[id] (player). Reutilizable en landing, novedades y donde aplique.
 *
 *  Usa Ant Design <Carousel> con autoplay + flechas. En mobile, 1 card por
 *  slide; en desktop, hasta 4. La card es link directo al player. */
export function WatchableCarousel({
  items,
  title,
  slidesPerView = 4,
}: WatchableCarouselProps) {
  const { t } = useLocale();

  if (items.length === 0) return null;

  return (
    <section className="watchable-carousel">
      {title && (
        <header className="watchable-carousel__header">
          <PlayCircleFilled className="watchable-carousel__header-icon" />
          <h2 className="watchable-carousel__title">{title}</h2>
        </header>
      )}
      <Carousel
        dots={items.length > slidesPerView}
        arrows
        autoplay
        autoplaySpeed={5000}
        slidesToShow={slidesPerView}
        slidesToScroll={1}
        infinite
        responsive={[
          {
            breakpoint: 1200,
            settings: { slidesToShow: 3, slidesToScroll: 1 },
          },
          { breakpoint: 900, settings: { slidesToShow: 2, slidesToScroll: 1 } },
          { breakpoint: 600, settings: { slidesToShow: 1, slidesToScroll: 1 } },
        ]}
      >
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/ver/${item.id}`}
            className="watchable-carousel__slide"
            prefetch={false}
          >
            <div
              className="watchable-carousel__cover"
              style={{
                objectPosition: item.imagePosition ?? 'center',
              }}
            >
              {item.imageUrl ? (
                isSupabaseImageUrl(item.imageUrl) ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    fill
                    sizes="(max-width: 600px) 100vw, 25vw"
                    style={{ objectFit: 'cover' }}
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="watchable-carousel__img"
                  />
                )
              ) : (
                <div className="watchable-carousel__cover-placeholder" />
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
      </Carousel>
    </section>
  );
}
