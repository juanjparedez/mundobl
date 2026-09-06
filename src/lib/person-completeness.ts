// Score de completitud para personas y productoras. Contraparte de
// `series-completeness.ts`, mismo contrato: puro, sin acceso a DB, recibe el
// shape ya hidratado y devuelve { score 0-100, missing }. Los pesos suman 100.
//
// Sirve para dos cosas:
//   1. Priorizar la curacion en el admin (que ficha completar primero).
//   2. Decidir si una ficha entra al sitemap — ver `isIndexablePerson`.

export type PersonCompletenessField =
  | 'imageUrl'
  | 'biography'
  | 'nationality'
  | 'birth'
  | 'externalLinks'
  | 'credits';

export type CompanyCompletenessField =
  | 'imageUrl'
  | 'description'
  | 'country'
  | 'links'
  | 'foundedYear'
  | 'series';

export interface PersonCompletenessInput {
  imageUrl?: string | null;
  biography?: string | null;
  nationality?: string | null;
  /** Actor usa birthDate; Director usa birthYear. Se acepta cualquiera. */
  birthDate?: Date | string | null;
  birthYear?: number | null;
  imdbUrl?: string | null;
  mdlUrl?: string | null;
  wikiUrl?: string | null;
  /** Cantidad de creditos (series + temporadas) ya calculada por el caller. */
  creditCount?: number;
}

export interface CompanyCompletenessInput {
  imageUrl?: string | null;
  description?: string | null;
  countryId?: number | null;
  country?: string | null;
  websiteUrl?: string | null;
  youtubeUrl?: string | null;
  foundedYear?: number | null;
  seriesCount?: number;
}

interface Weight<F extends string, I> {
  field: F;
  weight: number;
  has: (input: I) => boolean;
}

const hasText = (v: string | null | undefined, min = 1): boolean =>
  typeof v === 'string' && v.trim().length >= min;

const PERSON_FIELDS: Weight<
  PersonCompletenessField,
  PersonCompletenessInput
>[] = [
  { field: 'imageUrl', weight: 25, has: (p) => hasText(p.imageUrl) },
  { field: 'biography', weight: 20, has: (p) => hasText(p.biography, 80) },
  { field: 'nationality', weight: 15, has: (p) => hasText(p.nationality) },
  {
    field: 'externalLinks',
    weight: 15,
    has: (p) => hasText(p.imdbUrl) || hasText(p.mdlUrl) || hasText(p.wikiUrl),
  },
  {
    field: 'credits',
    weight: 15,
    has: (p) => (p.creditCount ?? 0) > 0,
  },
  {
    field: 'birth',
    weight: 10,
    has: (p) =>
      !!p.birthDate || (typeof p.birthYear === 'number' && p.birthYear > 0),
  },
];

const COMPANY_FIELDS: Weight<
  CompanyCompletenessField,
  CompanyCompletenessInput
>[] = [
  { field: 'imageUrl', weight: 25, has: (c) => hasText(c.imageUrl) },
  { field: 'description', weight: 25, has: (c) => hasText(c.description, 60) },
  {
    field: 'country',
    weight: 20,
    has: (c) => typeof c.countryId === 'number' || hasText(c.country),
  },
  {
    field: 'links',
    weight: 15,
    has: (c) => hasText(c.websiteUrl) || hasText(c.youtubeUrl),
  },
  {
    field: 'foundedYear',
    weight: 10,
    has: (c) => typeof c.foundedYear === 'number' && c.foundedYear > 0,
  },
  { field: 'series', weight: 5, has: (c) => (c.seriesCount ?? 0) > 0 },
];

export interface CompletenessResult<F extends string> {
  score: number;
  missing: F[];
  present: F[];
  weights: Record<F, number>;
}

function compute<F extends string, I>(
  fields: Weight<F, I>[],
  input: I
): CompletenessResult<F> {
  let score = 0;
  const missing: F[] = [];
  const present: F[] = [];
  const weights = {} as Record<F, number>;
  for (const { field, weight, has } of fields) {
    weights[field] = weight;
    if (has(input)) {
      score += weight;
      present.push(field);
    } else {
      missing.push(field);
    }
  }
  return { score, missing, present, weights };
}

export function computePersonCompleteness(
  person: PersonCompletenessInput
): CompletenessResult<PersonCompletenessField> {
  return compute(PERSON_FIELDS, person);
}

export function computeCompanyCompleteness(
  company: CompanyCompletenessInput
): CompletenessResult<CompanyCompletenessField> {
  return compute(COMPANY_FIELDS, company);
}

/**
 * Umbral para publicar una ficha en el sitemap.
 *
 * Hoy 100% de los actores y directores no tienen foto ni biografia, asi que el
 * sitemap estaba ofreciendo ~1500 fichas practicamente vacias — thin content:
 * Google lo penaliza a nivel dominio, no solo por pagina.
 *
 * Criterio: una ficha vale la pena indexarla si aporta ALGO propio (foto o
 * biografia) o si su filmografia por si sola ya es util (2+ creditos). Las
 * demas siguen navegables y linkeadas, pero con `noindex` hasta que se
 * pueblen. Al cargar datos, entran solas.
 */
export function isIndexablePerson(input: {
  imageUrl?: string | null;
  biography?: string | null;
  creditCount?: number;
}): boolean {
  return (
    hasText(input.imageUrl) ||
    hasText(input.biography, 80) ||
    (input.creditCount ?? 0) >= 2
  );
}

/** Mismo criterio para productoras. */
export function isIndexableCompany(input: {
  imageUrl?: string | null;
  description?: string | null;
  seriesCount?: number;
}): boolean {
  return (
    hasText(input.imageUrl) ||
    hasText(input.description, 60) ||
    (input.seriesCount ?? 0) >= 2
  );
}

export function completenessTier(score: number): 'low' | 'mid' | 'high' {
  if (score < 50) return 'low';
  if (score < 80) return 'mid';
  return 'high';
}
