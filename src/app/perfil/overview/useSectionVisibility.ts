'use client';

import { useEffect, useState } from 'react';

/** Identificadores estables de cada seccion del overview de /perfil.
 *  Son las llaves que el user puede ocultar/mostrar y que persistimos
 *  en localStorage. Mantener en sync con OVERVIEW_SECTIONS. */
export type OverviewSectionKey =
  | 'watching'
  | 'mystats'
  | 'reviewsActivity'
  | 'countries'
  | 'yearSummary'
  | 'reviews'
  | 'collections'
  | 'comments'
  | 'followed'
  | 'notifications'
  | 'cases'
  | 'achievements'
  | 'settings';

export interface OverviewSectionMeta {
  key: OverviewSectionKey;
  label: string;
  /** Default = true: la seccion se ve hasta que el user la oculte. */
  defaultVisible: boolean;
}

export const OVERVIEW_SECTIONS: OverviewSectionMeta[] = [
  { key: 'watching', label: 'Seguir viendo', defaultVisible: true },
  { key: 'mystats', label: 'Mis estadísticas', defaultVisible: true },
  {
    key: 'reviewsActivity',
    label: 'Actividad de reseñas',
    defaultVisible: true,
  },
  { key: 'countries', label: 'Países favoritos', defaultVisible: true },
  { key: 'yearSummary', label: 'Resumen anual', defaultVisible: true },
  { key: 'reviews', label: 'Mis reseñas', defaultVisible: true },
  { key: 'collections', label: 'Mis listas', defaultVisible: true },
  { key: 'comments', label: 'Mis comentarios', defaultVisible: true },
  { key: 'followed', label: 'Títulos seguidos', defaultVisible: true },
  { key: 'notifications', label: 'Notificaciones', defaultVisible: true },
  { key: 'cases', label: 'Mis casos de feedback', defaultVisible: true },
  { key: 'achievements', label: 'Logros y hitos', defaultVisible: true },
  {
    key: 'settings',
    label: 'Configuración y preferencias',
    defaultVisible: true,
  },
];

const STORAGE_KEY = 'profile-overview-hidden-sections';

/** Hook que gestiona qué secciones del /perfil overview estan ocultas.
 *  Persiste en localStorage como un Set serializado. */
export function useSectionVisibility() {
  const [hidden, setHidden] = useState<Set<OverviewSectionKey>>(new Set());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as string[];
        // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration
        setHidden(new Set(parsed as OverviewSectionKey[]));
      }
    } catch {
      /* silent — corruption rara, default = todas visibles */
    }

    setHydrated(true);
  }, []);

  const persist = (next: Set<OverviewSectionKey>) => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(Array.from(next))
      );
    } catch {
      /* silent */
    }
  };

  const isVisible = (key: OverviewSectionKey): boolean => !hidden.has(key);

  const toggle = (key: OverviewSectionKey) => {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      persist(next);
      return next;
    });
  };

  const reset = () => {
    setHidden(new Set());
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* silent */
    }
  };

  return { isVisible, toggle, reset, hidden, hydrated };
}
