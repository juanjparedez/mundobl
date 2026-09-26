'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'mundobl.country';

/**
 * Pais del visitante (ISO-2), o null mientras no se sabe. Se pide una vez
 * por sesion a /api/geo y queda solo en sessionStorage.
 */
export function useViewerCountry(): string | null {
  const [country, setCountry] = useState<string | null>(null);

  useEffect(() => {
    let cached: string | null = null;
    try {
      cached = sessionStorage.getItem(STORAGE_KEY);
    } catch {
      // sessionStorage bloqueado: se pide igual.
    }
    if (cached) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- el cache se lee recien despues de hidratar
      setCountry(cached);
      return;
    }

    let cancelled = false;
    fetch('/api/geo')
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { country: string | null } | null) => {
        if (cancelled || !data?.country) return;
        setCountry(data.country);
        try {
          sessionStorage.setItem(STORAGE_KEY, data.country);
        } catch {
          // Sin cache: la proxima pagina lo vuelve a pedir.
        }
      })
      .catch(() => null);
    return () => {
      cancelled = true;
    };
  }, []);

  return country;
}
