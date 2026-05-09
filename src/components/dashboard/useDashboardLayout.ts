'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { DashboardLayouts } from './types';

/**
 * Hook de persistencia local para layouts de dashboard.
 *
 * Lee el layout desde localStorage al montar (con `defaultLayouts` como
 * fallback), expone setters para guardar cambios, agregar/quitar widgets
 * y resetear al default. Cada dashboard se identifica por `dashboardKey`
 * (ej: 'profile', 'admin-home', 'series-detail-admin').
 *
 * Cuando exista persistencia en DB (Fase 5.7), este hook seguira siendo
 * el punto de entrada — internamente fetcheara desde server y haria
 * write-through a localStorage como cache.
 */

const STORAGE_PREFIX = 'mb-dashboard:';

interface UseDashboardLayoutOptions {
  /** Si false, no persiste cambios (util para testing). Default true. */
  persist?: boolean;
}

export interface UseDashboardLayoutResult {
  /** Layout actual. */
  layouts: DashboardLayouts;
  /** Reemplaza el layout completo (lo llama DashboardGrid en onLayoutsChange). */
  setLayouts: (next: DashboardLayouts) => void;
  /** Quita un widget por id en todos los breakpoints. */
  removeWidget: (id: string) => void;
  /** Agrega un widget al final del layout en todos los breakpoints. */
  addWidget: (
    id: string,
    size: { w: number; h: number; minW?: number; minH?: number }
  ) => void;
  /** Vuelve al layout por defecto y borra el localStorage. */
  reset: () => void;
  /** Lista de ids de widgets actualmente en el dashboard (en orden de lg). */
  widgetIds: string[];
}

function readFromStorage(key: string): DashboardLayouts | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') return parsed as DashboardLayouts;
    return null;
  } catch {
    return null;
  }
}

function writeToStorage(key: string, value: DashboardLayouts) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch {
    /* quota o private mode: silent */
  }
}

function clearStorage(key: string) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_PREFIX + key);
  } catch {
    /* silent */
  }
}

/** Devuelve el siguiente y disponible al final del layout. */
function nextY(items: { y: number; h: number }[]): number {
  if (items.length === 0) return 0;
  return items.reduce((max, it) => Math.max(max, it.y + it.h), 0);
}

export function useDashboardLayout(
  dashboardKey: string,
  defaultLayouts: DashboardLayouts,
  options: UseDashboardLayoutOptions = {}
): UseDashboardLayoutResult {
  const { persist = true } = options;
  const defaultsRef = useRef(defaultLayouts);

  const [layouts, setLayoutsState] = useState<DashboardLayouts>(defaultLayouts);

  // Hidratacion: leer localStorage despues del mount.
  useEffect(() => {
    if (!persist) return;
    const stored = readFromStorage(dashboardKey);
    if (stored) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration: read localStorage on mount
      setLayoutsState(stored);
    }
  }, [dashboardKey, persist]);

  const setLayouts = useCallback(
    (next: DashboardLayouts) => {
      setLayoutsState(next);
      if (persist) writeToStorage(dashboardKey, next);
    },
    [dashboardKey, persist]
  );

  const removeWidget = useCallback(
    (id: string) => {
      setLayoutsState((prev) => {
        const next: DashboardLayouts = {};
        (Object.keys(prev) as (keyof DashboardLayouts)[]).forEach((bp) => {
          const items = prev[bp];
          if (items) next[bp] = items.filter((it) => it.i !== id);
        });
        if (persist) writeToStorage(dashboardKey, next);
        return next;
      });
    },
    [dashboardKey, persist]
  );

  const addWidget = useCallback(
    (
      id: string,
      size: { w: number; h: number; minW?: number; minH?: number }
    ) => {
      setLayoutsState((prev) => {
        const next: DashboardLayouts = { ...prev };
        (Object.keys(prev) as (keyof DashboardLayouts)[]).forEach((bp) => {
          const items = prev[bp] ?? [];
          if (items.some((it) => it.i === id)) {
            next[bp] = items;
            return;
          }
          next[bp] = [
            ...items,
            {
              i: id,
              x: 0,
              y: nextY(items),
              w: size.w,
              h: size.h,
              minW: size.minW,
              minH: size.minH,
            },
          ];
        });
        if (persist) writeToStorage(dashboardKey, next);
        return next;
      });
    },
    [dashboardKey, persist]
  );

  const reset = useCallback(() => {
    setLayoutsState(defaultsRef.current);
    if (persist) clearStorage(dashboardKey);
  }, [dashboardKey, persist]);

  const widgetIds = useMemo(() => {
    const items = layouts.lg ?? layouts.md ?? layouts.sm ?? layouts.xs ?? [];
    return items.map((it) => it.i);
  }, [layouts]);

  return { layouts, setLayouts, removeWidget, addWidget, reset, widgetIds };
}
