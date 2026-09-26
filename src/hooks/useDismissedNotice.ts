'use client';

import { useCallback, useSyncExternalStore } from 'react';

const STORAGE_KEY = 'mundobl.dismissedNotices';

// Mismo cuidado que AnnouncementDisplay: useSyncExternalStore compara por
// referencia, y JSON.parse devuelve un array nuevo en cada lectura. Sin este
// cache entra en loop infinito.
let cachedRaw: string | null = null;
let cachedIds: string[] = [];

function readDismissed(): string[] {
  let raw: string | null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    return cachedIds;
  }
  if (raw === cachedRaw) return cachedIds;
  cachedRaw = raw;
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    cachedIds = Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === 'string')
      : [];
  } catch {
    cachedIds = [];
  }
  return cachedIds;
}

// En el servidor todo cuenta como cerrado: el aviso aparece recien al
// hidratar y nunca queda pegado en el HTML de una pagina estatica.
const ALL_DISMISSED = ['*'];
function getServerSnapshot(): string[] {
  return ALL_DISMISSED;
}

function subscribe(callback: () => void): () => void {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}

/**
 * Aviso que se ve hasta que la persona lo cierra, en este navegador. El mismo
 * id en dos paginas es el mismo aviso: cerrado en una, cerrado en todas.
 */
export function useDismissedNotice(id: string) {
  const dismissedIds = useSyncExternalStore(
    subscribe,
    readDismissed,
    getServerSnapshot
  );
  const dismissed = dismissedIds === ALL_DISMISSED || dismissedIds.includes(id);

  const dismiss = useCallback(() => {
    const current = readDismissed();
    if (current.includes(id)) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...current, id]));
    } catch {
      // Sin storage el aviso vuelve en la proxima visita; nada mas.
    }
    window.dispatchEvent(new StorageEvent('storage'));
  }, [id]);

  return { dismissed, dismiss };
}
