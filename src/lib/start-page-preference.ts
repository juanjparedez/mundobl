import { ROUTES } from '@/constants/navigation';

export type StartPageOption =
  | 'landing'
  | 'watching'
  | 'catalogo'
  | 'ver'
  | 'estrenos';

export const START_PAGE_STORAGE_KEY = 'mb-start-page';
export const START_PAGE_CHANGED_EVENT = 'mb:start-page-changed';
export const DEFAULT_START_PAGE: StartPageOption = 'landing';

const VALID_START_PAGES: StartPageOption[] = [
  'landing',
  'watching',
  'catalogo',
  'ver',
  'estrenos',
];

export function getStartPagePreference(): StartPageOption {
  if (typeof window === 'undefined') return DEFAULT_START_PAGE;
  try {
    const raw = window.localStorage.getItem(START_PAGE_STORAGE_KEY);
    if (raw && (VALID_START_PAGES as string[]).includes(raw)) {
      return raw as StartPageOption;
    }
  } catch {
    // Storage bloqueado o no disponible: cae al default seguro (portada).
  }
  return DEFAULT_START_PAGE;
}

export function setStartPagePreference(value: StartPageOption): void {
  if (typeof window === 'undefined') return;
  try {
    if (value === DEFAULT_START_PAGE) {
      window.localStorage.removeItem(START_PAGE_STORAGE_KEY);
    } else {
      window.localStorage.setItem(START_PAGE_STORAGE_KEY, value);
    }
  } catch {
    // Ignorar errores de cuota o modo privado.
  }
  window.dispatchEvent(
    new CustomEvent<StartPageOption>(START_PAGE_CHANGED_EVENT, {
      detail: value,
    })
  );
}

export function resolveStartPageRoute(value: StartPageOption): string | null {
  switch (value) {
    case 'watching':
      return ROUTES.WATCHING;
    case 'catalogo':
      return ROUTES.CATALOGO;
    case 'ver':
      return ROUTES.VER;
    case 'estrenos':
      return ROUTES.ESTRENOS;
    case 'landing':
    default:
      return null;
  }
}
