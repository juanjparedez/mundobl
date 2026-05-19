// Score de completitud del perfil de usuario (#112 fase 3). Espeja el
// patrón puro de series-completeness.ts: recibe el shape ya hidratado de
// ProfileData (user + stats), devuelve { score 0-100, missing }. Pesos
// suman 100. Reusa completenessTier para el tier (low/mid/high).

import { completenessTier } from './series-completeness';

export type ProfileCompletenessField =
  | 'avatar'
  | 'displayName'
  | 'socials'
  | 'favorites'
  | 'ratings'
  | 'reviews';

interface ProfileCompletenessInput {
  user: {
    name: string | null;
    image: string | null;
    // socials es un objeto con keys conocidas (UserSocials) pero lo
    // tipamos laxo para no acoplar la lib a esa shape; solo importa si
    // hay algún valor string no vacío.
    socials?: unknown;
  };
  stats: {
    favorites: number;
    ratings: number;
    reviews: number;
  };
}

interface FieldWeight {
  field: ProfileCompletenessField;
  weight: number;
  has: (s: ProfileCompletenessInput) => boolean;
}

const hasAnySocial = (socials: unknown): boolean =>
  !!socials &&
  typeof socials === 'object' &&
  Object.values(socials as Record<string, unknown>).some(
    (v) => typeof v === 'string' && v.trim().length > 0
  );

// Suma 100.
const FIELDS: FieldWeight[] = [
  { field: 'avatar', weight: 20, has: (s) => !!s.user.image },
  {
    field: 'displayName',
    weight: 15,
    has: (s) => !!s.user.name && s.user.name.trim().length > 0,
  },
  {
    field: 'socials',
    weight: 15,
    has: (s) => hasAnySocial(s.user.socials),
  },
  { field: 'favorites', weight: 15, has: (s) => s.stats.favorites > 0 },
  { field: 'ratings', weight: 15, has: (s) => s.stats.ratings > 0 },
  { field: 'reviews', weight: 20, has: (s) => s.stats.reviews > 0 },
];

export interface ProfileCompletenessResult {
  score: number;
  missing: ProfileCompletenessField[];
  tier: 'low' | 'mid' | 'high';
}

export function computeProfileCompleteness(
  input: ProfileCompletenessInput
): ProfileCompletenessResult {
  let score = 0;
  const missing: ProfileCompletenessField[] = [];
  for (const { field, weight, has } of FIELDS) {
    if (has(input)) score += weight;
    else missing.push(field);
  }
  return { score, missing, tier: completenessTier(score) };
}
