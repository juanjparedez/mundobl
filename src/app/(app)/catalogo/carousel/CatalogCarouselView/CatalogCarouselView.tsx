'use client';

import type { ReactNode } from 'react';
import { InboxOutlined } from '@ant-design/icons';
import { EmptyState } from '@/components/design-system';
import type { TranslationKey } from '@/i18n/messages';
import { CatalogCarouselRow } from '../CatalogCarouselRow/CatalogCarouselRow';
import {
  CATALOG_CAROUSEL_CATEGORIES,
  CAROUSEL_ROW_MAX_ITEMS,
} from '../catalogCarouselCategories';
import { groupIntoCatalogItems } from '../../catalogGrouping';
import type { SerieData, CatalogItem, UniverseGroup } from '../../catalogTypes';
import './CatalogCarouselView.css';

export interface CatalogCarouselViewProps {
  /** Series ya filtradas por busqueda/filtros de CatalogoClient — el
   *  carrusel solo agrega la curacion por categoria encima. */
  series: SerieData[];
  favoriteIds: Set<string>;
  isLoggedIn: boolean;
  orderedVisibleIds: string[];
  renderSingleCard: (serie: SerieData, index: number) => ReactNode;
  renderUniverseCard: (group: UniverseGroup, index: number) => ReactNode;
  categoryLabel: (labelKey: TranslationKey) => string;
  scrollPrevLabel: string;
  scrollNextLabel: string;
  emptyTitle: string;
}

/** Orquesta el modo carrusel: por cada categoria visible (en el orden
 *  del usuario), filtra `series`, la agrupa si corresponde (sagas), y
 *  la pasa a una CatalogCarouselRow. Categorias que quedan en 0 items
 *  (por el filtro propio + busqueda activa) no se renderizan. */
export function CatalogCarouselView({
  series,
  favoriteIds,
  isLoggedIn,
  orderedVisibleIds,
  renderSingleCard,
  renderUniverseCard,
  categoryLabel,
  scrollPrevLabel,
  scrollNextLabel,
  emptyTitle,
}: CatalogCarouselViewProps) {
  const rows = orderedVisibleIds
    .map((id) => CATALOG_CAROUSEL_CATEGORIES.find((c) => c.id === id))
    .filter((cat): cat is (typeof CATALOG_CAROUSEL_CATEGORIES)[number] => {
      if (!cat) return false;
      if (cat.id === 'favorites' && !isLoggedIn) return false;
      return true;
    })
    .map((cat) => {
      let matched = series.filter((s) => cat.filter(s, favoriteIds));
      if (cat.sort) matched = [...matched].sort(cat.sort);
      matched = matched.slice(0, CAROUSEL_ROW_MAX_ITEMS);

      const items: CatalogItem[] = cat.preferUniverseGroups
        ? groupIntoCatalogItems(matched)
        : matched.map((serie) => ({ type: 'single' as const, serie }));

      return { cat, items };
    })
    .filter(({ items }) => items.length > 0);

  if (rows.length === 0) {
    return (
      <EmptyState icon={<InboxOutlined />} title={emptyTitle} variant="soft" />
    );
  }

  return (
    <div className="catalog-carousel-view">
      {rows.map(({ cat, items }, rowIndex) => {
        const Icon = cat.icon;
        return (
          <CatalogCarouselRow
            key={cat.id}
            title={categoryLabel(cat.labelKey)}
            icon={<Icon />}
            scrollPrevLabel={scrollPrevLabel}
            scrollNextLabel={scrollNextLabel}
          >
            {items.map((item, itemIndex) =>
              item.type === 'universe' ? (
                <div
                  className="catalog-carousel-row__item"
                  key={`universe-${item.universoId}`}
                >
                  {renderUniverseCard(
                    item,
                    rowIndex === 0 ? itemIndex : itemIndex + 4
                  )}
                </div>
              ) : (
                <div className="catalog-carousel-row__item" key={item.serie.id}>
                  {renderSingleCard(
                    item.serie,
                    rowIndex === 0 ? itemIndex : itemIndex + 4
                  )}
                </div>
              )
            )}
          </CatalogCarouselRow>
        );
      })}
    </div>
  );
}
