import { parseEpisodeTitle } from './episode-parser';

/**
 * Que es un "capitulo" para el usuario. En la base, cada video es una fila
 * de Episode: YouTube sube un capitulo en partes ([1/4]...[4/4]) y las
 * playlists mezclan traileres y extras. El seguimiento, /ver y /watching
 * cuentan capitulos, no filas.
 */

export interface EpisodeRow {
  id: number;
  seasonNumber: number;
  episodeNumber: number;
  title?: string | null;
}

export interface Chapter<T extends EpisodeRow> {
  seasonNumber: number;
  number: number;
  /** Las filas del capitulo en orden: una, o las partes. */
  episodes: T[];
}

// Titulos que nunca son un capitulo, aunque traigan numero ("ตัวอย่าง" es
// "avance" en tailandes: GMMTV sube uno por capitulo).
const EXTRA_MARKERS = [
  'trailer',
  'teaser',
  'ตัวอย่าง',
  'behind',
  'special',
  'highlight',
  'interview',
  'recap',
  'music video',
  'private video',
  'deleted video',
  'video privado',
];
const EXTRA_WORDS = /\b(ost|mv)\b/i;

function isExtraTitle(title: string): boolean {
  const lower = title.toLowerCase();
  return (
    EXTRA_MARKERS.some((marker) => lower.includes(marker)) ||
    EXTRA_WORDS.test(title)
  );
}

/**
 * Agrupa las filas en capitulos, en orden.
 *
 * - Si hay partes numeradas ("EP.3 [2/4]") o la mayoria de los titulos trae
 *   numero de capitulo, manda ese numero: las partes se juntan y lo que no
 *   lo trae es extra.
 * - Si no (fichas cargadas a mano, casi siempre sin titulo), cada fila es un
 *   capitulo, como siempre.
 */
export function groupIntoChapters<T extends EpisodeRow>(
  rows: readonly T[]
): {
  chapters: Chapter<T>[];
  extras: T[];
  /** True si la numeracion salio de los titulos (videos de YouTube). */
  byTitle: boolean;
} {
  const ordered = [...rows].sort(
    (a, b) =>
      a.seasonNumber - b.seasonNumber || a.episodeNumber - b.episodeNumber
  );
  const parsed = ordered.map((row) => {
    const title = row.title ?? '';
    const { episodeNumber, partNumber } = parseEpisodeTitle(title);
    return {
      row,
      extra: title !== '' && isExtraTitle(title),
      number: episodeNumber,
      part: partNumber,
    };
  });

  // Las playlists de YouTube traen muchos extras sin numero (detras de
  // camara en tailandes, clips): con partes numeradas alcanza para saber
  // que la numeracion es real. Sin partes, hacen falta al menos dos
  // capitulos numerados: un "EP.3" suelto en una ficha cargada a mano no
  // puede convertir el resto en extras.
  const candidates = parsed.filter((p) => !p.extra);
  const numbered = candidates.filter((p) => p.number !== null).length;
  const hasNumberedParts = candidates.some(
    (p) => p.number !== null && p.part !== null
  );
  const byTitle =
    hasNumberedParts || (numbered >= 2 && numbered * 2 >= candidates.length);

  if (!byTitle) {
    return {
      chapters: ordered.map((row) => ({
        seasonNumber: row.seasonNumber,
        number: row.episodeNumber,
        episodes: [row],
      })),
      extras: [],
      byTitle: false,
    };
  }

  const chapters = new Map<string, Chapter<T> & { parts: number[] }>();
  const extras: T[] = [];
  for (const p of parsed) {
    if (p.extra || p.number === null) {
      extras.push(p.row);
      continue;
    }
    const key = `${p.row.seasonNumber}:${p.number}`;
    const chapter = chapters.get(key) ?? {
      seasonNumber: p.row.seasonNumber,
      number: p.number,
      episodes: [],
      parts: [],
    };
    chapter.episodes.push(p.row);
    chapter.parts.push(p.part ?? 0);
    chapters.set(key, chapter);
  }

  return {
    chapters: [...chapters.values()]
      .sort((a, b) => a.seasonNumber - b.seasonNumber || a.number - b.number)
      .map(({ seasonNumber, number, episodes, parts }) => ({
        seasonNumber,
        number,
        // Las partes por su numero ([2/4] antes que [3/4]), no por fila.
        episodes: episodes
          .map((episode, i) => ({ episode, part: parts[i] }))
          .sort((a, b) => a.part - b.part)
          .map(({ episode }) => episode),
      })),
    extras,
    byTitle: true,
  };
}

/** Lo que necesitan el stepper y /watching de cada capitulo. */
export interface TrackedChapter {
  seasonNumber: number;
  number: number;
  /** Solo en fichas cargadas a mano: en YouTube el titulo es el de la serie. */
  title: string | null;
  episodeIds: number[];
}

export function toTrackedChapters(
  rows: readonly EpisodeRow[]
): TrackedChapter[] {
  const { chapters, byTitle } = groupIntoChapters(rows);
  return chapters.map((chapter) => ({
    seasonNumber: chapter.seasonNumber,
    number: chapter.number,
    title: byTitle ? null : (chapter.episodes[0].title ?? null),
    episodeIds: chapter.episodes.map((episode) => episode.id),
  }));
}

/** "T1·E4", el mismo codigo en el stepper y en /watching. */
export function chapterCode(chapter: {
  seasonNumber: number;
  number: number;
}): string {
  return `T${chapter.seasonNumber}·E${chapter.number}`;
}
