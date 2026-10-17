import { groupIntoChapters, type EpisodeRow } from './episode-chapters';

/**
 * Un aporte USER_EMBED vinculado a una ficha curada es la misma serie con
 * otros videos: el aporte suele partir cada capitulo en partes y la ficha
 * tiene uno por fila. El progreso se copia entre los dos por capitulo
 * (temporada + numero), nunca por video.
 */
export interface LinkedChapterPair {
  aporteIds: number[];
  curatedIds: number[];
}

/**
 * Empareja los capitulos del aporte con los de la ficha. Devuelve null si
 * algun capitulo del aporte no existe en la ficha: el vinculo no calza (o
 * esta mal hecho) y copiar marcaria capitulos equivocados.
 */
export function pairLinkedChapters(
  aporte: readonly EpisodeRow[],
  curated: readonly EpisodeRow[]
): LinkedChapterPair[] | null {
  const aporteChapters = groupIntoChapters(aporte).chapters;
  if (aporteChapters.length === 0) return null;

  const curatedByKey = new Map(
    groupIntoChapters(curated).chapters.map((chapter) => [
      `${chapter.seasonNumber}:${chapter.number}`,
      chapter.episodes.map((episode) => episode.id),
    ])
  );

  const pairs: LinkedChapterPair[] = [];
  for (const chapter of aporteChapters) {
    const curatedIds = curatedByKey.get(
      `${chapter.seasonNumber}:${chapter.number}`
    );
    if (!curatedIds) return null;
    pairs.push({
      aporteIds: chapter.episodes.map((episode) => episode.id),
      curatedIds,
    });
  }
  return pairs;
}

/**
 * Que episodios del otro lado hay que marcar o desmarcar despues de tocar
 * `touched` en `side`.
 *
 * - Al marcar, el capitulo se copia recien cuando quedaron vistas todas sus
 *   partes: ver 1 de 4 partes no es ver el capitulo.
 * - Al desmarcar, cualquier parte desmarcada desmarca el capitulo.
 */
export function linkedEpisodesToSync(
  pairs: readonly LinkedChapterPair[],
  side: 'aporte' | 'curated',
  touched: ReadonlySet<number>,
  watchedNow: ReadonlySet<number>,
  watched: boolean
): number[] {
  return pairs.flatMap((pair) => {
    const source = side === 'aporte' ? pair.aporteIds : pair.curatedIds;
    const target = side === 'aporte' ? pair.curatedIds : pair.aporteIds;
    if (!source.some((id) => touched.has(id))) return [];
    if (watched && !source.every((id) => watchedNow.has(id))) return [];
    return target;
  });
}
