'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { DashboardLayouts } from './types';

/**
 * Hook de persistencia para layouts de dashboard.
 *
 * Capas de persistencia (en orden de prioridad al hidratar):
 *   1. Server (DB): GET /api/user/dashboards/:key. Solo si auth.
 *   2. localStorage: cache local, fallback offline.
 *   3. defaultLayouts: hardcoded del dashboard.
 *
 * Al guardar: escribe localStorage inmediato + envia a server con debounce
 * de ~600ms. Si el server falla, localStorage queda como source of truth
 * temporal y se reintenta en el proximo cambio.
 */

const STORAGE_PREFIX = 'mb-dashboard:';
const SERVER_DEBOUNCE_MS = 600;

interface UseDashboardLayoutOptions {
  /** Si false, no persiste cambios (util para testing). Default true. */
  persist?: boolean;
  /** Si false, no sincroniza con el server (solo localStorage). Default true. */
  syncWithServer?: boolean;
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

async function pushToServer(
  key: string,
  layouts: DashboardLayouts
): Promise<void> {
  try {
    await fetch(`/api/user/dashboards/${encodeURIComponent(key)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ layouts }),
    });
  } catch {
    /* offline / network: silent — localStorage queda como cache local */
  }
}

async function fetchFromServer(key: string): Promise<DashboardLayouts | null> {
  try {
    const res = await fetch(`/api/user/dashboards/${encodeURIComponent(key)}`, {
      method: 'GET',
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.layouts && typeof data.layouts === 'object') {
      return data.layouts as DashboardLayouts;
    }
    return null;
  } catch {
    return null;
  }
}

async function deleteFromServer(key: string): Promise<void> {
  try {
    await fetch(`/api/user/dashboards/${encodeURIComponent(key)}`, {
      method: 'DELETE',
    });
  } catch {
    /* silent */
  }
}

export function useDashboardLayout(
  dashboardKey: string,
  defaultLayouts: DashboardLayouts,
  options: UseDashboardLayoutOptions = {}
): UseDashboardLayoutResult {
  const { persist = true, syncWithServer = true } = options;
  const defaultsRef = useRef(defaultLayouts);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [layouts, setLayoutsState] = useState<DashboardLayouts>(defaultLayouts);

  // Hidratacion: localStorage primero (sincrono), despues server (asincrono).
  useEffect(() => {
    if (!persist) return;
    let cancelled = false;
    const stored = readFromStorage(dashboardKey);
    if (stored) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration: read localStorage on mount
      setLayoutsState(stored);
    }
    if (syncWithServer) {
      fetchFromServer(dashboardKey).then((remote) => {
        if (cancelled || !remote) return;
        setLayoutsState(remote);
        writeToStorage(dashboardKey, remote);
      });
    }
    return () => {
      cancelled = true;
    };
  }, [dashboardKey, persist, syncWithServer]);

  // Debounce de write a server.
  const scheduleServerPush = useCallback(
    (next: DashboardLayouts) => {
      if (!syncWithServer) return;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        pushToServer(dashboardKey, next);
      }, SERVER_DEBOUNCE_MS);
    },
    [dashboardKey, syncWithServer]
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const setLayouts = useCallback(
    (next: DashboardLayouts) => {
      setLayoutsState(next);
      if (persist) {
        writeToStorage(dashboardKey, next);
        scheduleServerPush(next);
      }
    },
    [dashboardKey, persist, scheduleServerPush]
  );

  const removeWidget = useCallback(
    (id: string) => {
      setLayoutsState((prev) => {
        const next: DashboardLayouts = {};
        (Object.keys(prev) as (keyof DashboardLayouts)[]).forEach((bp) => {
          const items = prev[bp];
          if (items) next[bp] = items.filter((it) => it.i !== id);
        });
        if (persist) {
          writeToStorage(dashboardKey, next);
          scheduleServerPush(next);
        }
        return next;
      });
    },
    [dashboardKey, persist, scheduleServerPush]
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
        if (persist) {
          writeToStorage(dashboardKey, next);
          scheduleServerPush(next);
        }
        return next;
      });
    },
    [dashboardKey, persist, scheduleServerPush]
  );

  const reset = useCallback(() => {
    setLayoutsState(defaultsRef.current);
    if (persist) {
      clearStorage(dashboardKey);
      if (syncWithServer) {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        deleteFromServer(dashboardKey);
      }
    }
  }, [dashboardKey, persist, syncWithServer]);

  const widgetIds = useMemo(() => {
    const items = layouts.lg ?? layouts.md ?? layouts.sm ?? layouts.xs ?? [];
    return items.map((it) => it.i);
  }, [layouts]);

  return { layouts, setLayouts, removeWidget, addWidget, reset, widgetIds };
}
