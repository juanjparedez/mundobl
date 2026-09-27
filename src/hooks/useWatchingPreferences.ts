'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  DEFAULT_WATCHING_PREFERENCES,
  readWatchingPreferences,
  type WatchingPreferences,
} from '@/lib/watching-collection';
import {
  applyPreferenceChange,
  parseInitialPreferences,
  type WatchingPreferenceChange,
} from '@/lib/watching-preferences';

const endpoint = '/api/user/watching-preferences';

/** The server owns preferences; local storage is only a one-time legacy import. */
export function useWatchingPreferences(userId: string) {
  const [preferences, setPreferences] = useState<WatchingPreferences>(
    DEFAULT_WATCHING_PREFERENCES
  );
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const lock = useRef(false);
  const request = useRef<AbortController | null>(null);
  const generation = useRef(0);
  const key = `mundobl.watching.preferences.v1.${userId}`;

  const reload = useCallback(async () => {
    if (lock.current) return;
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    const version = ++generation.current;
    try {
      const response = await fetch(endpoint, {
        signal: controller.signal,
        cache: 'no-store',
      });
      if (!response.ok) throw new Error();
      let data: { preferences: unknown } = await response.json();
      if (data.preferences === null) {
        let legacy = DEFAULT_WATCHING_PREFERENCES;
        try {
          legacy = readWatchingPreferences(
            JSON.parse(localStorage.getItem(key) ?? 'null')
          );
        } catch {
          /* Storage may be unavailable. */
        }
        const initialized = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(legacy),
          signal: controller.signal,
        });
        if (!initialized.ok) throw new Error();
        data = await initialized.json();
      }
      const parsed = parseInitialPreferences(data.preferences);
      if (!parsed) throw new Error();
      if (controller.signal.aborted || version !== generation.current) return;
      setPreferences(parsed);
      setReady(true);
      setFailed(false);
    } catch {
      if (!controller.signal.aborted && version === generation.current) {
        setFailed(true);
        setReady(false);
      }
    }
  }, [key]);

  useEffect(() => {
    void reload();
    const focus = () => {
      void reload();
    };
    window.addEventListener('focus', focus);
    return () => {
      request.current?.abort();
      window.removeEventListener('focus', focus);
    };
  }, [reload]);

  const updatePreferences = async (change: WatchingPreferenceChange) => {
    if (!ready || lock.current) return;
    lock.current = true;
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    const version = ++generation.current;
    const previous = preferences;
    setSaving(true);
    setPreferences(applyPreferenceChange(previous, change));
    try {
      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(change),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error();
      const parsed = parseInitialPreferences(
        (await response.json()).preferences
      );
      if (!parsed) throw new Error();
      if (!controller.signal.aborted && version === generation.current) {
        setPreferences(parsed);
        setFailed(false);
      }
    } catch {
      if (!controller.signal.aborted && version === generation.current) {
        setPreferences(previous);
        setFailed(true);
        // The server may have committed before the connection was lost. Reload before editing again.
        setReady(false);
      }
    } finally {
      lock.current = false;
      if (!controller.signal.aborted && version === generation.current)
        setSaving(false);
    }
  };
  return { preferences, updatePreferences, ready, saving, failed, reload };
}
