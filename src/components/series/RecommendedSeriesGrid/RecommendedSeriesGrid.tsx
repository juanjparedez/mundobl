'use client';

import type { ReactNode } from 'react';
import { MediaCard, SectionHeader } from '@/components/design-system';
import { cardImageUrl, isDirectServedImageUrl } from '@/lib/image-helpers';
import { getSeriesUrl } from '@/lib/slug';
import type { RecommendedSeriesCard } from '@/lib/recommendations';
import './RecommendedSeriesGrid.css';

export interface RecommendedSeriesGridProps {
  /** Ya traducido por quien lo usa. */
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  series: RecommendedSeriesCard[];
  /** "Porque viste X", ya traducido. Sin esto no se muestra el motivo. */
  becauseLabel?: (title: string) => string;
  /** Ancla para saltar desde el panel de seguimiento. */
  id?: string;
}

/** Grilla de series sugeridas: la ficha ("Si te gusto esta") y /watching. */
export function RecommendedSeriesGrid({
  title,
  subtitle,
  icon,
  series,
  becauseLabel,
  id,
}: RecommendedSeriesGridProps) {
  if (series.length === 0) return null;
  return (
    <section id={id} className="recommended-series">
      <SectionHeader title={title} subtitle={subtitle} icon={icon} />
      <ul className="recommended-series__grid">
        {series.map((serie) => {
          const image = cardImageUrl(serie);
          return (
            <li key={serie.id}>
              <MediaCard
                href={getSeriesUrl(serie.id, serie.title)}
                imageUrl={image}
                imageAlt={serie.title}
                unoptimizedImage={isDirectServedImageUrl(image)}
                title={serie.title}
                subtitle={
                  [serie.year ? String(serie.year) : null, serie.countryName]
                    .filter(Boolean)
                    .join(' · ') || undefined
                }
                description={
                  becauseLabel && serie.becauseOf
                    ? becauseLabel(serie.becauseOf.title)
                    : undefined
                }
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
