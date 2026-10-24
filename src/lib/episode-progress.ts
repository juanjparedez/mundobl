/**
 * Donde esta parado el usuario dentro de una serie.
 *
 * Criterio unico: la posicion es el episodio MAS AVANZADO que marco como
 * visto, aunque haya huecos antes. Es el modelo de "voy por el episodio N":
 * quien empieza a seguir una serie por la mitad marca del 10 en adelante, y
 * su siguiente es el 11, no el 1. Antes convivian dos criterios (el stepper
 * usaba este, /watching y /perfil usaban "el primero sin ver") y la misma
 * serie mostraba dos "siguientes" distintos segun la pantalla.
 *
 * Funciones puras: sirven igual en el servidor y en el cliente.
 */

/** Indice del episodio mas avanzado marcado, o -1 si no hay ninguno. */
export function findFurthestWatchedIndex<T>(
  ordered: readonly T[],
  isWatched: (episode: T) => boolean
): number {
  let furthest = -1;
  ordered.forEach((episode, i) => {
    if (isWatched(episode)) furthest = i;
  });
  return furthest;
}

/** El que sigue al mas avanzado marcado; `null` si ya no queda ninguno. */
export function findNextEpisode<T>(
  ordered: readonly T[],
  isWatched: (episode: T) => boolean
): T | null {
  return ordered[findFurthestWatchedIndex(ordered, isWatched) + 1] ?? null;
}

/** Hitos de avance que se festejan; el 100% ya tiene su "¿Terminaste?". */
export const PROGRESS_MILESTONES = [25, 50, 75] as const;

/**
 * El hito mas alto que se cruzo al pasar de `before` a `after` capitulos
 * vistos sobre `total`, o `null` si no se cruzo ninguno (o se retrocedio).
 * Series muy cortas no festejan: con menos de 4 capitulos cada paso es un hito.
 */
export function crossedMilestone(
  before: number,
  after: number,
  total: number
): number | null {
  if (total < 4 || after <= before) return null;
  const crossed = PROGRESS_MILESTONES.filter(
    (milestone) =>
      (before / total) * 100 < milestone && (after / total) * 100 >= milestone
  );
  return crossed.length ? crossed[crossed.length - 1] : null;
}
