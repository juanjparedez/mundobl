'use client';

import { useRef, type ReactNode } from 'react';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
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
 *  flechas. Mecanica calcada de MediaCarousel (/ver) — mismo scroll por
 *  clientWidth*0.75 — pero componente propio de catalogo, sin depender
 *  de esa forma de datos. */
export function CatalogCarouselRow({
  title,
  icon,
  scrollPrevLabel,
  scrollNextLabel,
  children,
}: CatalogCarouselRowProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  const scrollByDirection = (direction: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({
      left: direction * el.clientWidth * 0.75,
      behavior: 'smooth',
    });
  };

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
            className="catalog-carousel-row__nav-btn"
            aria-label={scrollPrevLabel}
            onClick={() => scrollByDirection(-1)}
          >
            <LeftOutlined />
          </button>
          <button
            type="button"
            className="catalog-carousel-row__nav-btn"
            aria-label={scrollNextLabel}
            onClick={() => scrollByDirection(1)}
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
