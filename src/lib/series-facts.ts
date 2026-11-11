// ============================================
// Datos de la serie con emoji (SeriesFactVote / SeriesFactOverride)
// ============================================
//
// Cosas que la gente quiere saber antes de empezar un BL: si se besan, si hay
// escenas intimas, como termina. Las cuentas votan; el valor publico es el
// del equipo si lo fijo, o el de la comunidad cuando hay consenso.
//
// Claves y valores estan tambien en los CHECK de la migracion
// 20261111040000_series_facts: cambiarlos necesita migracion.
export const SERIES_FACTS = [
  {
    key: 'kiss',
    emoji: '💋',
    values: ['none', 'yes', 'several'],
    spoiler: false,
  },
  {
    key: 'intimacy',
    emoji: '🔥',
    values: ['none', 'implied', 'shown'],
    spoiler: false,
  },
  {
    key: 'together',
    emoji: '💑',
    values: ['yes', 'no', 'open'],
    spoiler: true,
  },
  {
    key: 'ending',
    emoji: '🌈',
    values: ['happy', 'sad', 'bittersweet'],
    spoiler: true,
  },
  {
    key: 'drama',
    emoji: '😭',
    values: ['light', 'medium', 'heavy'],
    spoiler: false,
  },
  { key: 'sidecouple', emoji: '💞', values: ['yes', 'no'], spoiler: false },
  { key: 'triangle', emoji: '💔', values: ['yes', 'no'], spoiler: false },
] as const;

export type SeriesFact = (typeof SERIES_FACTS)[number];
export type SeriesFactKey = SeriesFact['key'];
export type SeriesFactValue = SeriesFact['values'][number];

/** Votos minimos que coinciden para mostrar un dato de la comunidad. */
export const FACT_MIN_AGREEING_VOTES = 3;
/** Y tienen que ser al menos esta parte de los votos de ese dato. */
export const FACT_MIN_SHARE = 2 / 3;

/** Roles que pueden fijar el valor oficial de un dato. */
export const FACT_EDITOR_ROLES = [
  'ADMIN',
  'MODERATOR',
  'COLLABORATOR',
] as const;

export function isSeriesFactKey(value: unknown): value is SeriesFactKey {
  return SERIES_FACTS.some((fact) => fact.key === value);
}

/** true si el valor es valido para ese dato. */
export function isFactValue(fact: SeriesFactKey, value: unknown): boolean {
  const def = SERIES_FACTS.find((f) => f.key === fact);
  return !!def && (def.values as readonly unknown[]).includes(value);
}

export interface ResolvedFact {
  value: string | null;
  source: 'staff' | 'community' | null;
  /** Votos de la comunidad para este dato (todos los valores). */
  votes: number;
}

export type ResolvedFacts = Record<SeriesFactKey, ResolvedFact>;

/**
 * Valor publico de cada dato: el fijado por el equipo, o el de la comunidad
 * si el mas votado tiene FACT_MIN_AGREEING_VOTES y FACT_MIN_SHARE.
 */
export function resolveFacts(
  voteRows: ReadonlyArray<{ fact: string; value: string; count: number }>,
  overrides: ReadonlyArray<{ fact: string; value: string }>
): ResolvedFacts {
  const result = {} as ResolvedFacts;
  for (const { key } of SERIES_FACTS) {
    const rows = voteRows.filter(
      (row) => row.fact === key && isFactValue(key, row.value)
    );
    const votes = rows.reduce((sum, row) => sum + row.count, 0);
    const override = overrides.find(
      (row) => row.fact === key && isFactValue(key, row.value)
    );
    if (override) {
      result[key] = { value: override.value, source: 'staff', votes };
      continue;
    }
    const top = [...rows].sort((a, b) => b.count - a.count)[0];
    const tied = rows.filter((row) => row.count === top?.count).length > 1;
    const agreed =
      top &&
      !tied &&
      top.count >= FACT_MIN_AGREEING_VOTES &&
      top.count / votes >= FACT_MIN_SHARE;
    result[key] = agreed
      ? { value: top.value, source: 'community', votes }
      : { value: null, source: null, votes };
  }
  return result;
}
