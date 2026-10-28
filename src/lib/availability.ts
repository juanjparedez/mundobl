import type { PlaybackStatus } from './playability';

/** Lo que va a pasar al darle play, para decirlo antes del click. */
export type Availability =
  | 'ok'
  | 'blocked_here'
  | 'blocked_somewhere'
  | 'platform_only'
  // YouTube no lo reproduce fuera de su sitio: cuenta mayor de 18 allá.
  | 'age_restricted'
  | 'removed';

/**
 * Disponibilidad de un video para quien mira desde `country` (ISO-2), o
 * null si todavia no se sabe de donde: entonces un bloqueo regional se
 * avisa como "en algunos paises". UNKNOWN (sin sondear) cuenta como ok,
 * igual que en isPlayableIn.
 *
 * Modulo aparte de playability.ts a proposito: aquel trae el cliente de la
 * API de YouTube y esto corre en el navegador.
 */
export function availabilityOf(
  playback: PlaybackStatus,
  blockedMarkets: readonly string[],
  country: string | null
): Availability {
  switch (playback) {
    case 'REMOVED':
      return 'removed';
    case 'AGE_RESTRICTED':
      return 'age_restricted';
    case 'NOT_EMBEDDABLE':
      return 'platform_only';
    case 'GEO_BLOCKED':
      if (!country || blockedMarkets.length === 0) return 'blocked_somewhere';
      return blockedMarkets.includes(country) ? 'blocked_here' : 'ok';
    default:
      return 'ok';
  }
}

/**
 * Lo que /ver necesita saber de los episodios de una serie para contar los
 * reproducibles en CUALQUIER mercado sin mandar cada episodio al cliente.
 *
 * Existe porque /ver es ISR: el HTML es el mismo para todos, asi que el
 * servidor no puede elegir el pais del visitante. Manda este resumen y el
 * cliente resuelve con `playableCountIn` cuando sabe de donde mira.
 */
export interface PlayabilitySummary {
  /** AGE_RESTRICTED, REMOVED o NOT_EMBEDDABLE: no andan en ningun lado. */
  blockedEverywhere: number;
  /** ISO-2 → episodios GEO_BLOCKED en ese mercado. */
  blockedByMarket: Record<string, number>;
}

export function summarizePlayability(
  episodes: ReadonlyArray<{
    playback: PlaybackStatus;
    playbackBlockedMarkets: string[];
  }>
): PlayabilitySummary {
  const summary: PlayabilitySummary = {
    blockedEverywhere: 0,
    blockedByMarket: {},
  };
  for (const episode of episodes) {
    if (episode.playback === 'GEO_BLOCKED') {
      for (const market of new Set(episode.playbackBlockedMarkets)) {
        summary.blockedByMarket[market] =
          (summary.blockedByMarket[market] ?? 0) + 1;
      }
    } else if (
      episode.playback === 'AGE_RESTRICTED' ||
      episode.playback === 'REMOVED' ||
      episode.playback === 'NOT_EMBEDDABLE'
    ) {
      summary.blockedEverywhere += 1;
    }
  }
  return summary;
}

/**
 * Episodios reproducibles desde `market`, igual que contar con
 * `isPlayableIn` de playability.ts. Con `market` null (pais todavia desconocido) solo se
 * descuentan los que no andan en ningun lado: no se inventa un bloqueo
 * regional sin saber la region.
 */
export function playableCountIn(
  total: number,
  summary: PlayabilitySummary,
  market: string | null
): number {
  const regional = market ? (summary.blockedByMarket[market] ?? 0) : 0;
  return Math.max(0, total - summary.blockedEverywhere - regional);
}
