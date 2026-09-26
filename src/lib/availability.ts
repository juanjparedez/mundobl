import type { PlaybackStatus } from './playability';

/** Lo que va a pasar al darle play, para decirlo antes del click. */
export type Availability =
  | 'ok'
  | 'blocked_here'
  | 'blocked_somewhere'
  | 'youtube_only'
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
    case 'NOT_EMBEDDABLE':
      return 'youtube_only';
    case 'GEO_BLOCKED':
      if (!country || blockedMarkets.length === 0) return 'blocked_somewhere';
      return blockedMarkets.includes(country) ? 'blocked_here' : 'ok';
    default:
      return 'ok';
  }
}
