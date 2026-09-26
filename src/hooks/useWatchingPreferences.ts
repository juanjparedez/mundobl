'use client';

import { useCallback, useMemo, useState, useSyncExternalStore } from 'react';
import {
  DEFAULT_WATCHING_PREFERENCES,
  readWatchingPreferences,
  type WatchingPreferences,
} from '@/lib/watching-collection';

/** Display preferences only; never store the account's viewing history in this cache. */
export function useWatchingPreferences(userId: string) {
  const [temporary, setTemporary] = useState<WatchingPreferences | null>(null);
  const key = `mundobl.watching.preferences.v1.${userId}`;
  const read = useCallback(() => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }, [key]);
  const subscribe = useCallback((listener: () => void) => {
    window.addEventListener('storage', listener);
    window.addEventListener('mundobl:watching-preferences', listener);
    return () => {
      window.removeEventListener('storage', listener);
      window.removeEventListener('mundobl:watching-preferences', listener);
    };
  }, []);
  const raw = useSyncExternalStore(subscribe, read, () => null);
  const saved = useMemo(() => {
    try {
      return readWatchingPreferences(JSON.parse(raw ?? 'null'));
    } catch {
      return DEFAULT_WATCHING_PREFERENCES;
    }
  }, [raw]);
  const updatePreferences = (next: WatchingPreferences) => {
    try {
      localStorage.setItem(key, JSON.stringify(next));
      setTemporary(null);
      window.dispatchEvent(new Event('mundobl:watching-preferences'));
    } catch {
      setTemporary(next);
    }
  };
  return { preferences: temporary ?? saved, updatePreferences };
}
