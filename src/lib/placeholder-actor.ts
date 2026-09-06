/**
 * Actor placeholder: "Actor no identificado".
 *
 * En 36 series del catalogo se cargaron los nombres de PERSONAJE pero no se
 * supo quien los interpreta. En vez de perder esos personajes, esas filas de
 * SeriesActor apuntan todas a un unico Actor placeholder (antes se llamaba
 * "-", que no se entendia en el admin).
 *
 * No es una persona: no tiene que aparecer en el indice de actores, ni tener
 * ficha publica, ni entrar al sitemap, ni salir en el buscador. Si aparece en
 * la ficha de una serie, es como "personaje sin actor asignado".
 *
 * TODO(fase 2): cuando corra la migracion de personas, reemplazar este chequeo
 * por una columna `Actor.isPlaceholder` — comparar por nombre funciona porque
 * `Actor.name` es @unique, pero una columna es mas robusta ante renames.
 */
export const PLACEHOLDER_ACTOR_NAME = 'Actor no identificado';

/** True si este actor es el placeholder de "personaje sin actor conocido". */
export function isPlaceholderActor(actor: { name: string }): boolean {
  return actor.name === PLACEHOLDER_ACTOR_NAME;
}

/** Filtro Prisma para excluirlo de cualquier listado publico de actores. */
export const EXCLUDE_PLACEHOLDER_ACTOR = {
  name: { not: PLACEHOLDER_ACTOR_NAME },
} as const;
