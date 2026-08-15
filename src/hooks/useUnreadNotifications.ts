'use client';

import { startTransition, useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

const POLL_MS = 120_000;
const THROTTLE_MS = 45_000;

/**
 * Devuelve el conteo actual de notificaciones no leidas. Polea cada 2 min
 * mientras la pestaña esta visible y refresca al volver el foco/visibilidad
 * con un throttle de 45s para no saturar Serverless Functions.
 * Si el usuario no esta autenticado retorna 0.
 */
export function useUnreadNotifications(): number {
  const { data: session, status } = useSession();
  const [count, setCount] = useState(0);

  const refresh = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await fetch('/api/notifications/unread-count', { signal });
      if (!res.ok) return;
      const data: { count: number } = await res.json();
      setCount(data.count ?? 0);
    } catch {
      /* errores silenciosos: reintentamos en el proximo tick */
    }
  }, []);

  useEffect(() => {
    if (status !== 'authenticated') {
      startTransition(() => setCount(0));
      return;
    }
    const controller = new AbortController();
    let interval: number | null = null;
    let lastFetchMs = Date.now();

    const throttledRefresh = () => {
      const now = Date.now();
      if (now - lastFetchMs < THROTTLE_MS) return;
      lastFetchMs = now;
      refresh(controller.signal);
    };

    const startPolling = () => {
      if (interval !== null) return;
      interval = window.setInterval(() => {
        lastFetchMs = Date.now();
        refresh(controller.signal);
      }, POLL_MS);
    };
    const stopPolling = () => {
      if (interval !== null) {
        window.clearInterval(interval);
        interval = null;
      }
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        throttledRefresh();
        startPolling();
      } else {
        stopPolling();
      }
    };
    const handleFocus = () => throttledRefresh();

    // setState happens en un microtask despues del fetch — el rule no lo
    // detecta automaticamente, pero no es una cascada sincronica.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh(controller.signal);
    if (document.visibilityState === 'visible') startPolling();
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleFocus);

    return () => {
      controller.abort();
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleFocus);
    };
  }, [status, session?.user?.id, refresh]);

  return count;
}
