// ============================================
// Utilidad compartida para embeds de plataformas
// ============================================
import {
  dailymotionPlayerId,
  parseEpisodeSource,
  parsePublicVideoUrl,
} from './episode-platforms';

export type Platform =
  | 'YouTube'
  | 'Bilibili'
  | 'Vimeo'
  | 'Dailymotion'
  | 'Spotify';

export const PLATFORM_OPTIONS: { label: string; value: Platform }[] = [
  { label: 'YouTube', value: 'YouTube' },
  { label: 'Bilibili', value: 'Bilibili' },
  { label: 'Vimeo', value: 'Vimeo' },
  { label: 'Dailymotion', value: 'Dailymotion' },
  { label: 'Spotify', value: 'Spotify' },
];

export const CATEGORY_OPTIONS: { label: string; value: string }[] = [
  { label: 'Tráiler', value: 'trailer' },
  { label: 'OST / Música', value: 'ost' },
  { label: 'Entrevista', value: 'interview' },
  { label: 'Clip', value: 'clip' },
  { label: 'Behind the scenes', value: 'behind_scenes' },
  { label: 'En vivo', value: 'live' },
  { label: 'Serie completa', value: 'serie' },
  { label: 'Película', value: 'pelicula' },
  { label: 'Corto', value: 'corto' },
  { label: 'Otro', value: 'other' },
];

export const CATEGORY_LABELS: Record<string, string> = {
  trailer: 'Tráiler',
  ost: 'OST / Música',
  interview: 'Entrevista',
  clip: 'Clip',
  behind_scenes: 'Behind the scenes',
  live: 'En vivo',
  serie: 'Serie completa',
  pelicula: 'Película',
  corto: 'Corto',
  other: 'Otro',
};

export const PLATFORM_COLORS: Record<string, string> = {
  YouTube: 'red',
  Bilibili: 'blue',
  Vimeo: 'cyan',
  Dailymotion: 'orange',
  Spotify: 'green',
};

// ---- Extractores de ID por plataforma ----

export function getYouTubeId(url: string): string | null {
  const source = parseEpisodeSource(url);
  return source?.platform === 'YouTube' ? source.videoId : null;
}

export function getBilibiliId(url: string): string | null {
  const match = url.match(/bilibili\.com\/video\/((?:BV|av)[a-zA-Z0-9]+)/i);
  return match ? match[1] : null;
}

export function getVimeoId(url: string): string | null {
  const source = parseEpisodeSource(url);
  return source?.platform === 'Vimeo' ? source.videoId : null;
}

export function getDailymotionId(url: string): string | null {
  const source = parseEpisodeSource(url);
  return source?.platform === 'Dailymotion' ? source.videoId : null;
}

export function getSpotifyId(url: string): { type: string; id: string } | null {
  const match = url.match(
    /open\.spotify\.com\/(episode|track|playlist|show|album)\/([a-zA-Z0-9]+)/
  );
  return match ? { type: match[1], id: match[2] } : null;
}

// ---- Detección automática de plataforma desde URL ----

export function detectPlatform(url: string): Platform | null {
  const parsed = parsePublicVideoUrl(url);
  if (!parsed) return null;
  const host = parsed.hostname.replace(/^www\./, '');
  const hosts: Record<string, Platform> = {
    'youtube.com': 'YouTube',
    'm.youtube.com': 'YouTube',
    'youtu.be': 'YouTube',
    'youtube-nocookie.com': 'YouTube',
    'bilibili.com': 'Bilibili',
    'vimeo.com': 'Vimeo',
    'player.vimeo.com': 'Vimeo',
    'dailymotion.com': 'Dailymotion',
    'geo.dailymotion.com': 'Dailymotion',
    'dai.ly': 'Dailymotion',
    'open.spotify.com': 'Spotify',
  };
  if (hosts[host]) return hosts[host];
  return null;
}

// ---- Dispatcher de extracción de ID ----

export function extractVideoId(platform: Platform, url: string): string | null {
  switch (platform) {
    case 'YouTube':
      return getYouTubeId(url);
    case 'Bilibili':
      return getBilibiliId(url);
    case 'Vimeo':
      return getVimeoId(url);
    case 'Dailymotion':
      return getDailymotionId(url);
    case 'Spotify': {
      const s = getSpotifyId(url);
      return s ? `${s.type}/${s.id}` : null;
    }
    default:
      return null;
  }
}

export interface StreamingValidationResult {
  valid: boolean;
  platform: Platform | null;
  videoId: string | null;
  error?: string;
}

/**
 * Validates supported episode URLs. Official authorship is checked on the server.
 */
export function validateStreamingUrl(url: string): StreamingValidationResult {
  const trimmed = (url || '').trim();
  if (!trimmed) {
    return {
      valid: false,
      platform: null,
      videoId: null,
      error: 'Ingresá una URL de video.',
    };
  }
  if (!/^https?:\/\//i.test(trimmed)) {
    return {
      valid: false,
      platform: null,
      videoId: null,
      error: 'La URL debe comenzar con http:// o https://',
    };
  }
  if (/\.(mp4|m3u8|mkv|avi|mov|ts)(\?.*)?$/i.test(trimmed)) {
    return {
      valid: false,
      platform: null,
      videoId: null,
      error: 'No se permiten enlaces directos a archivos de video.',
    };
  }
  const platform = detectPlatform(trimmed);
  if (!platform) {
    return {
      valid: false,
      platform: null,
      videoId: null,
      error:
        'Plataforma no soportada. Solo aceptamos fuentes oficiales de YouTube, Vimeo y Dailymotion.',
    };
  }
  const allowedPlatforms: Platform[] = ['YouTube', 'Vimeo', 'Dailymotion'];
  if (!allowedPlatforms.includes(platform)) {
    return {
      valid: false,
      platform,
      videoId: null,
      error: `La plataforma "${platform}" no está permitida para streaming completo de episodios en /ver.`,
    };
  }
  const videoId = extractVideoId(platform, trimmed);
  if (!videoId) {
    return {
      valid: false,
      platform,
      videoId: null,
      error: `No se pudo extraer el identificador del video en ${platform}. Por favor revisá el enlace.`,
    };
  }
  return { valid: true, platform, videoId };
}

// ---- Información de embed ----

export type EmbedType = 'iframe' | 'unsupported';

export interface EmbedInfo {
  type: EmbedType;
  url: string | null;
  originalUrl: string;
  platform: Platform;
}

interface EmbedOptions {
  jsApi?: boolean;
  origin?: string;
  autoplay?: boolean;
}

export function getEmbedInfo(
  platform: Platform,
  url: string,
  videoId: string | null,
  options: EmbedOptions = {}
): EmbedInfo {
  const resolvedId = videoId || (url ? extractVideoId(platform, url) : null);

  switch (platform) {
    case 'YouTube':
      const youtubeParams = new URLSearchParams({
        rel: '0',
        cc_load_policy: '1',
        hl: 'es',
        cc_lang_pref: 'es',
      });
      if (options.jsApi) youtubeParams.set('enablejsapi', '1');
      if (options.origin) youtubeParams.set('origin', options.origin);
      if (options.autoplay) youtubeParams.set('autoplay', '1');
      return {
        type: 'iframe',
        url: resolvedId
          ? `https://www.youtube-nocookie.com/embed/${resolvedId}?${youtubeParams.toString()}`
          : null,
        originalUrl: url,
        platform,
      };
    case 'Bilibili':
      return {
        type: 'iframe',
        url: resolvedId
          ? `https://player.bilibili.com/player.html?bvid=${resolvedId}&autoplay=0`
          : null,
        originalUrl: url,
        platform,
      };
    case 'Vimeo':
      const vimeoSource = parseEpisodeSource(url);
      const vimeoParams = new URLSearchParams({ dnt: '1' });
      // Habilita el protocolo postMessage para useVimeoWatchTime.
      if (options.jsApi) vimeoParams.set('api', '1');
      if (vimeoSource?.privacyHash)
        vimeoParams.set('h', vimeoSource.privacyHash);
      if (options.autoplay) vimeoParams.set('autoplay', '1');
      return {
        type: 'iframe',
        url:
          resolvedId && /^\d+$/.test(resolvedId)
            ? `https://player.vimeo.com/video/${resolvedId}?${vimeoParams}`
            : null,
        originalUrl: url,
        platform,
      };
    case 'Dailymotion':
      const playerId = dailymotionPlayerId();
      return {
        type: 'iframe',
        url:
          resolvedId && /^[a-z\d]+$/i.test(resolvedId) && playerId
            ? `https://geo.dailymotion.com/player/${playerId}.html?video=${resolvedId}${options.autoplay ? '&autoplay=1' : ''}`
            : null,
        originalUrl: url,
        platform,
      };
    case 'Spotify':
      return {
        type: 'iframe',
        url: resolvedId ? `https://open.spotify.com/embed/${resolvedId}` : null,
        originalUrl: url,
        platform,
      };
    default:
      return { type: 'unsupported', url: null, originalUrl: url, platform };
  }
}

// ---- Auto-generación de thumbnail ----
// mqdefault y no hqdefault: hqdefault es 4:3 con franjas negras arriba y
// abajo, que en una carátula vertical quedan a la vista.

export function getAutoThumbnailUrl(
  platform: Platform,
  url: string
): string | null {
  switch (platform) {
    case 'YouTube': {
      const videoId = getYouTubeId(url);
      return videoId
        ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
        : null;
    }
    default:
      return null;
  }
}
