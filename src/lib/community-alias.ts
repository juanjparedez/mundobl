/**
 * Alias publico de quien no publica su nombre en la comunidad: "Luna de
 * Septiembre" en vez de "Miembro anonimo 3". Se arma con dos listas de
 * sustantivos por idioma (communityAlias.firstWords/secondWords en i18n) y
 * una plantilla, asi no hay concordancia de genero que romper.
 *
 * La semilla es CommunityProfile.aliasSeed si la persona eligio otro; si no,
 * un hash del userId: estable, sin guardar nada, y no deja deducir el id.
 */
export const ALIAS_WORD_COUNT = 24;
const ALIAS_COMBINATIONS = ALIAS_WORD_COUNT * ALIAS_WORD_COUNT;
/** Un cambio de alias cada 10 minutos alcanza para elegir uno que guste. */
export const ALIAS_REROLL_COOLDOWN_MS = 10 * 60 * 1000;

export interface AliasParts {
  first: number;
  second: number;
}

// FNV-1a de 32 bits: suficiente para repartir, no es criptografico.
function fnv1a(text: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash;
}

export function aliasSeedFor(userId: string, storedSeed?: number | null) {
  return storedSeed ?? fnv1a(`mundobl-alias:${userId}`);
}

export function aliasParts(seed: number): AliasParts {
  const index = Math.abs(Math.trunc(seed)) % ALIAS_COMBINATIONS;
  return {
    first: index % ALIAS_WORD_COUNT,
    second: Math.floor(index / ALIAS_WORD_COUNT),
  };
}

/** Una semilla nueva que no repite la combinacion actual. */
export function nextAliasSeed(current: number, random = Math.random): number {
  const index = Math.abs(Math.trunc(current)) % ALIAS_COMBINATIONS;
  const offset = 1 + Math.floor(random() * (ALIAS_COMBINATIONS - 1));
  return (index + offset) % ALIAS_COMBINATIONS;
}

/**
 * En una misma lista nadie comparte alias: si dos semillas caen en la misma
 * combinacion, la segunda corre a la siguiente libre.
 */
export function distinctAliasParts(seeds: number[]): AliasParts[] {
  const used = new Set<number>();
  return seeds.map((seed) => {
    let index = Math.abs(Math.trunc(seed)) % ALIAS_COMBINATIONS;
    while (used.has(index)) index = (index + 1) % ALIAS_COMBINATIONS;
    used.add(index);
    return aliasParts(index);
  });
}

/** Arma el alias con las palabras del idioma actual. */
export function formatAlias(
  parts: AliasParts,
  words: { first: string; second: string; template: string }
): string {
  const pick = (list: string, index: number) => {
    const options = list.split('|').map((word) => word.trim());
    return options[index % options.length] ?? '';
  };
  return words.template
    .replace('{first}', pick(words.first, parts.first))
    .replace('{second}', pick(words.second, parts.second));
}
