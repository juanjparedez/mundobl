'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { LAST_SEEN_NOVEDADES_KEY } from '@/app/(app)/novedades/storage-keys';
import { readLatestNovedades } from '@/lib/latest-novedades';

/**
 * true si hay novedades publicadas despues de la ultima vez que el usuario
 * abrio /novedades (marca en localStorage). Lo usan el Sidebar y el cajon
 * "Mas" de la barra inferior para el punto sobre el icono.
 */
export function useHasNovedades(): boolean {
  const pathname = usePathname();
  const [hasNovedades, setHasNovedades] = useState(false);

  useEffect(() => {
    let aborted = false;
    readLatestNovedades()
      .then((timestamp) => {
        if (aborted) return;
        if (!timestamp) {
          setHasNovedades(false);
          return;
        }
        let seen = 0;
        try {
          seen = Number(
            window.localStorage.getItem(LAST_SEEN_NOVEDADES_KEY) ?? '0'
          );
        } catch {
          seen = 0;
        }
        setHasNovedades(timestamp > seen);
      })
      .catch(() => {});
    return () => {
      aborted = true;
    };
  }, [pathname]);

  return hasNovedades;
}
