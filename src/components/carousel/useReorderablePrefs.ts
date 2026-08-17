'use client';

import { useCallback, useState } from 'react';

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

function readStored(storageKey: string): StoredPrefs | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isStoredPrefs(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/** Reconcilia lo guardado contra el pool ACTUAL de ids — asi un storage
 *  vacio, corrupto, o desactualizado (item agregado/quitado en un deploy
 *  posterior) siempre converge a un estado valido y completo, nunca a
 *  una fila rota o un carrusel en blanco. */
function reconcile(stored: StoredPrefs | null, poolIds: string[]): PrefsState {
  if (!stored) {
    return { order: poolIds, hidden: new Set() };
  }
  const validOrder = stored.order.filter((id) => poolIds.includes(id));
  const missing = poolIds.filter((id) => !validOrder.includes(id));
  const hidden = new Set(stored.hidden.filter((id) => poolIds.includes(id)));
  return { order: [...validOrder, ...missing], hidden };
}

function persistToStorage(storageKey: string, state: PrefsState) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({ order: state.order, hidden: [...state.hidden] })
    );
  } catch {
    // quota / private mode — el toggle sigue andando en esta sesion,
    // simplemente no persiste entre visitas.
  }
}

/**
 * Orden + visibilidad de un set de items (categorias de un carrusel,
 * secciones, etc.), personalizado por usuario, persistido en
 * localStorage bajo `storageKey`. Generico — no sabe nada sobre QUE son
 * los items, solo maneja sus `id`. Usado por el carrusel de /catalogo y
 * el de /ver (cada uno con su propio storageKey + pool, sin pisarse).
 *
 * Ver `reconcile` para como se comporta ante un cache limpio, corrupto,
 * o desactualizado respecto al pool actual.
 */
export function useReorderablePrefs(storageKey: string, poolIds: string[]) {
  const [state, setState] = useState<PrefsState>(() =>
    reconcile(readStored(storageKey), poolIds)
  );

  const reorder = useCallback(
    (newOrder: string[]) => {
      setState((prev) => {
        const next = { order: newOrder, hidden: prev.hidden };
        persistToStorage(storageKey, next);
        return next;
      });
    },
    [storageKey]
  );

  const toggleHidden = useCallback(
    (id: string) => {
      setState((prev) => {
        const nextHidden = new Set(prev.hidden);
        if (nextHidden.has(id)) nextHidden.delete(id);
        else nextHidden.add(id);
        const next = { order: prev.order, hidden: nextHidden };
        persistToStorage(storageKey, next);
        return next;
      });
    },
    [storageKey]
  );

  const reset = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(storageKey);
      } catch {
        // ignore
      }
    }
    setState(reconcile(null, poolIds));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

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
