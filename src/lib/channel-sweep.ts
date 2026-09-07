// ============================================
// Barrido de canal: canal oficial → series candidatas
// ============================================
//
// El importer de playlists (playlist-importer.ts) resuelve "tengo la URL
// de UNA serie, traemela". Este modulo resuelve el paso de antes, que es
// el que realmente escala el catalogo: "aca tenes un canal oficial,
// deci vos cuales de sus 200 playlists son series que valen la pena".
//
// El filtro importa tanto como el fetch. Un canal como Dee Hup House
// mezcla, en la misma lista de playlists:
//   - la serie completa            → esto queremos
//   - "Highlights | <serie>"       → clips sueltos, no
//   - "Reaction | <serie>"         → contenido de relleno, no
//   - "EP.12 | <serie>"            → una playlist POR episodio, no
//   - "OST", "Behind the scenes"   → no
//
// Importar sin filtrar llena /ver de basura y es peor que no importar.

import {
  fetchYouTubeChannelPlaylists,
  type ChannelPlaylist,
} from './channel-fetcher';
import { parseEpisodeTitle } from './episode-parser';

/** Playlists cuyo titulo arranca con esto NO son la serie en si. */
const NOISE_PREFIXES = [
  'highlight',
  'highlights',
  'reaction',
  'next episode',
  'shorts',
  'behind the scenes',
  'bts',
  'ost',
  'teaser',
  'trailer',
  'making of',
  'ep.',
  'ep ',
  'episode ',
  'clip',
  'interview',
  'special',
  'live',
  'fan meeting',
  'concert',
  'cover',
  'karaoke',
];

/**
 * Palabras que, en cualquier parte del titulo, delatan relleno.
 * `live house` y `live show` salieron de datos reales: "GMMTV LIVE HOUSE"
 * son 289 videos de musica en vivo y pasaba como candidata.
 */
const NOISE_KEYWORDS = [
  'highlight',
  'reaction',
  'behind the scene',
  'making of',
  'unseen',
  'uncut scene',
  'best moment',
  'recap',
  'live house',
  'live show',
  'music video',
  'playlist',
];

export type SweepVerdict =
  /** Parece una serie completa e importable. */
  | 'CANDIDATE'
  /** Ya existe en la base (por playlist o por videos ya importados). */
  | 'ALREADY_IMPORTED'
  /** Clips, reacciones, OST, playlist de un solo episodio, etc. */
  | 'NOISE'
  /** Muy pocos videos para ser una serie. */
  | 'TOO_SHORT';

export interface SweepCandidate {
  playlistId: string;
  title: string;
  playlistUrl: string;
  thumbnailUrl: string;
  itemCount: number;
  verdict: SweepVerdict;
  /** Por que se decidio eso, para que el admin pueda no creerle. */
  reason: string;
  /**
   * Cuantos de los titulos de muestra parsearon como episodio. Alto =
   * muy probablemente una serie numerada. Null si no se muestreo.
   */
  episodeTitleRatio: number | null;
}

export interface ChannelSweepResult {
  channelId: string;
  channelName: string;
  totalPlaylists: number;
  candidates: SweepCandidate[];
  warnings: string[];
}

/**
 * Minimo de videos para considerar que una playlist es una serie.
 * Deliberadamente bajo: hay BL cortos legitimos de 4-5 episodios, y el
 * admin igual revisa antes de confirmar.
 */
const MIN_EPISODES = 4;

/**
 * Normaliza un titulo para comparar playlist contra serie ya cargada.
 *
 * Los titulos de playlist vienen sucios ("Bad Buddy Series | GMMTV",
 * "แค่เพื่อนครับเพื่อน BAD BUDDY SERIES"), asi que se saca todo lo que no
 * sea alfanumerico y se pasa a minusculas. Es una comparacion floja a
 * proposito: sirve para AVISAR "esto ya lo tenes", no para bloquear.
 */
export function normalizeTitle(title: string): string {
  return (
    title
      .toLowerCase()
      .normalize('NFD')
      // Diacriticos latinos combinantes (NFD los separa de su letra).
      .replace(/[̀-ͯ]/g, '')
      .replace(/\b(the\s+)?series\b/g, '')
      .replace(/[^\p{L}\p{N}]+/gu, '')
  );
}

/**
 * Largo minimo para arriesgar un match por contencion. Con menos, cosas
 * como "love" o "2gether" harian match con medio catalogo.
 */
const MIN_TITLE_MATCH_LENGTH = 8;

/**
 * Busca el titulo de la playlist entre los de las series ya cargadas.
 *
 * No alcanza con comparar por igualdad: los titulos de playlist arrastran
 * el canal ("Bad Buddy Series | GMMTV") o el titulo original pegado
 * adelante ("แค่เพื่อนครับเพื่อน BAD BUDDY SERIES"), asi que uno suele
 * CONTENER al otro en vez de ser identicos.
 */
function findImportedMatch(
  normalized: string,
  importedTitles: Set<string>
): boolean {
  if (normalized.length < MIN_TITLE_MATCH_LENGTH) return false;
  if (importedTitles.has(normalized)) return true;
  for (const known of importedTitles) {
    if (known.length < MIN_TITLE_MATCH_LENGTH) continue;
    if (normalized.includes(known) || known.includes(normalized)) return true;
  }
  return false;
}

function classify(
  playlist: ChannelPlaylist,
  importedTitles: Set<string>,
  siblingTitles: string[],
  ownIndex: number
): { verdict: SweepVerdict; reason: string } {
  if (findImportedMatch(normalizeTitle(playlist.title), importedTitles)) {
    return {
      verdict: 'ALREADY_IMPORTED',
      reason: 'Ya hay una serie con este titulo en la base.',
    };
  }

  const title = playlist.title.toLowerCase().trim();

  for (const prefix of NOISE_PREFIXES) {
    if (title.startsWith(prefix)) {
      return {
        verdict: 'NOISE',
        reason: `El titulo arranca con "${prefix}" — es contenido satelite, no la serie.`,
      };
    }
  }
  for (const kw of NOISE_KEYWORDS) {
    if (title.includes(kw)) {
      return {
        verdict: 'NOISE',
        reason: `El titulo contiene "${kw}".`,
      };
    }
  }

  const satelliteOf = isSatelliteOfSibling(playlist, siblingTitles, ownIndex);
  if (satelliteOf) {
    return {
      verdict: 'NOISE',
      reason: `Parece contenido satelite de otra playlist del canal ("${satelliteOf}").`,
    };
  }

  if (playlist.itemCount < MIN_EPISODES) {
    return {
      verdict: 'TOO_SHORT',
      reason: `Solo ${playlist.itemCount} video(s); el minimo es ${MIN_EPISODES}.`,
    };
  }

  return {
    verdict: 'CANDIDATE',
    reason: `${playlist.itemCount} videos, sin señales de contenido satelite.`,
  };
}

/**
 * Detecta el patron `<algo> | <serie>`, donde `<serie>` es OTRA playlist
 * del mismo canal.
 *
 * Perseguir prefijos de a uno no escala: aparecen "Stay With | X",
 * "Next Episode | X", "Reaction | X" y cada canal inventa los suyos. La
 * señal robusta es estructural — si al sacarle el prefijo queda
 * exactamente el titulo de otra playlist del canal, esto es contenido
 * satelite de aquella, no una serie propia.
 *
 * Devuelve el titulo de la playlist "madre", o null.
 */
function isSatelliteOfSibling(
  playlist: ChannelPlaylist,
  siblingTitles: string[],
  ownIndex: number
): string | null {
  const sepIndex = playlist.title.search(/[|｜]/);
  if (sepIndex === -1) return null;

  const tail = normalizeTitle(playlist.title.slice(sepIndex + 1));
  if (tail.length < MIN_TITLE_MATCH_LENGTH) return null;

  for (let i = 0; i < siblingTitles.length; i++) {
    // Compararse consigo misma siempre da match.
    if (i === ownIndex) continue;
    const sibling = siblingTitles[i];
    if (sibling.length < MIN_TITLE_MATCH_LENGTH) continue;
    if (sibling === tail) return playlist.title.slice(sepIndex + 1).trim();
  }
  return null;
}

/**
 * Barre un canal y devuelve sus playlists clasificadas.
 *
 * No baja los videos de cada playlist ni chequea reproducibilidad: eso
 * cuesta cuota y solo tiene sentido sobre las que el admin elige. El
 * flujo es barrer → elegir → importar con el importer de siempre.
 *
 * `importedTitles` son titulos de series ya cargadas, YA normalizados
 * con `normalizeTitle`. Los pone el caller (la ruta API los saca de la
 * base) para marcar lo que ya esta en el catalogo.
 */
export async function sweepChannel(
  channelUrl: string,
  importedTitles: Set<string> = new Set()
): Promise<ChannelSweepResult> {
  const { channelId, channelName, playlists } =
    await fetchYouTubeChannelPlaylists(channelUrl);

  const warnings: string[] = [];
  if (playlists.length === 0) {
    warnings.push(
      'El canal no expone playlists publicas. Algunos canales suben todo al feed sin agrupar: en ese caso hay que importar por playlist manual o por canal.'
    );
  }

  // Titulos "pelados" de las playlists del propio canal, para detectar
  // satelites por comparacion cruzada (ver isSatelliteOfSibling).
  const siblingTitles = playlists.map((p) => normalizeTitle(p.title));

  const candidates: SweepCandidate[] = playlists.map((p, idx) => {
    const { verdict, reason } = classify(p, importedTitles, siblingTitles, idx);
    return {
      playlistId: p.playlistId,
      title: p.title,
      playlistUrl: p.playlistUrl,
      thumbnailUrl: p.thumbnailUrl,
      itemCount: p.itemCount,
      verdict,
      reason,
      episodeTitleRatio: null,
    };
  });

  // Candidatas primero y, dentro de cada grupo, las mas largas arriba:
  // una serie de 12 episodios es mejor apuesta que una de 4.
  const order: Record<SweepVerdict, number> = {
    CANDIDATE: 0,
    ALREADY_IMPORTED: 1,
    TOO_SHORT: 2,
    NOISE: 3,
  };
  candidates.sort(
    (a, b) => order[a.verdict] - order[b.verdict] || b.itemCount - a.itemCount
  );

  return {
    channelId,
    channelName,
    totalPlaylists: playlists.length,
    candidates,
    warnings,
  };
}

/**
 * Afina el veredicto de una playlist mirando los titulos de sus videos.
 *
 * `classify` solo mira el titulo de la playlist, que alcanza para el
 * grueso. Esto es el segundo pase, opcional y mas caro, para cuando el
 * titulo no dice nada: si la mayoria de los videos parsean como
 * "EP.3", "1x04", "Capitulo 5", es una serie numerada.
 */
export function refineWithVideoTitles(
  candidate: SweepCandidate,
  videoTitles: string[]
): SweepCandidate {
  if (videoTitles.length === 0) return candidate;

  const parsed = videoTitles.filter(
    (t) => parseEpisodeTitle(t).episodeNumber !== null
  );
  const ratio = parsed.length / videoTitles.length;

  // Mayoria simple: con mas de la mitad de los titulos numerados ya es
  // una serie, aunque el titulo de la playlist no lo dijera.
  if (ratio >= 0.5 && candidate.verdict === 'TOO_SHORT') {
    return {
      ...candidate,
      verdict: 'CANDIDATE',
      reason: `${Math.round(ratio * 100)}% de los videos estan numerados como episodios.`,
      episodeTitleRatio: ratio,
    };
  }

  return { ...candidate, episodeTitleRatio: ratio };
}
