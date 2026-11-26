/**
 * Comparaciones de texto sin distinguir mayusculas en SQLite/D1.
 *
 * Postgres tenia `mode: 'insensitive'` (ILIKE); SQLite no. Ahi:
 * - `contains`/`startsWith`/`endsWith` usan LIKE, que ya ignora mayusculas
 *   pero solo en ASCII ("Enemy" = "enemy"; "Ñ" != "ñ").
 * - `equals` (=) SI distingue mayusculas.
 *
 * Para buscar "el mismo nombre" (tags, generos, actores, series duplicadas)
 * se piden candidatos con LIKE en las variantes de mayusculas del texto (asi
 * tambien entran los no ASCII) y se elige en JS el que es igual de verdad.
 */

export function caseVariants(value: string): string[] {
  return [
    ...new Set([value, value.toLocaleLowerCase(), value.toLocaleUpperCase()]),
  ];
}

/** `where` con los candidatos a ser iguales a `value` en `field`. */
export function sameTextCandidates<Field extends string>(
  field: Field,
  value: string
): { OR: Array<Record<Field, { contains: string }>> } {
  return {
    OR: caseVariants(value).map(
      (variant) =>
        ({ [field]: { contains: variant } }) as Record<
          Field,
          { contains: string }
        >
    ),
  };
}

/** `where` con los candidatos a ser iguales a alguno de `values`. */
export function sameTextCandidatesAny<Field extends string>(
  field: Field,
  values: string[]
): { OR: Array<Record<Field, { contains: string }>> } {
  return {
    OR: values.flatMap((value) => sameTextCandidates(field, value).OR),
  };
}

export function sameText(a: string | null | undefined, b: string): boolean {
  return (
    typeof a === 'string' && a.toLocaleLowerCase() === b.toLocaleLowerCase()
  );
}

/** El primer row cuyo texto es igual a `value` sin mirar mayusculas. */
export function pickSameText<Row>(
  rows: Row[],
  text: (row: Row) => string | null | undefined,
  value: string
): Row | undefined {
  return rows.find((row) => sameText(text(row), value));
}

/**
 * D1 acepta hasta 100 parametros por consulta, y cada nombre aporta hasta 3
 * variantes: se piden de a tandas para no pasarse aunque la consulta sume
 * otros filtros.
 */
const NAMES_PER_QUERY = 20;

/** Candidatos para muchos nombres a la vez, en tandas que entran en D1. */
export async function findSameTextCandidates<Field extends string, Row>(
  field: Field,
  names: readonly string[],
  find: (where: {
    OR: Array<Record<Field, { contains: string }>>;
  }) => Promise<Row[]>
): Promise<Row[]> {
  const unique = [...new Set(names.filter((name) => name.length > 0))];
  const rows: Row[] = [];
  for (let i = 0; i < unique.length; i += NAMES_PER_QUERY) {
    rows.push(
      ...(await find(
        sameTextCandidatesAny(field, unique.slice(i, i + NAMES_PER_QUERY))
      ))
    );
  }
  return rows;
}
