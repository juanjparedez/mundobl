/**
 * Estado del catalogo en la URL (compartible, "atras" funciona) y
 * preferencias de vista en localStorage. Funciones puras: CatalogoClient las
 * usa despues de montar, nunca al renderizar.
 */

export const PAGE_SIZE_OPTIONS = [24, 48, 96];
export const DEFAULT_PAGE_SIZE = 48;

export type QuickFilterValue =
  | 'watchable'
  | 'popular'
  | 'recent'
  | 'trend'
  | 'featured'
  | null;
export type SortKey = 'az' | 'za' | 'year-desc' | 'year-asc' | 'rating-desc';
export type ViewMode = 'grid' | 'list' | 'carousel';

const QUICK_FILTERS = [
  'watchable',
  'popular',
  'recent',
  'trend',
  'featured',
] as const;
const SORT_KEYS: SortKey[] = [
  'az',
  'za',
  'year-desc',
  'year-asc',
  'rating-desc',
];
const VIEW_MODES: ViewMode[] = ['grid', 'list', 'carousel'];

export interface CatalogFilters {
  q: string;
  country?: string;
  type?: string;
  format?: string;
  genre?: string;
  language?: string;
  productionCompany?: string;
  director?: string;
  actor?: string;
  platform?: string;
  status?: string;
  fav?: string;
  tags: number[];
  rating: number;
  from?: number;
  to?: number;
  letter: string | null;
  quick: QuickFilterValue;
  page: number;
}

const positive = (raw: string | null): number | undefined => {
  const n = Number(raw);
  return raw !== null && Number.isFinite(n) && n > 0 ? n : undefined;
};

/**
 * Lee los filtros de un query string. Acepta los links viejos: `tag=` (uno)
 * y `year=` (desde y hasta el mismo anio), que usan las fichas.
 */
export function parseCatalogUrl(search: string): CatalogFilters {
  const p = new URLSearchParams(search);
  const text = (key: string) => p.get(key) || undefined;
  const year = positive(p.get('year'));
  return {
    q: p.get('q') ?? '',
    country: text('country'),
    type: text('type'),
    format: text('format'),
    genre: text('genre'),
    language: text('language'),
    productionCompany: text('productionCompany'),
    director: text('director'),
    actor: text('actor'),
    platform: text('platform'),
    status: text('status'),
    fav: text('fav'),
    tags: (p.get('tags') ?? p.get('tag') ?? '')
      .split(',')
      .map(Number)
      .filter((n) => Number.isInteger(n) && n > 0),
    rating: positive(p.get('rating')) ?? 0,
    from: positive(p.get('from')) ?? year,
    to: positive(p.get('to')) ?? year,
    letter: p.get('letter'),
    quick: QUICK_FILTERS.find((q) => q === p.get('quick')) ?? null,
    page: positive(p.get('page')) ?? 1,
  };
}

/** El query string de unos filtros; lo que esta en su valor por defecto no va. */
export function buildCatalogQuery(filters: CatalogFilters): string {
  const p = new URLSearchParams();
  const put = (key: string, value: string | number | null | undefined) => {
    if (value === undefined || value === null || value === '' || value === 0)
      return;
    p.set(key, String(value));
  };
  put('q', filters.q.trim());
  put('country', filters.country);
  put('type', filters.type);
  put('format', filters.format);
  put('genre', filters.genre);
  put('language', filters.language);
  put('productionCompany', filters.productionCompany);
  put('director', filters.director);
  put('actor', filters.actor);
  put('platform', filters.platform);
  put('status', filters.status);
  put('fav', filters.fav);
  put('tags', filters.tags.join(','));
  put('rating', filters.rating);
  if (filters.from !== undefined && filters.from === filters.to) {
    put('year', filters.from);
  } else {
    put('from', filters.from);
    put('to', filters.to);
  }
  put('letter', filters.letter);
  put('quick', filters.quick);
  if (filters.page > 1) put('page', filters.page);
  return p.toString();
}

export interface CatalogPrefs {
  pageSize: number;
  viewMode: ViewMode;
  sortBy: SortKey;
}

const PREF_KEYS = {
  pageSize: 'catalog-page-size',
  viewMode: 'catalog-view-mode',
  sortBy: 'catalog-sort',
} as const;

export function readCatalogPrefs(): CatalogPrefs {
  const read = (key: string) => {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  };
  const size = Number(read(PREF_KEYS.pageSize));
  const view = read(PREF_KEYS.viewMode);
  const sort = read(PREF_KEYS.sortBy);
  return {
    pageSize: PAGE_SIZE_OPTIONS.includes(size) ? size : DEFAULT_PAGE_SIZE,
    viewMode: VIEW_MODES.find((mode) => mode === view) ?? 'grid',
    sortBy: SORT_KEYS.find((key) => key === sort) ?? 'az',
  };
}

export function writeCatalogPrefs(prefs: CatalogPrefs): void {
  try {
    window.localStorage.setItem(PREF_KEYS.pageSize, String(prefs.pageSize));
    window.localStorage.setItem(PREF_KEYS.viewMode, prefs.viewMode);
    window.localStorage.setItem(PREF_KEYS.sortBy, prefs.sortBy);
  } catch {
    // Sin storage: las preferencias duran lo que la pestaña.
  }
}
