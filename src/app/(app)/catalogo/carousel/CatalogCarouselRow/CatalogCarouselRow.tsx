'use client';

import { type ReactNode } from 'react';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { useCarouselNav } from '@/hooks/useCarouselNav';
import './CatalogCarouselRow.css';

export interface CatalogCarouselRowProps {
  title: string;
  icon?: ReactNode;
  scrollPrevLabel: string;
  scrollNextLabel: string;
  /** Un elemento por item, ya armado por el caller (reusa las cards de
   *  CatalogoClient) — esta fila solo aporta el scroll horizontal. */
  children: ReactNode;
}

/** Una fila del carrusel de /catalogo: titulo + scroll horizontal + dos
 *  flechas. La mecanica (paginado, extremos, drag con mouse) vive en
 *  `useCarouselNav`, compartida con MediaCarousel (/ver) y
 *  WatchableCarousel; esta fila solo aporta layout y estilo. */
export function CatalogCarouselRow({
  title,
  icon,
  scrollPrevLabel,
  scrollNextLabel,
  children,
}: CatalogCarouselRowProps) {
  const { trackRef, canScrollPrev, canScrollNext, scrollPrev, scrollNext } =
    useCarouselNav();

  return (
    <section className="catalog-carousel-row">
      <div className="catalog-carousel-row__header">
        <h3 className="catalog-carousel-row__title">
          {icon}
          {title}
        </h3>
        <div className="catalog-carousel-row__nav">
          <button
            type="button"
            className={`catalog-carousel-row__nav-btn${canScrollPrev ? '' : ' mb-carousel-arrow--disabled'}`}
            aria-label={scrollPrevLabel}
            aria-disabled={!canScrollPrev}
            disabled={!canScrollPrev}
            onClick={scrollPrev}
          >
            <LeftOutlined />
          </button>
          <button
            type="button"
            className={`catalog-carousel-row__nav-btn${canScrollNext ? '' : ' mb-carousel-arrow--disabled'}`}
            aria-label={scrollNextLabel}
            aria-disabled={!canScrollNext}
            disabled={!canScrollNext}
            onClick={scrollNext}
          >
            <RightOutlined />
          </button>
        </div>
      </div>
      <div className="catalog-carousel-row__track" ref={trackRef}>
        {children}
      </div>
    </section>
  );
}
