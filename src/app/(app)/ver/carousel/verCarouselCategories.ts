import type { ComponentType } from 'react';
import { ClockCircleOutlined } from '@ant-design/icons';
import type { TranslationKey } from '@/i18n/messages';
import type { CarouselMediaItem } from '@/components/streaming/MediaCarousel/MediaCarousel';

/** VerItem trae lo mismo que CarouselMediaItem + origin (ya presente en
 *  el mapeo de page.tsx) + createdAt (agregado por esta misma pasada). */
export interface VerCategoryItem extends CarouselMediaItem {
  origin: string;
  createdAt?: string;
}

export interface VerCarouselCategoryDef {
  /** id estable — se persiste en localStorage (orden/visibilidad), no
   *  renombrar sin pensar en usuarios con preferencia guardada. */
  id: string;
  labelKey: TranslationKey;
  /** Un componente (ej. ClockCircleOutlined) o una funcion-componente
   *  que devuelve un emoji — ambos son ComponentType validos. */
  icon: ComponentType;
  filter: (item: VerCategoryItem) => boolean;
  sort?: (a: VerCategoryItem, b: VerCategoryItem) => number;
}

/** Pool de categorias curadas a mano para /ver — reemplaza los 4
 *  useMemo ad-hoc que vivian en VerPage.tsx (uno de ellos, "Tendencias",
 *  ni siquiera tenia una señal real: era `items.slice(0, 10)`). El
 *  usuario elige cuales ver y en que orden desde ReorderConfigDrawer
 *  (src/components/carousel/) — este array es solo el default. Con el
 *  catalogo mirable actual (~24 series con embed), 5 categorias es
 *  suficiente sin competir demasiado por poco contenido. */
export const VER_CAROUSEL_CATEGORIES: VerCarouselCategoryDef[] = [
  {
    id: 'recentlyAdded',
    labelKey: 'ver.categoryRecentlyAdded',
    icon: ClockCircleOutlined,
    filter: () => true,
    sort: (a, b) =>
      (b.createdAt ? Date.parse(b.createdAt) : 0) -
      (a.createdAt ? Date.parse(a.createdAt) : 0),
  },
  {
    id: 'thailand',
    labelKey: 'ver.categoryThailand',
    icon: () => '🇹🇭',
    filter: (i) => i.country?.code?.toLowerCase() === 'th',
  },
  {
    id: 'korea',
    labelKey: 'ver.categoryKorea',
    icon: () => '🇰🇷',
    filter: (i) => i.country?.code?.toLowerCase() === 'kr',
  },
  {
    id: 'community',
    labelKey: 'ver.categoryCommunity',
    icon: () => '🤝',
    filter: (i) => i.origin === 'USER_EMBED',
  },
  {
    id: 'indieVimeo',
    labelKey: 'ver.categoryIndieVimeo',
    icon: () => '🎬',
    filter: (i) => i.platforms.some((p) => p.toLowerCase().includes('vimeo')),
  },
];
