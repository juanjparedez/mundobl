// ============================================
// Utilidad compartida para embeds de plataformas
// ============================================

export type Platform =
  | 'YouTube'
  | 'Bilibili'
  | 'Vimeo'
  | 'Dailymotion'
  | 'TikTok'
  | 'Instagram'
  | 'Twitter'
  | 'Spotify';

export const PLATFORM_OPTIONS: { label: string; value: Platform }[] = [
  { label: 'YouTube', value: 'YouTube' },
  { label: 'Bilibili', value: 'Bilibili' },
  { label: 'Vimeo', value: 'Vimeo' },
  { label: 'Dailymotion', value: 'Dailymotion' },
  { label: 'TikTok', value: 'TikTok' },
  { label: 'Instagram', value: 'Instagram' },
  { label: 'Twitter / X', value: 'Twitter' },
  { label: 'Spotify', value: 'Spotify' },
];

export const CATEGORY_OPTIONS: { label: string; value: string }[] = [
  { label: 'Tráiler', value: 'trailer' },
  { label: 'OST / Música', value: 'ost' },
  { label: 'Entrevista', value: 'interview' },
  { label: 'Clip', value: 'clip' },
  { label: 'Behind the scenes', value: 'behind_scenes' },
  { label: 'En vivo', value: 'live' },
  { label: 'Otro', value: 'other' },
];

export const CATEGORY_LABELS: Record<string, string> = {
  trailer: 'Tráiler',
  ost: 'OST / Música',
  interview: 'Entrevista',
  clip: 'Clip',
  behind_scenes: 'Behind the scenes',
  live: 'En vivo',
  other: 'Otro',
};

export const PLATFORM_COLORS: Record<string, string> = {
  YouTube: 'red',
  Bilibili: 'blue',
  Vimeo: 'cyan',
  Dailymotion: 'orange',
  TikTok: 'geekblue',
  Instagram: 'purple',
  Twitter: 'default',
  Spotify: 'green',
};

// ---- Extractores de ID por plataforma ----

export function getYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/))([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

export function getBilibiliId(url: string): string | null {
  const match = url.match(/bilibili\.com\/video\/((?:BV|av)[a-zA-Z0-9]+)/i);
  return match ? match[1] : null;
}

export function getVimeoId(url: string): string | null {
  const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return match ? match[1] : null;
}

export function getDailymotionId(url: string): string | null {
  const match = url.match(
    /dailymotion\.com\/(?:video|embed\/video)\/([a-zA-Z0-9]+)/
  );
  return match ? match[1] : null;
}

export function getTikTokId(url: string): string | null {
  const match = url.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/);
  return match ? match[1] : null;
}

export function getSpotifyId(url: string): { type: string; id: string } | null {
  const match = url.match(
    /open\.spotify\.com\/(episode|track|playlist|show|album)\/([a-zA-Z0-9]+)/
  );
  return match ? { type: match[1], id: match[2] } : null;
}

// ---- Detección automática de plataforma desde URL ----

export function detectPlatform(url: string): Platform | null {
  if (/youtu\.be|youtube\.com/.test(url)) return 'YouTube';
  if (/bilibili\.com/.test(url)) return 'Bilibili';
  if (/vimeo\.com/.test(url)) return 'Vimeo';
  if (/dailymotion\.com/.test(url)) return 'Dailymotion';
  if (/tiktok\.com/.test(url)) return 'TikTok';
  if (/instagram\.com/.test(url)) return 'Instagram';
  if (/twitter\.com|x\.com/.test(url)) return 'Twitter';
  if (/spotify\.com/.test(url)) return 'Spotify';
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
    case 'TikTok':
      return getTikTokId(url);
    case 'Spotify': {
      const s = getSpotifyId(url);
      return s ? `${s.type}/${s.id}` : null;
    }
    default:
      return null;
  }
}

// ---- Información de embed ----

export type EmbedType = 'iframe' | 'social-embed' | 'unsupported';

export interface EmbedInfo {
  type: EmbedType;
  url: string | null;
  originalUrl: string;
  platform: Platform;
}

export function getEmbedInfo(
  platform: Platform,
  url: string,
  videoId: string | null
): EmbedInfo {
  switch (platform) {
    case 'YouTube':
      return {
        type: 'iframe',
        url: videoId
          ? `https://www.youtube-nocookie.com/embed/${videoId}?rel=0`
          : null,
        originalUrl: url,
        platform,
      };
    case 'Bilibili':
      return {
        type: 'iframe',
        url: videoId
          ? `https://player.bilibili.com/player.html?bvid=${videoId}&autoplay=0`
          : null,
        originalUrl: url,
        platform,
      };
    case 'Vimeo':
      return {
        type: 'iframe',
        url: videoId ? `https://player.vimeo.com/video/${videoId}` : null,
        originalUrl: url,
        platform,
      };
    case 'Dailymotion':
      return {
        type: 'iframe',
        url: videoId
          ? `https://www.dailymotion.com/embed/video/${videoId}`
          : null,
        originalUrl: url,
        platform,
      };
    case 'Spotify':
      return {
        type: 'iframe',
        url: videoId ? `https://open.spotify.com/embed/${videoId}` : null,
        originalUrl: url,
        platform,
      };
    case 'TikTok':
    case 'Instagram':
    case 'Twitter':
      return {
        type: 'social-embed',
        url: null,
        originalUrl: url,
        platform,
      };
    default:
      return { type: 'unsupported', url: null, originalUrl: url, platform };
  }
}
