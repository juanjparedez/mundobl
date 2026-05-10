'use client';

import { useEffect, useState } from 'react';
import type { TranslationKey } from '@/i18n/messages';

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
  /** Key i18n del label visible. El consumer resuelve via t(). */
  labelKey: TranslationKey;
  /** Default = true: la seccion se ve hasta que el user la oculte. */
  defaultVisible: boolean;
}

export const OVERVIEW_SECTIONS: OverviewSectionMeta[] = [
  {
    key: 'watching',
    labelKey: 'profile.sectionWatching',
    defaultVisible: true,
  },
  {
    key: 'mystats',
    labelKey: 'profile.sectionMyStats',
    defaultVisible: true,
  },
  {
    key: 'reviewsActivity',
    labelKey: 'profile.sectionReviewsActivity',
    defaultVisible: true,
  },
  {
    key: 'countries',
    labelKey: 'profile.sectionCountries',
    defaultVisible: true,
  },
  {
    key: 'yearSummary',
    labelKey: 'profile.sectionYearSummary',
    defaultVisible: true,
  },
  {
    key: 'reviews',
    labelKey: 'profile.sectionMyReviews',
    defaultVisible: true,
  },
  {
    key: 'collections',
    labelKey: 'profile.sectionCollections',
    defaultVisible: true,
  },
  {
    key: 'comments',
    labelKey: 'profile.sectionMyComments',
    defaultVisible: true,
  },
  {
    key: 'followed',
    labelKey: 'profile.sectionFollowedTitles',
    defaultVisible: true,
  },
  {
    key: 'notifications',
    labelKey: 'profile.sectionNotifications',
    defaultVisible: true,
  },
  {
    key: 'cases',
    labelKey: 'profile.sectionCases',
    defaultVisible: true,
  },
  {
    key: 'achievements',
    labelKey: 'profile.sectionAchievements',
    defaultVisible: true,
  },
  {
    key: 'settings',
    labelKey: 'profile.sectionSettings',
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
