// ============================================
// Parser de titulos de YouTube → numero de episodio/temporada
// ============================================
//
// Cubre los formatos mas comunes en canales asiaticos (GMMTV, Be On Cloud,
// Idol Factory, Star Hunter, etc.) y latinos. Devuelve `null` cuando no
// puede inferir un numero — ese caso se delega a la UI de preview para
// que el admin lo edite manualmente.

export interface ParsedEpisodeTitle {
  // Numero de temporada inferido (default 1 si la serie no tiene marcador SX).
  seasonNumber: number;
  // Numero de episodio. null si no se pudo detectar.
  episodeNumber: number | null;
  // Indice de "parte" cuando el episodio viene partido en varios videos
  // (ej. GMMTV usa [1/4], [2/4]...). null si no aplica.
  partNumber: number | null;
  partTotal: number | null;
  // Titulo limpio, sin los marcadores EP/parte/[FULL]/[ENG SUB]/etc.
  cleanTitle: string;
  // Heuristica que matcheo, util para debugging y para que la UI muestre
  // por que se asigno tal numero.
  matchedRule: string | null;
}

const TAGS_TO_STRIP = [
  /\[FULL\s*EP(?:ISODE)?\]/gi,
  /\[ENG\s*SUB(?:S)?\]/gi,
  /\[(?:THAI|TH|ENG|SPA|ESP)\s*SUB(?:S)?\]/gi,
  /\[OFFICIAL\]/gi,
  /\[HD\]/gi,
  /\[4K\]/gi,
  /\[UNCUT\]/gi,
  /\[FULL\]/gi,
  /\[CC\]/gi,
];

const SEPARATOR_CLEANUP = /\s*[|·•・–—-]\s*$/;

interface PatternRule {
  name: string;
  // Regex con grupos nombrados: ?<season>, ?<episode>, ?<part>, ?<partTotal>
  regex: RegExp;
  // Si true, se intenta tambien sacar el match del `cleanTitle` para no
  // dejar el "EP.X" en el titulo final.
  strip: boolean;
}

// Las reglas se prueban en orden. Las mas especificas van primero.
const PATTERNS: PatternRule[] = [
  // S1E12 / S1 E12 / S01E01
  {
    name: 's-e',
    regex: /\bS(?<season>\d{1,2})\s*E(?<episode>\d{1,3})\b/i,
    strip: true,
  },
  // 1x12 / 01x01
  {
    name: 'NxNN',
    regex: /\b(?<season>\d{1,2})x(?<episode>\d{1,3})\b/i,
    strip: true,
  },
  // Season 1 Episode 12 / Temporada 1 Episodio 12
  {
    name: 'season-episode-words',
    regex:
      /\b(?:season|temporada)\s*(?<season>\d{1,2})\b.*?\b(?:episode|episodio|ep)\.?\s*(?<episode>\d{1,3})\b/i,
    strip: true,
  },
  // EP.12 / EP12 / EP 12 / Ep. 12 — el caso mas comun en GMMTV
  {
    name: 'ep-dot',
    regex: /\bEP\.?\s*(?<episode>\d{1,3})\b/i,
    strip: true,
  },
  // Episode 12 / Episodio 12
  {
    name: 'episode-word',
    regex: /\b(?:episode|episodio)\s*(?<episode>\d{1,3})\b/i,
    strip: true,
  },
  // Capitulo 12
  {
    name: 'capitulo',
    regex: /\b(?:cap(?:itulo|\.)?)\s*(?<episode>\d{1,3})\b/i,
    strip: true,
  },
  // E12 / E1 (suelto, despues de un separador). Mas frágil — dejar al final.
  {
    name: 'e-loose',
    regex: /(?:^|[\s|·•・])E(?<episode>\d{1,3})\b/i,
    strip: true,
  },
];

// Patron de "parte": [1/4], (1/4), Part 2, Pt.2
const PART_PATTERNS: { name: string; regex: RegExp; strip: boolean }[] = [
  {
    name: 'bracket-fraction',
    regex: /[[(](?<part>\d{1,2})\s*\/\s*(?<partTotal>\d{1,2})[\])]/,
    strip: true,
  },
  {
    name: 'part-word',
    regex:
      /\b(?:part|parte|pt)\.?\s*(?<part>\d{1,2})(?:\s*\/\s*(?<partTotal>\d{1,2}))?\b/i,
    strip: true,
  },
];

function stripTags(input: string): string {
  let out = input;
  for (const tag of TAGS_TO_STRIP) {
    out = out.replace(tag, '');
  }
  return out;
}

function tidy(input: string): string {
  return input
    .replace(/\s+/g, ' ')
    .replace(/\s*[|·•・–—-]\s*[|·•・–—-]+\s*/g, ' | ')
    .replace(SEPARATOR_CLEANUP, '')
    .replace(/^[|·•・–—-]\s*/, '')
    .trim();
}

export function parseEpisodeTitle(rawTitle: string): ParsedEpisodeTitle {
  let working = stripTags(rawTitle);

  let seasonNumber = 1;
  let episodeNumber: number | null = null;
  let partNumber: number | null = null;
  let partTotal: number | null = null;
  let matchedRule: string | null = null;

  for (const rule of PATTERNS) {
    const match = rule.regex.exec(working);
    if (!match || !match.groups) continue;

    if (match.groups.season) {
      seasonNumber = parseInt(match.groups.season, 10);
    }
    if (match.groups.episode) {
      episodeNumber = parseInt(match.groups.episode, 10);
    }
    matchedRule = rule.name;

    if (rule.strip) {
      working = working.replace(rule.regex, ' ');
    }
    break;
  }

  for (const rule of PART_PATTERNS) {
    const match = rule.regex.exec(working);
    if (!match || !match.groups) continue;
    if (match.groups.part) {
      partNumber = parseInt(match.groups.part, 10);
    }
    if (match.groups.partTotal) {
      partTotal = parseInt(match.groups.partTotal, 10);
    }
    if (rule.strip) {
      working = working.replace(rule.regex, ' ');
    }
    break;
  }

  return {
    seasonNumber,
    episodeNumber,
    partNumber,
    partTotal,
    cleanTitle: tidy(working),
    matchedRule,
  };
}

// ============================================
// Inferir el nombre de la serie a partir de un set de titulos
// ============================================
//
// Idea: el nombre de la serie suele ser la subcadena comun mas larga (LCS)
// que aparece en la mayoria de los videos, despues de quitar los marcadores
// de episodio/parte. Funciona bien para playlists donde todos los videos
// tienen el mismo prefijo "[NOMBRE SERIE] | EP.X".

export function inferSeriesTitle(cleanTitles: string[]): string | null {
  if (cleanTitles.length === 0) return null;
  if (cleanTitles.length === 1) return cleanTitles[0];

  // Tomamos el primer titulo como referencia y buscamos el prefijo mas
  // largo que comparten al menos el 60% de los demas.
  const reference = cleanTitles[0];
  const threshold = Math.ceil(cleanTitles.length * 0.6);

  for (let len = reference.length; len >= 4; len--) {
    const prefix = reference.slice(0, len).trim();
    if (prefix.length < 4) continue;
    const matches = cleanTitles.filter((t) =>
      t.toLowerCase().startsWith(prefix.toLowerCase())
    ).length;
    if (matches >= threshold) {
      return tidy(prefix);
    }
  }

  return null;
}
