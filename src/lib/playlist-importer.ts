// ============================================
// Orquestador: YouTube playlist URL → ImportPreview
// ============================================
//
// Combina fetchYouTubePlaylist + parseEpisodeTitle para producir un
// preview editable que la UI de admin muestra antes de persistir
// (ver POST /api/series/import-playlist y /confirm).

import { fetchAllYouTubePlaylistVideos } from './channel-fetcher';
import {
  parseEpisodeTitle,
  inferSeriesTitle,
  type ParsedEpisodeTitle,
} from './episode-parser';
import { generateText, GeminiError } from './gemini';

// Mapping de canales conocidos → codigo ISO de pais. Mantener corto;
// si falta un canal el usuario lo elige a mano en el preview.
const CHANNEL_COUNTRY_MAP: Record<string, string> = {
  GMMTV: 'TH',
  'GMMTV OFFICIAL': 'TH',
  'Be On Cloud': 'TH',
  'Be On Cloud Official': 'TH',
  'Idol Factory': 'TH',
  'idol factory official': 'TH',
  'Star Hunter Entertainment': 'TH',
  'Dee Hup House': 'TH',
  'Just Up Channel': 'TH',
  'JustUp Channel': 'TH',
  'IDEA FIRST COMPANY': 'PH',
  'Idea First Company': 'PH',
};

function suggestCountryCode(channelName: string): string | null {
  const normalized = channelName.trim();
  if (CHANNEL_COUNTRY_MAP[normalized]) return CHANNEL_COUNTRY_MAP[normalized];
  // Match case-insensitive
  const lower = normalized.toLowerCase();
  for (const [key, value] of Object.entries(CHANNEL_COUNTRY_MAP)) {
    if (key.toLowerCase() === lower) return value;
  }
  return null;
}

export interface ImportPreviewEpisode {
  // Numero de episodio inferido (puede ser null si el parser no lo detecto).
  episodeNumber: number | null;
  // Titulo limpio sin marcadores de episodio/parte/tags.
  title: string;
  // Titulo crudo del video, util para mostrar al admin si el cleanTitle
  // perdio algo importante.
  rawTitle: string;
  videoId: string;
  embedUrl: string;
  embedPlatform: 'YouTube';
  embedChannelName: string;
  embedChannelUrl: string;
  thumbnailUrl: string;
  // Solo informativo — no se persiste en Episode (no hay schema para esto).
  partNumber: number | null;
  partTotal: number | null;
  publishedAt: string;
  // Warnings por episodio: "no se detecto numero", "duplicado del EP3", etc.
  warnings: string[];
}

export interface ImportPreviewSeason {
  seasonNumber: number;
  episodes: ImportPreviewEpisode[];
}

export interface ImportPreview {
  source: {
    playlistId: string;
    playlistUrl: string;
    playlistTitle: string;
    playlistDescription: string;
    playlistThumbnailUrl: string;
    channelName: string;
    channelUrl: string;
    itemCount: number;
  };
  series: {
    title: string;
    synopsis: string | null;
    synopsisTranslated: boolean;
    suggestedYear: number | null;
    suggestedCountryCode: string | null;
    catalogScope: 'WATCHABLE_ONLY' | 'PERSONAL';
  };
  seasons: ImportPreviewSeason[];
  // Warnings globales (ej. "ningun video tenia numero de episodio").
  warnings: string[];
  // Si hay duplicados de (season, episode), bloquear confirmacion en la UI.
  hasBlockingDuplicates: boolean;
}

export interface ImportPreviewOptions {
  url: string;
  // Si true, traduce playlist description a español via Gemini. Default false.
  autoTranslate?: boolean;
  // Default 'WATCHABLE_ONLY'.
  catalogScope?: 'WATCHABLE_ONLY' | 'PERSONAL';
  // Limite de paginas a paginar (50 videos cada una). Default 10 = 500 videos.
  maxPages?: number;
}

export async function buildImportPreview(
  options: ImportPreviewOptions
): Promise<ImportPreview> {
  const {
    url,
    autoTranslate = false,
    catalogScope = 'WATCHABLE_ONLY',
    maxPages = 10,
  } = options;

  const fetched = await fetchAllYouTubePlaylistVideos(url, maxPages);
  const warnings: string[] = [];

  if (fetched.videos.length === 0) {
    warnings.push('La playlist no devolvió videos.');
  }

  const parsed: {
    video: (typeof fetched.videos)[number];
    parsed: ParsedEpisodeTitle;
  }[] = fetched.videos.map((v) => ({
    video: v,
    parsed: parseEpisodeTitle(v.title),
  }));

  // Inferir titulo de serie: prioriza playlistTitle si existe; fallback al
  // prefijo comun de los cleanTitles.
  const cleanTitles = parsed.map((p) => p.parsed.cleanTitle).filter(Boolean);
  const inferredFromVideos = inferSeriesTitle(cleanTitles);
  const seriesTitle =
    fetched.playlistTitle.trim() || inferredFromVideos || 'Sin titulo';

  // Año sugerido: el menor publishedAt year.
  const years = fetched.videos
    .map((v) => {
      const y = parseInt(v.publishedAt.slice(0, 4), 10);
      return Number.isFinite(y) ? y : null;
    })
    .filter((y): y is number => y !== null);
  const suggestedYear = years.length ? Math.min(...years) : null;

  // Pais sugerido por channel mapping.
  const suggestedCountryCode = suggestCountryCode(fetched.channelName);
  if (!suggestedCountryCode && fetched.channelName) {
    warnings.push(
      `Canal "${fetched.channelName}" no esta en el mapping de paises — elegir manualmente.`
    );
  }

  // Sinopsis: playlist description (truncada a 500 chars), opcionalmente traducida.
  let synopsis: string | null = fetched.playlistDescription?.trim() || null;
  let synopsisTranslated = false;
  if (synopsis && synopsis.length > 500) {
    synopsis = synopsis.slice(0, 500).trimEnd() + '...';
  }
  if (synopsis && autoTranslate) {
    try {
      const translated = await generateText({
        prompt: `Traduce al español neutro (Argentina) el siguiente texto, manteniendo nombres propios y titulos originales en su idioma. Devuelve SOLO la traducción, sin comentarios:\n\n${synopsis}`,
        temperature: 0.2,
        thinkingBudget: 0,
        maxOutputTokens: 1024,
      });
      synopsis = translated.trim();
      synopsisTranslated = true;
    } catch (error) {
      const msg =
        error instanceof GeminiError
          ? error.message
          : 'Error desconocido al traducir';
      warnings.push(
        `Traduccion fallo: ${msg}. Sinopsis quedo en idioma original.`
      );
    }
  }

  // Agrupar por seasonNumber.
  const seasonMap = new Map<number, ImportPreviewEpisode[]>();
  for (const { video, parsed: p } of parsed) {
    const season = p.seasonNumber;
    if (!seasonMap.has(season)) seasonMap.set(season, []);

    const epWarnings: string[] = [];
    if (p.episodeNumber === null) {
      epWarnings.push(
        'No se detecto numero de episodio en el titulo — asignar manualmente.'
      );
    }
    if (p.partNumber !== null) {
      epWarnings.push(
        `Video parte ${p.partNumber}${p.partTotal ? `/${p.partTotal}` : ''} de un episodio — la DB no permite duplicados, hay que renumerar o consolidar antes de confirmar.`
      );
    }

    seasonMap.get(season)!.push({
      episodeNumber: p.episodeNumber,
      title: p.cleanTitle,
      rawTitle: video.title,
      videoId: video.videoId,
      embedUrl: video.videoUrl,
      embedPlatform: 'YouTube',
      embedChannelName: video.channelName,
      embedChannelUrl: video.channelUrl,
      thumbnailUrl: video.thumbnailUrl,
      partNumber: p.partNumber,
      partTotal: p.partTotal,
      publishedAt: video.publishedAt,
      warnings: epWarnings,
    });
  }

  // Detectar duplicados (mismo episodeNumber dentro de la misma temporada).
  let hasBlockingDuplicates = false;
  const seasons: ImportPreviewSeason[] = Array.from(seasonMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([seasonNumber, episodes]) => {
      // Sort: numbered episodes ascending, then nulls at end (preservando publishedAt order).
      const sorted = [...episodes].sort((a, b) => {
        if (a.episodeNumber === null && b.episodeNumber === null) {
          return a.publishedAt.localeCompare(b.publishedAt);
        }
        if (a.episodeNumber === null) return 1;
        if (b.episodeNumber === null) return -1;
        return a.episodeNumber - b.episodeNumber;
      });

      // Marcar duplicados.
      const counts = new Map<number, number>();
      for (const ep of sorted) {
        if (ep.episodeNumber !== null) {
          counts.set(ep.episodeNumber, (counts.get(ep.episodeNumber) || 0) + 1);
        }
      }
      for (const ep of sorted) {
        if (
          ep.episodeNumber !== null &&
          (counts.get(ep.episodeNumber) || 0) > 1
        ) {
          ep.warnings.push(
            `Duplicado: hay ${counts.get(ep.episodeNumber)} videos con episodio ${ep.episodeNumber} en esta temporada.`
          );
          hasBlockingDuplicates = true;
        }
      }
      return { seasonNumber, episodes: sorted };
    });

  const totalEpisodes = seasons.reduce((acc, s) => acc + s.episodes.length, 0);
  const numberedEpisodes = seasons.reduce(
    (acc, s) => acc + s.episodes.filter((e) => e.episodeNumber !== null).length,
    0
  );
  if (totalEpisodes > 0 && numberedEpisodes === 0) {
    warnings.push(
      'Ningun video tenia numero de episodio detectable — asignar todos manualmente.'
    );
  }

  return {
    source: {
      playlistId: fetched.playlistId,
      playlistUrl: url,
      playlistTitle: fetched.playlistTitle,
      playlistDescription: fetched.playlistDescription,
      playlistThumbnailUrl: fetched.playlistThumbnailUrl,
      channelName: fetched.channelName,
      channelUrl: fetched.channelUrl,
      itemCount: fetched.itemCount,
    },
    series: {
      title: seriesTitle,
      synopsis,
      synopsisTranslated,
      suggestedYear,
      suggestedCountryCode,
      catalogScope,
    },
    seasons,
    warnings,
    hasBlockingDuplicates,
  };
}
