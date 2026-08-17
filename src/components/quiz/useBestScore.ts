'use client';

import { useCallback, useState } from 'react';

/** Persiste el mejor puntaje de una trivia en localStorage — mismo patrón
 *  de lazy-init + useEffect/setter-que-persiste que ya usan
 *  useReorderablePrefs y los useState persistidos de /catalogo y /ver. */
export function useBestScore(storageKey: string) {
  const [bestScore, setBestScoreState] = useState<number | null>(() => {
    if (typeof window === 'undefined') return null;
    const raw = window.localStorage.getItem(storageKey);
    const n = raw ? Number(raw) : NaN;
    return Number.isFinite(n) ? n : null;
  });

  const reportScore = useCallback(
    (score: number) => {
      setBestScoreState((prev) => {
        if (prev !== null && prev >= score) return prev;
        if (typeof window !== 'undefined') {
          try {
            window.localStorage.setItem(storageKey, String(score));
          } catch {
            // quota / private mode
          }
        }
        return score;
      });
    },
    [storageKey]
  );

  return { bestScore, reportScore };
}
