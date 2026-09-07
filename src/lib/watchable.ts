/**
 * Que cuenta como "mirable" en /ver — un solo lugar.
 *
 * La definicion vivia copiada en 12 archivos como `embedUrl: { not: null }`
 * (landing, /novedades, sitemap, getWatchableSeries, /ver/[id], ...). Eso
 * hizo que arreglar un criterio en un lado dejara los otros once mal, que
 * es exactamente como "Some More" siguio publicada despues de que el audit
 * ya la detectara: la deteccion vivia en el script y ninguna consulta la
 * consultaba.
 *
 * Hay DOS condiciones y las dos son necesarias:
 *
 *   1. Tiene embed          — `embedUrl != null`.
 *   2. No es un trailer     — dura al menos MIN_EPISODE_SECONDS.
 *
 * `durationSeconds = NULL` (todavia no sondeado) cuenta como mirable a
 * proposito: es el mismo criterio conservador que UNKNOWN en isPlayableIn()
 * — preferimos mostrar de mas antes que vaciar /ver porque el audit no
 * corrio. Como hoy la columna esta en NULL en el 100% de los episodios,
 * esto significa que nada desaparece hasta que el audit pase; el filtro
 * empieza a morder recien con datos reales.
 */

import { Prisma } from '../generated/prisma';
import { MIN_EPISODE_SECONDS } from './playability';

/**
 * Episodio publicable en /ver. Usar en todo `where` de Episode que
 * alimente una superficie PUBLICA.
 *
 * No usar en las vistas de administracion ni en los scripts: /admin/ver
 * tiene que seguir viendo los trailers (para poder sacarlos) y el audit
 * tiene que poder sondearlos (es lo que llena `durationSeconds`).
 */
export const WATCHABLE_EPISODE_WHERE =
  Prisma.validator<Prisma.EpisodeWhereInput>()({
    embedUrl: { not: null },
    OR: [
      { durationSeconds: null },
      { durationSeconds: { gte: MIN_EPISODE_SECONDS } },
    ],
  });

/** Serie con al menos un episodio publicable en /ver. */
export const HAS_WATCHABLE_EPISODE =
  Prisma.validator<Prisma.SeriesWhereInput>()({
    seasons: { some: { episodes: { some: WATCHABLE_EPISODE_WHERE } } },
  });

/**
 * Version en memoria del mismo criterio, para filtrar episodios ya
 * traidos de la base (ej. /ver/[id], que carga la serie entera y arma las
 * temporadas en JS).
 */
export function isWatchableEpisode(episode: {
  embedUrl: string | null;
  durationSeconds: number | null;
}): boolean {
  if (!episode.embedUrl) return false;
  return !isTrailerLength(episode.durationSeconds);
}

/**
 * ¿Este video es un trailer/teaser/clip y no un capitulo?
 *
 * `null` devuelve false: sin duracion sondeada no se afirma nada.
 */
export function isTrailerLength(durationSeconds: number | null): boolean {
  if (durationSeconds === null) return false;
  return durationSeconds < MIN_EPISODE_SECONDS;
}
