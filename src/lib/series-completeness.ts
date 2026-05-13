// Score de completitud para Series. Metrica de curacion interna (no publica).
// Puro, sin acceso a DB: recibe el shape de Series ya hidratado y devuelve
// { score 0-100, missing }. Pesos suman 100. Item por item es independiente
// para que el caller pueda mostrar "que falta" sin recomputar.

export type CompletenessField =
  | 'synopsis'
  | 'imageUrl'
  | 'directors'
  | 'country'
  | 'year'
  | 'originalTitle'
  | 'review'
  | 'tags'
  | 'soundtrack'
  | 'cast';

interface CompletenessInput {
  synopsis?: string | null;
  imageUrl?: string | null;
  year?: number | null;
  originalTitle?: string | null;
  review?: string | null;
  soundtrack?: string | null;
  country?: { id: number } | null;
  directors?: Array<{ directorId: number } | { director?: { id: number } }>;
  tags?: Array<{ tagId: number } | { tag?: { id: number } }>;
  actors?: Array<{ actorId: number } | { actor?: { id: number } }>;
}

interface FieldWeight {
  field: CompletenessField;
  weight: number;
  has: (s: CompletenessInput) => boolean;
}

// Suma 100. Si cambian los pesos, ajustar tambien la UI (texto explicativo).
const FIELDS: FieldWeight[] = [
  {
    field: 'synopsis',
    weight: 15,
    has: (s) => !!s.synopsis && s.synopsis.trim().length >= 30,
  },
  {
    field: 'imageUrl',
    weight: 15,
    has: (s) => !!s.imageUrl && s.imageUrl.trim().length > 0,
  },
  {
    field: 'cast',
    weight: 15,
    has: (s) => Array.isArray(s.actors) && s.actors.length > 0,
  },
  {
    field: 'directors',
    weight: 10,
    has: (s) => Array.isArray(s.directors) && s.directors.length > 0,
  },
  {
    field: 'tags',
    weight: 10,
    has: (s) => Array.isArray(s.tags) && s.tags.length >= 3,
  },
  {
    field: 'review',
    weight: 10,
    has: (s) => !!s.review && s.review.trim().length >= 50,
  },
  {
    field: 'soundtrack',
    weight: 10,
    has: (s) => !!s.soundtrack && s.soundtrack.trim().length > 0,
  },
  { field: 'country', weight: 5, has: (s) => !!s.country },
  {
    field: 'year',
    weight: 5,
    has: (s) => typeof s.year === 'number' && s.year > 0,
  },
  {
    field: 'originalTitle',
    weight: 5,
    has: (s) => !!s.originalTitle && s.originalTitle.trim().length > 0,
  },
];

export interface CompletenessResult {
  score: number;
  missing: CompletenessField[];
  present: CompletenessField[];
  // Util para tooltips: peso de cada campo. Caller puede mostrar "+15 sinopsis".
  weights: Record<CompletenessField, number>;
}

export function computeCompleteness(
  series: CompletenessInput
): CompletenessResult {
  let score = 0;
  const missing: CompletenessField[] = [];
  const present: CompletenessField[] = [];
  const weights = {} as Record<CompletenessField, number>;
  for (const { field, weight, has } of FIELDS) {
    weights[field] = weight;
    if (has(series)) {
      score += weight;
      present.push(field);
    } else {
      missing.push(field);
    }
  }
  return { score, missing, present, weights };
}

export function completenessTier(score: number): 'low' | 'mid' | 'high' {
  if (score < 60) return 'low';
  if (score < 85) return 'mid';
  return 'high';
}
