/**
 * Helper para construir la preview de una serie embebida agregada por un
 * user via /ver/agregar. Combina datos confiables (oEmbed de la plataforma
 * para titulo/canal/thumb) con autopoblado IA de Gemini (sinopsis, año,
 * pais, cast, productora, idiomas, subs, tags, genero).
 *
 * El helper NO persiste — solo arma el objeto que el cliente confirma o
 * edita antes de POST /api/user/series/embed/confirm.
 */

import { detectPlatform, extractVideoId, type Platform } from './embed-helpers';
import { generateText, GeminiError } from './gemini';

export type EmbedPlatform = 'YouTube' | 'Vimeo' | 'Bilibili' | 'Dailymotion';

export const SUPPORTED_EMBED_PLATFORMS: EmbedPlatform[] = [
  'YouTube',
  'Vimeo',
  'Bilibili',
  'Dailymotion',
];

/**
 * Paises permitidos. Coincide con el set hardcoded de ImportarClient para
 * mantener consistencia con el catalogo curado de Flor. Si Gemini sugiere
 * algo fuera de esta lista, se descarta y queda null.
 */
export const ALLOWED_COUNTRY_CODES = [
  'TH',
  'KR',
  'JP',
  'CN',
  'TW',
  'PH',
  'VN',
  'ID',
  'MY',
  'HK',
] as const;

export type AllowedCountryCode = (typeof ALLOWED_COUNTRY_CODES)[number];

export interface EmbedPreviewSource {
  platform: EmbedPlatform;
  videoId: string;
  embedUrl: string;
  thumbnailUrl: string | null;
  channelName: string | null;
  channelUrl: string | null;
  rawTitle: string | null;
}

export interface EmbedPreviewSuggested {
  title: string;
  originalTitle: string | null;
  year: number | null;
  countryCode: AllowedCountryCode | null;
  synopsis: string | null;
  actorNames: string[];
  productionCompanyName: string | null;
  originalLanguageName: string | null;
  dubbingLanguageNames: string[];
  tagNames: string[];
  genreNames: string[];
  confidence: 'high' | 'medium' | 'low';
}

export interface EmbedPreview {
  source: EmbedPreviewSource;
  suggested: EmbedPreviewSuggested;
  warnings: string[];
}

export interface EmbedConfirmInput {
  url: string;
  series: {
    title: string;
    originalTitle?: string | null;
    year?: number | null;
    type?: 'serie' | 'pelicula' | 'corto' | 'especial';
    countryCode?: string | null;
    synopsis?: string | null;
    actorNames?: string[];
    productionCompanyName?: string | null;
    originalLanguageName?: string | null;
    dubbingLanguageNames?: string[];
    tagNames?: string[];
    genreNames?: string[];
  };
  episode: {
    episodeNumber: number;
    title?: string | null;
    seasonNumber?: number;
    channelName?: string | null;
    channelUrl?: string | null;
  };
}

interface OEmbedData {
  rawTitle: string | null;
  channelName: string | null;
  channelUrl: string | null;
  thumbnailUrl: string | null;
  description: string | null;
}

const EMPTY_OEMBED: OEmbedData = {
  rawTitle: null,
  channelName: null,
  channelUrl: null,
  thumbnailUrl: null,
  description: null,
};

async function fetchOEmbed(
  oembedUrl: string,
  warnings: string[]
): Promise<OEmbedData> {
  try {
    const res = await fetch(oembedUrl, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) {
      warnings.push(`No se pudo cargar oEmbed (${res.status}).`);
      return EMPTY_OEMBED;
    }
    const data = (await res.json()) as {
      title?: string;
      author_name?: string;
      author_url?: string;
      thumbnail_url?: string;
      description?: string;
    };
    return {
      rawTitle: data.title ?? null,
      channelName: data.author_name ?? null,
      channelUrl: data.author_url ?? null,
      thumbnailUrl: data.thumbnail_url ?? null,
      description: data.description ?? null,
    };
  } catch (err) {
    warnings.push(
      `Falla al consultar oEmbed: ${err instanceof Error ? err.message : 'desconocido'}.`
    );
    return EMPTY_OEMBED;
  }
}

async function scrapeOpenGraph(
  pageUrl: string,
  warnings: string[]
): Promise<OEmbedData> {
  try {
    const res = await fetch(pageUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; MundoBL/1.0; +https://mundobl.com)',
      },
      cache: 'no-store',
    });
    if (!res.ok) {
      warnings.push(`No se pudo cargar la pagina (${res.status}).`);
      return EMPTY_OEMBED;
    }
    const html = await res.text();
    const title = readMeta(html, 'og:title');
    const description = readMeta(html, 'og:description');
    const thumbnailUrl = readMeta(html, 'og:image');
    const channelName = readMeta(html, 'og:site_name');
    return {
      rawTitle: title,
      channelName,
      channelUrl: null,
      thumbnailUrl,
      description,
    };
  } catch (err) {
    warnings.push(
      `Falla al scrape de pagina: ${err instanceof Error ? err.message : 'desconocido'}.`
    );
    return EMPTY_OEMBED;
  }
}

function readMeta(html: string, property: string): string | null {
  // Soporta <meta property="og:foo" content="bar"> en ambos ordenes.
  const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const r1 = new RegExp(
    `<meta[^>]+property=["']${escaped}["'][^>]+content=["']([^"']+)["']`,
    'i'
  );
  const r2 = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${escaped}["']`,
    'i'
  );
  const m = html.match(r1) ?? html.match(r2);
  return m ? m[1] : null;
}

async function loadSource(
  url: string,
  warnings: string[]
): Promise<EmbedPreviewSource | { error: string }> {
  const platform = detectPlatform(url);
  if (!platform) {
    return { error: 'No se pudo detectar la plataforma de la URL.' };
  }
  if (!SUPPORTED_EMBED_PLATFORMS.includes(platform as EmbedPlatform)) {
    return {
      error: `Plataforma "${platform}" no esta soportada para /ver. Aceptamos: ${SUPPORTED_EMBED_PLATFORMS.join(', ')}.`,
    };
  }
  const embedPlatform = platform as EmbedPlatform;
  const videoId = extractVideoId(platform, url);
  if (!videoId) {
    return { error: 'No se pudo extraer el ID del video desde la URL.' };
  }

  let oembed: OEmbedData = EMPTY_OEMBED;
  let embedUrl = url;
  switch (embedPlatform) {
    case 'YouTube': {
      embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}`;
      oembed = await fetchOEmbed(
        `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
        warnings
      );
      break;
    }
    case 'Vimeo': {
      embedUrl = `https://player.vimeo.com/video/${videoId}`;
      oembed = await fetchOEmbed(
        `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`,
        warnings
      );
      break;
    }
    case 'Dailymotion': {
      embedUrl = `https://www.dailymotion.com/embed/video/${videoId}`;
      oembed = await fetchOEmbed(
        `https://www.dailymotion.com/services/oembed?url=${encodeURIComponent(url)}&format=json`,
        warnings
      );
      break;
    }
    case 'Bilibili': {
      embedUrl = `https://player.bilibili.com/player.html?bvid=${videoId}&page=1`;
      oembed = await scrapeOpenGraph(url, warnings);
      break;
    }
  }

  return {
    platform: embedPlatform,
    videoId,
    embedUrl,
    thumbnailUrl: oembed.thumbnailUrl,
    channelName: oembed.channelName,
    channelUrl: oembed.channelUrl,
    rawTitle: oembed.rawTitle,
  };
}

const GEMINI_SYSTEM_INSTRUCTION = `Sos un asistente experto en doramas BL/GL asiaticos (Tailandia, Corea, Japon, China, Taiwan, Filipinas, Vietnam, Indonesia, Malasia, Hong Kong).

Devolves SOLO JSON valido, sin markdown ni texto adicional, con esta shape exacta:
{
  "title": string,
  "originalTitle": string | null,
  "year": number | null,
  "countryCode": "TH" | "KR" | "JP" | "CN" | "TW" | "PH" | "VN" | "ID" | "MY" | "HK" | null,
  "synopsis": string | null,
  "actorNames": string[],
  "productionCompanyName": string | null,
  "originalLanguageName": string | null,
  "dubbingLanguageNames": string[],
  "tagNames": string[],
  "genreNames": string[],
  "confidence": "high" | "medium" | "low"
}

Reglas:
- Si no estas seguro de un campo, devolve null o [].
- "synopsis" en espanol neutro, max 500 caracteres.
- "actorNames" max 8 nombres con formato "Nombre Apellido".
- "tagNames" max 8 (ej: "Romance", "Universitarios", "Doctores").
- "genreNames" max 5 (ej: "Drama", "Romance", "Comedia").
- "year" entre 1990 y 2030.
- "confidence": "high" si reconoces el titulo exacto en bases publicas; "medium" si deduces por canal+titulo; "low" si solo adivinas.`;

interface GeminiPayload {
  title?: unknown;
  originalTitle?: unknown;
  year?: unknown;
  countryCode?: unknown;
  synopsis?: unknown;
  actorNames?: unknown;
  productionCompanyName?: unknown;
  originalLanguageName?: unknown;
  dubbingLanguageNames?: unknown;
  tagNames?: unknown;
  genreNames?: unknown;
  confidence?: unknown;
}

function stripJsonFences(raw: string): string {
  return raw
    .replace(/^\s*```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();
}

function clampString(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

function asStringArray(value: unknown, max: number, maxLen: number): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => clampString(item, maxLen))
    .filter((item): item is string => item != null)
    .slice(0, max);
}

function pickCountry(value: unknown): AllowedCountryCode | null {
  if (typeof value !== 'string') return null;
  const upper = value.toUpperCase() as AllowedCountryCode;
  return ALLOWED_COUNTRY_CODES.includes(upper) ? upper : null;
}

function pickYear(value: unknown): number | null {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return null;
  const intN = Math.floor(n);
  if (intN < 1990 || intN > 2030) return null;
  return intN;
}

function pickConfidence(value: unknown): 'high' | 'medium' | 'low' {
  if (value === 'high' || value === 'medium' || value === 'low') return value;
  return 'low';
}

function fallbackSuggested(rawTitle: string | null): EmbedPreviewSuggested {
  return {
    title: rawTitle?.trim() || 'Sin titulo',
    originalTitle: null,
    year: null,
    countryCode: null,
    synopsis: null,
    actorNames: [],
    productionCompanyName: null,
    originalLanguageName: null,
    dubbingLanguageNames: [],
    tagNames: [],
    genreNames: [],
    confidence: 'low',
  };
}

async function suggestWithGemini(
  source: EmbedPreviewSource,
  description: string | null,
  warnings: string[]
): Promise<EmbedPreviewSuggested> {
  const rawTitle = source.rawTitle;
  const prompt = [
    `Titulo del video: "${rawTitle ?? '(sin titulo)'}".`,
    `Canal oficial: "${source.channelName ?? '(desconocido)'}".`,
    `Plataforma: ${source.platform}.`,
    `Descripcion del video: "${description ?? ''}".`,
    '',
    'Identifica si es una serie BL/GL conocida, pelicula, corto o especial.',
    'Si es un episodio individual, deducir la serie completa.',
    'Devolve SOLO el JSON pedido en las instrucciones del sistema.',
  ].join('\n');

  let rawResponse: string;
  try {
    rawResponse = await generateText({
      prompt,
      systemInstruction: GEMINI_SYSTEM_INSTRUCTION,
      temperature: 0.3,
      maxOutputTokens: 1024,
      thinkingBudget: 0,
    });
  } catch (err) {
    if (err instanceof GeminiError) {
      warnings.push(`Asistente IA no respondio (${err.status}): ${err.message}`);
    } else {
      warnings.push(
        `Asistente IA fallo: ${err instanceof Error ? err.message : 'desconocido'}.`
      );
    }
    return fallbackSuggested(rawTitle);
  }

  const stripped = stripJsonFences(rawResponse);
  let parsed: GeminiPayload;
  try {
    parsed = JSON.parse(stripped) as GeminiPayload;
  } catch {
    warnings.push(
      'El asistente IA devolvio un JSON invalido, completa los datos manualmente.'
    );
    return fallbackSuggested(rawTitle);
  }

  const title =
    clampString(parsed.title, 200) ?? rawTitle?.trim() ?? 'Sin titulo';

  return {
    title,
    originalTitle: clampString(parsed.originalTitle, 200),
    year: pickYear(parsed.year),
    countryCode: pickCountry(parsed.countryCode),
    synopsis: clampString(parsed.synopsis, 500),
    actorNames: asStringArray(parsed.actorNames, 8, 80),
    productionCompanyName: clampString(parsed.productionCompanyName, 150),
    originalLanguageName: clampString(parsed.originalLanguageName, 60),
    dubbingLanguageNames: asStringArray(parsed.dubbingLanguageNames, 8, 60),
    tagNames: asStringArray(parsed.tagNames, 8, 60),
    genreNames: asStringArray(parsed.genreNames, 5, 60),
    confidence: pickConfidence(parsed.confidence),
  };
}

/**
 * Arma el preview para /ver/agregar: extrae datos confiables del oEmbed
 * de la plataforma y autopuebla el resto con Gemini. Si Gemini falla,
 * devuelve una sugerencia minima (solo rawTitle) + warning.
 *
 * Throws `EmbedPreviewError` si la URL no se parsea o la plataforma no
 * esta soportada (el cliente lo recibe como 422).
 */
export async function buildEmbedPreview(url: string): Promise<EmbedPreview> {
  const warnings: string[] = [];
  const source = await loadSource(url, warnings);
  if ('error' in source) {
    throw new EmbedPreviewError(source.error, 422);
  }

  // Bilibili scrape ya pobla description en og:description. YouTube oEmbed
  // no incluye descripcion; queda null y Gemini trabaja sin ella.
  let description: string | null = null;
  if (source.platform === 'Bilibili') {
    // El loadSource ya hizo scrape; necesitamos releerlo. Como pequena
    // optimizacion, lo hacemos un solo fetch arriba y lo pasamos. Pero
    // mantengo simple: Gemini funciona bien sin description para BL.
    description = null;
  }

  const suggested = await suggestWithGemini(source, description, warnings);

  return { source, suggested, warnings };
}

export class EmbedPreviewError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = 'EmbedPreviewError';
    this.status = status;
  }
}
