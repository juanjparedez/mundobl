'use client';

import { useCallback, useState } from 'react';
import { CATALOG_CAROUSEL_CATEGORIES } from './catalogCarouselCategories';

const STORAGE_KEY = 'catalog-carousel-prefs';

interface StoredPrefs {
  order: string[];
  hidden: string[];
}

interface PrefsState {
  order: string[];
  hidden: Set<string>;
}

function isStoredPrefs(value: unknown): value is StoredPrefs {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return Array.isArray(v.order) && Array.isArray(v.hidden);
}

function readStored(): StoredPrefs | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isStoredPrefs(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/** Reconcilia lo guardado contra el pool ACTUAL de categorias — asi un
 *  storage vacio, corrupto, o desactualizado (categoria agregada/quitada
 *  en un deploy posterior) siempre converge a un estado valido y
 *  completo, nunca a una fila rota o un carrusel en blanco. */
function reconcile(stored: StoredPrefs | null): PrefsState {
  const poolIds = CATALOG_CAROUSEL_CATEGORIES.map((c) => c.id);
  if (!stored) {
    return { order: poolIds, hidden: new Set() };
  }
  const validOrder = stored.order.filter((id) => poolIds.includes(id));
  const missing = poolIds.filter((id) => !validOrder.includes(id));
  const hidden = new Set(stored.hidden.filter((id) => poolIds.includes(id)));
  return { order: [...validOrder, ...missing], hidden };
}

function persistToStorage(state: PrefsState) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ order: state.order, hidden: [...state.hidden] })
    );
  } catch {
    // quota / private mode — el toggle sigue andando en esta sesion,
    // simplemente no persiste entre visitas.
  }
}

/** Orden + visibilidad de las categorias del carrusel de /catalogo,
 *  personalizado por usuario, persistido en localStorage. Ver
 *  `reconcile` para como se comporta ante un cache limpio o corrupto. */
export function useCarouselPrefs() {
  const [state, setState] = useState<PrefsState>(() => reconcile(readStored()));

  const reorder = useCallback((newOrder: string[]) => {
    setState((prev) => {
      const next = { order: newOrder, hidden: prev.hidden };
      persistToStorage(next);
      return next;
    });
  }, []);

  const toggleHidden = useCallback((id: string) => {
    setState((prev) => {
      const nextHidden = new Set(prev.hidden);
      if (nextHidden.has(id)) nextHidden.delete(id);
      else nextHidden.add(id);
      const next = { order: prev.order, hidden: nextHidden };
      persistToStorage(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
    }
    setState(reconcile(null));
  }, []);

  const orderedVisibleIds = state.order.filter((id) => !state.hidden.has(id));

  return {
    order: state.order,
    hidden: state.hidden,
    orderedVisibleIds,
    reorder,
    toggleHidden,
    reset,
  };
}
