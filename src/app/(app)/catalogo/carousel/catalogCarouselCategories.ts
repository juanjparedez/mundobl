import type { ComponentType } from 'react';
import {
  ClockCircleOutlined,
  StarOutlined,
  GlobalOutlined,
  VideoCameraOutlined,
  HeartOutlined,
} from '@ant-design/icons';
import type { TranslationKey } from '@/i18n/messages';
import type { SerieData } from '../catalogTypes';

export interface CarouselCategoryDef {
  /** id estable — se persiste en localStorage (orden/visibilidad), no
   *  renombrar sin pensar en usuarios con preferencia guardada. */
  id: string;
  labelKey: TranslationKey;
  icon: ComponentType;
  /** favoriteIds se pasa siempre; la mayoria de las categorias lo ignora
   *  — solo "favorites" lo usa. Evita un tipo de contexto mas grande
   *  para un solo caso de uso. */
  filter: (serie: SerieData, favoriteIds: Set<string>) => boolean;
  sort?: (a: SerieData, b: SerieData) => number;
  /** Si true, la fila agrupa series que comparten universo (2+) en una
   *  sola card de "saga", igual que la grilla clasica. */
  preferUniverseGroups?: boolean;
}

/** Pool de categorias curadas a mano — no se auto-generan combinando
 *  cada genero/pais/plataforma posible (eso dejaria de ser "curado").
 *  Tailandia/Corea/Japon elegidos por distribucion real del catalogo
 *  (juntos son ~78% de las series curadas al momento de escribir esto).
 *  El usuario elige cuales ver y en que orden desde CarouselConfigDrawer
 *  — este array es solo el default/la fuente de verdad de que existe. */
export const CATALOG_CAROUSEL_CATEGORIES: CarouselCategoryDef[] = [
  {
    id: 'recentlyAdded',
    labelKey: 'catalogCarousel.categoryRecentlyAdded',
    icon: ClockCircleOutlined,
    filter: () => true,
    sort: (a, b) =>
      (b.createdAt ? Date.parse(b.createdAt) : 0) -
      (a.createdAt ? Date.parse(a.createdAt) : 0),
  },
  {
    id: 'topRated',
    labelKey: 'catalogCarousel.categoryTopRated',
    icon: StarOutlined,
    filter: (s) => (s.rating ?? 0) > 0,
    sort: (a, b) => (b.rating ?? 0) - (a.rating ?? 0),
  },
  {
    id: 'franchises',
    labelKey: 'catalogCarousel.categoryFranchises',
    icon: GlobalOutlined,
    filter: (s) => !!s.universoId,
    preferUniverseGroups: true,
  },
  {
    id: 'thailand',
    labelKey: 'catalogCarousel.categoryThailand',
    icon: GlobalOutlined,
    filter: (s) => s.paisCode?.toLowerCase() === 'th',
  },
  {
    id: 'korea',
    labelKey: 'catalogCarousel.categoryKorea',
    icon: GlobalOutlined,
    filter: (s) => s.paisCode?.toLowerCase() === 'kr',
  },
  {
    id: 'japan',
    labelKey: 'catalogCarousel.categoryJapan',
    icon: GlobalOutlined,
    filter: (s) => s.paisCode?.toLowerCase() === 'jp',
  },
  {
    id: 'movies',
    labelKey: 'catalogCarousel.categoryMovies',
    icon: VideoCameraOutlined,
    filter: (s) => s.tipo === 'pelicula',
  },
  {
    id: 'favorites',
    labelKey: 'catalogCarousel.categoryFavorites',
    icon: HeartOutlined,
    filter: (s, favoriteIds) => favoriteIds.has(s.id),
  },
];

/** Cantidad maxima de items por fila — evita un scroll horizontal
 *  absurdamente largo en categorias grandes (ej. Tailandia con 200+). */
export const CAROUSEL_ROW_MAX_ITEMS = 24;
