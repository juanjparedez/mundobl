/**
 * El episodio en la URL de /ver: `?e=1x5` (temporada x episodio).
 *
 * Vive aca y no en el reproductor porque lo escriben varias pantallas
 * —el propio reproductor, "Seguir viendo" en /watching, los avisos— y el
 * formato tiene que ser uno solo.
 */

export const EPISODE_PARAM = 'e';

export interface EpisodeRef {
  seasonNumber: number;
  episodeNumber: number;
}

/** `1x5` — temporada por episodio, como lo diria una persona. */
export function formatEpisodeParam(episode: EpisodeRef): string {
  return `${episode.seasonNumber}x${episode.episodeNumber}`;
}

export function parseEpisodeParam(raw: string): EpisodeRef | null {
  const match = /^(\d+)x(\d+)$/.exec(raw.trim());
  if (!match) return null;
  return { seasonNumber: Number(match[1]), episodeNumber: Number(match[2]) };
}

function isAfter(a: EpisodeRef, b: EpisodeRef): boolean {
  return (
    a.seasonNumber > b.seasonNumber ||
    (a.seasonNumber === b.seasonNumber && a.episodeNumber > b.episodeNumber)
  );
}

/**
 * Indice del episodio pedido dentro de una lista ordenada.
 *
 * Si no esta —en /ver solo aparecen los episodios que se pueden reproducir
 * aca, o el link apunta a uno que se borro— devuelve el mas cercano: el
 * primero que viene despues, o el ultimo si el pedido quedo mas alla de todo.
 * Caer siempre en el primero era justo lo que hacia que "Seguir viendo"
 * arrancara la serie de cero. Un valor ilegible abre el primero.
 */
export function findEpisodeIndex(
  episodes: readonly EpisodeRef[],
  raw: string
): number {
  const target = parseEpisodeParam(raw);
  if (!target || episodes.length === 0) return 0;

  const exact = episodes.findIndex(
    (e) =>
      e.seasonNumber === target.seasonNumber &&
      e.episodeNumber === target.episodeNumber
  );
  if (exact !== -1) return exact;

  const next = episodes.findIndex((e) => isAfter(e, target));
  return next === -1 ? episodes.length - 1 : next;
}
