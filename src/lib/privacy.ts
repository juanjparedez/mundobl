/**
 * Compuerta de notas privadas de curaduria (`Series.notesPrivate`).
 *
 * `review` y `observations` son notas personales del equipo de curaduria.
 * Con `notesPrivate = false` son publicas; con `true` solo las ve un ADMIN.
 *
 * IMPORTANTE — esta compuerta tiene que aplicarse en el SERVIDOR, antes de
 * pasar la serie a cualquier componente 'use client'. Esconder el bloque en
 * el render NO alcanza: las props de un client component viajan igual en el
 * payload RSC del HTML y quedan legibles con "ver codigo fuente" sin sesion.
 * Ese era exactamente el bug (502 series afectadas) que este helper cierra.
 *
 * Para actores/directores no hace falta llamar esto: sus queries usan
 * `select` explicito y nunca traen estos campos.
 */

/** Campos sensibles + su flag. Deliberadamente laxo para aceptar cualquier
 *  shape de serie hidratada (page, dashboard, admin) sin acoplarse a Prisma. */
export interface PrivateNotesFields {
  review?: string | null;
  observations?: string | null;
  notesPrivate?: boolean | null;
}

/**
 * Devuelve la serie sin las notas privadas cuando el visitante no puede
 * verlas. Preserva el resto del objeto intacto.
 *
 * @param serie   serie ya hidratada
 * @param isAdmin true solo si la sesion del servidor dice ADMIN
 */
export function stripPrivateNotes<T extends PrivateNotesFields>(
  serie: T,
  isAdmin: boolean
): T {
  if (isAdmin || !serie.notesPrivate) return serie;
  return { ...serie, review: null, observations: null };
}

/** Variante para listados. Mismo criterio, aplicado item por item. */
export function stripPrivateNotesFromList<T extends PrivateNotesFields>(
  series: T[],
  isAdmin: boolean
): T[] {
  if (isAdmin) return series;
  return series.map((s) => stripPrivateNotes(s, false));
}
