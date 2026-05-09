'use client';

import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useLocale } from '@/lib/providers/LocaleProvider';

const STORAGE_KEY = 'spoiler-free-mode';

interface SpoilerFreeContextValue {
  // Estado global del modo "sin spoilers".
  enabled: boolean;
  setEnabled: (v: boolean) => void;
  toggle: () => void;
  // Items revelados por el usuario (click "Ver de todos modos").
  // Persisten solo en memoria; al cambiar de pagina se resetean.
  isRevealed: (key: string) => boolean;
  reveal: (key: string) => void;
}

const SpoilerFreeContext = createContext<SpoilerFreeContextValue | undefined>(
  undefined
);

interface SpoilerFreeProviderProps {
  children: React.ReactNode;
}

export function SpoilerFreeProvider({ children }: SpoilerFreeProviderProps) {
  const [enabled, setEnabledState] = useState(false);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'true') {
      startTransition(() => setEnabledState(true));
    }
  }, []);

  const setEnabled = useCallback((v: boolean) => {
    setEnabledState(v);
    localStorage.setItem(STORAGE_KEY, v ? 'true' : 'false');
    if (!v) setRevealed(new Set());
  }, []);

  const toggle = useCallback(() => {
    setEnabledState((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, next ? 'true' : 'false');
      if (!next) setRevealed(new Set());
      return next;
    });
  }, []);

  const isRevealed = useCallback(
    (key: string) => revealed.has(key),
    [revealed]
  );

  const reveal = useCallback((key: string) => {
    setRevealed((prev) => {
      if (prev.has(key)) return prev;
      const next = new Set(prev);
      next.add(key);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ enabled, setEnabled, toggle, isRevealed, reveal }),
    [enabled, setEnabled, toggle, isRevealed, reveal]
  );

  return (
    <SpoilerFreeContext.Provider value={value}>
      {children}
    </SpoilerFreeContext.Provider>
  );
}

export function useSpoilerFree() {
  const { t } = useLocale();
  const ctx = useContext(SpoilerFreeContext);
  if (!ctx) {
    throw new Error(t('spoilerFreeProvider.useSpoilerFreeError'));
  }
  return ctx;
}
