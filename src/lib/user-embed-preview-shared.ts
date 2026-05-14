/**
 * Tipos y constantes compartidos del flow user-embed.
 *
 * Este archivo SE PUEDE IMPORTAR desde client components. NO debe agregar
 * imports de prisma, pg, o cualquier modulo Node-only — webpack los va
 * a meter en el bundle del cliente y falla con "Module not found: tls".
 *
 * El runtime del preview (buildEmbedPreview, suggestWithGemini, cache,
 * etc.) vive en user-embed-preview.ts que SI importa prisma, y solo se
 * usa desde rutas API (server).
 */

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
    /** ID de la Series CURATED del catalogo a la que el user vincula este
     *  aporte. Ambas entidades coexisten; el link permite badges
     *  bidireccionales en /ver y /catalogo. Null = sin vincular. */
    linkedSeriesId?: number | null;
  };
  episode: {
    episodeNumber: number;
    title?: string | null;
    seasonNumber?: number;
    channelName?: string | null;
    channelUrl?: string | null;
  };
}
