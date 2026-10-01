/**
 * Logica pura para guardar las relaciones de una serie por diferencias.
 *
 * Antes el PUT de series hacia `deleteMany` + un `create` por fila en cada
 * relacion, fuera de transaccion: un guardado que se cortaba a mitad de
 * camino dejaba la ficha sin etiquetas o sin reparto, y cada guardado pagaba
 * ~50 viajes a la base aunque no se hubiera tocado nada. Aca solo se decide
 * QUE cambiar; las escrituras las hace el caller dentro de una transaccion.
 */

/** Diferencia entre dos conjuntos de ids (etiquetas, generos, directores...). */
export function diffIdSets(
  current: readonly number[],
  desired: readonly number[]
): { toDelete: number[]; toCreate: number[] } {
  const currentSet = new Set(current);
  const desiredSet = new Set(desired);
  return {
    toDelete: [...currentSet].filter((id) => !desiredSet.has(id)),
    toCreate: [...desiredSet].filter((id) => !currentSet.has(id)),
  };
}

/**
 * Para listas donde el orden importa (reparto, links): si la secuencia es la
 * misma no se toca nada; si cambio, el caller reemplaza la lista entera dentro
 * de la transaccion (2 consultas, atomico).
 */
export function sameSequence<T>(
  current: readonly T[],
  desired: readonly T[],
  keyOf: (item: T) => string
): boolean {
  if (current.length !== desired.length) return false;
  return current.every((item, index) => keyOf(item) === keyOf(desired[index]));
}

export interface ActorRow {
  actorId: number;
  character: string;
  isMain: boolean;
  pairingGroup: number | null;
}

export const actorRowKey = (row: ActorRow): string =>
  `${row.actorId}|${row.character}|${row.isMain}|${row.pairingGroup ?? ''}`;

/**
 * `@@unique([seriesId, actorId, character])`: dos filas iguales en el form
 * hacian fallar el guardado a mitad de camino. Se queda la primera.
 */
export function dedupeActorRows(rows: readonly ActorRow[]): ActorRow[] {
  const seen = new Set<string>();
  return rows.filter((row) => {
    const key = `${row.actorId}|${row.character}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export interface WatchLinkRow {
  platform: string;
  url: string;
  official: boolean;
}

export const watchLinkRowKey = (row: WatchLinkRow): string =>
  `${row.platform}|${row.url}|${row.official}`;

/** Nombres sin vacios ni repetidos (sin distinguir mayusculas), en orden. */
export function cleanNames(names: readonly unknown[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of names) {
    if (typeof raw !== 'string') continue;
    const name = raw.trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(name);
  }
  return out;
}

export const nameKey = (name: string): string => name.trim().toLowerCase();
