/**
 * Actor placeholder: "Actor no identificado".
 *
 * En 36 series del catalogo se cargaron los nombres de PERSONAJE pero no se
 * supo quien los interpreta. En vez de perder esos personajes, esas filas de
 * SeriesActor apuntan todas a un unico Actor marcado con `isPlaceholder`
 * (antes se llamaba "-", que no se entendia en el admin).
 *
 * No es una persona: no aparece en el indice de actores, no tiene ficha
 * publica, no entra al sitemap ni al buscador. En la ficha de una serie se
 * lee como "personaje sin actor asignado".
 *
 * El marcador es la columna `Actor.isPlaceholder`, no el nombre: asi renombrarlo
 * no lo vuelve a colar en los listados.
 */
export const PLACEHOLDER_ACTOR_NAME = 'Actor no identificado';

/** True si este actor es el placeholder de "personaje sin actor conocido". */
export function isPlaceholderActor(actor: {
  isPlaceholder?: boolean | null;
  name?: string;
}): boolean {
  // Fallback por nombre solo por si el caller trae un select viejo sin la
  // columna — la fuente de verdad es isPlaceholder.
  return actor.isPlaceholder === true || actor.name === PLACEHOLDER_ACTOR_NAME;
}

/** Filtro Prisma para excluirlo de cualquier listado publico de actores. */
export const EXCLUDE_PLACEHOLDER_ACTOR = {
  isPlaceholder: false,
} as const;
