/**
 * Puntaje de "series parecidas", sin base de datos: lo usan la ficha
 * ("Si te gusto esta") y /watching ("Para vos"). Una serie se describe por
 * sus tags, generos y actores; el perfil es la suma de las series semilla
 * (una sola en la ficha, la biblioteca del usuario en /watching).
 *
 * Cada rasgo compartido suma su peso por tipo dividido por el logaritmo de
 * cuantos candidatos lo tienen: un actor de nicho pesa mas que "Romance",
 * que comparte medio catalogo.
 */

export interface RecommendationFeatures {
  tagIds: number[];
  genreIds: number[];
  actorIds: number[];
}

export interface RecommendationSeed extends RecommendationFeatures {
  id: number;
  title: string;
  /** Multiplica el aporte de la semilla (favorita + vista pesa mas). */
  weight: number;
}

export interface RecommendationCandidate extends RecommendationFeatures {
  id: number;
  overallRating?: number | null;
  year?: number | null;
}

export interface ScoredRecommendation<T> {
  candidate: T;
  score: number;
  /** Semilla que mas aporto: "Porque viste X". */
  becauseOf: { id: number; title: string } | null;
}

/** Lo que viaja al cliente por cada serie sugerida. */
export interface RecommendedSeriesCard {
  id: number;
  title: string;
  year: number | null;
  type: string;
  imageUrl: string | null;
  imageThumbUrl: string | null;
  countryName: string | null;
  /** Serie de la biblioteca que la explica ("Porque viste X"). */
  becauseOf: { id: number; title: string } | null;
}

/** Respuesta de GET /api/user/recommendations. */
export interface UserRecommendations {
  /** personal: sale de su biblioteca; popular: no hay con que armarla. */
  kind: 'personal' | 'popular';
  series: RecommendedSeriesCard[];
}

const TYPE_WEIGHTS = { actor: 3, tag: 2, genre: 1 } as const;
type FeatureType = keyof typeof TYPE_WEIGHTS;

/** Un genero o un tag sueltos en comun no alcanzan para llamarla
 *  "parecida": hace falta un actor o al menos dos rasgos. */
const MIN_SHARED_FEATURES = 2;

function featureKeys(features: RecommendationFeatures): string[] {
  return [
    ...features.actorIds.map((id) => `actor:${id}`),
    ...features.tagIds.map((id) => `tag:${id}`),
    ...features.genreIds.map((id) => `genre:${id}`),
  ];
}

function typeWeight(key: string): number {
  return TYPE_WEIGHTS[key.slice(0, key.indexOf(':')) as FeatureType];
}

export function scoreRecommendations<T extends RecommendationCandidate>(
  seeds: RecommendationSeed[],
  candidates: T[],
  limit: number
): ScoredRecommendation<T>[] {
  const frequency = new Map<string, number>();
  for (const candidate of candidates) {
    for (const key of featureKeys(candidate)) {
      frequency.set(key, (frequency.get(key) ?? 0) + 1);
    }
  }

  const seedKeys = seeds.map((seed) => ({
    seed,
    keys: new Set(featureKeys(seed)),
  }));

  const scored: ScoredRecommendation<T>[] = [];
  for (const candidate of candidates) {
    let score = 0;
    let shared = 0;
    let sharesActor = false;
    const perSeed = new Map<number, number>();
    for (const key of featureKeys(candidate)) {
      const rarity = typeWeight(key) / Math.log2(1 + (frequency.get(key) ?? 1));
      let matched = false;
      for (const { seed, keys } of seedKeys) {
        if (!keys.has(key)) continue;
        matched = true;
        const points = rarity * seed.weight;
        score += points;
        perSeed.set(seed.id, (perSeed.get(seed.id) ?? 0) + points);
      }
      if (matched) {
        shared += 1;
        if (key.startsWith('actor:')) sharesActor = true;
      }
    }
    if (!sharesActor && shared < MIN_SHARED_FEATURES) continue;

    let becauseOf: ScoredRecommendation<T>['becauseOf'] = null;
    let best = 0;
    for (const { seed } of seedKeys) {
      const points = perSeed.get(seed.id) ?? 0;
      if (points > best) {
        best = points;
        becauseOf = { id: seed.id, title: seed.title };
      }
    }
    scored.push({ candidate, score, becauseOf });
  }

  return scored
    .sort(
      (a, b) =>
        b.score - a.score ||
        (b.candidate.overallRating ?? 0) - (a.candidate.overallRating ?? 0) ||
        (b.candidate.year ?? 0) - (a.candidate.year ?? 0) ||
        a.candidate.id - b.candidate.id
    )
    .slice(0, limit);
}
