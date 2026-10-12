'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface FormDraft<T> {
  version: 1;
  savedAt: string;
  data: T;
}

/** Browser-local recovery. Never write over a draft awaiting a decision. */
export function useLocalFormDraft<T>(key: string | null, data: T) {
  const serialized = JSON.stringify(data);
  const current = useRef(serialized);
  current.current = serialized;
  const baseline = useRef(serialized);
  const stopped = useRef(false);
  const wrote = useRef(false);
  const [ready, setReady] = useState(false);
  const [available, setAvailable] = useState<FormDraft<T> | null>(null);
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle');

  useEffect(() => {
    setReady(false);
    setAvailable(null);
    setStatus('idle');
    stopped.current = false;
    wrote.current = false;
    if (!key) return;
    // Wait for the form's initial setFieldsValue/useWatch to settle.
    const timer = setTimeout(() => {
      baseline.current = current.current;
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const draft = JSON.parse(raw) as FormDraft<T>;
          if (
            draft.version !== 1 ||
            !draft.data ||
            typeof draft.data !== 'object'
          ) {
            throw new Error('Unsupported draft');
          }
          setAvailable(draft);
        }
      } catch {
        setStatus('error');
        // Preserve an unreadable draft instead of silently replacing it.
        stopped.current = true;
      }
      setReady(true);
    }, 0);
    return () => clearTimeout(timer);
  }, [key]);

  useEffect(() => {
    if (!key || !ready || available || stopped.current) return;
    try {
      if (serialized === baseline.current) {
        if (wrote.current) {
          localStorage.removeItem(key);
          wrote.current = false;
          setStatus('idle');
        }
        return;
      }
      localStorage.setItem(
        key,
        JSON.stringify({
          version: 1,
          savedAt: new Date().toISOString(),
          data: JSON.parse(serialized),
        })
      );
      wrote.current = true;
      setStatus('saved');
    } catch {
      setStatus('error');
    }
  }, [key, ready, available, serialized]);

  const restore = useCallback(() => {
    const data = available?.data;
    setAvailable(null);
    if (data) setStatus('saved');
    return data;
  }, [available]);

  const discard = useCallback(() => {
    if (!key) return;
    try {
      localStorage.removeItem(key);
      baseline.current = current.current;
      wrote.current = false;
      setAvailable(null);
      setStatus('idle');
    } catch {
      setStatus('error');
    }
  }, [key]);

  const clearAfterSave = useCallback(() => {
    stopped.current = true;
    discard();
  }, [discard]);

  return { available, status, restore, discard, clearAfterSave };
}
