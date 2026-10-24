/** Public episode URLs. Never infer a provider from a substring in a URL. */
export const EPISODE_PLATFORMS = ['YouTube', 'Vimeo', 'Dailymotion'] as const;
export type EpisodePlatform = (typeof EPISODE_PLATFORMS)[number];
const SOURCE_ERROR_KEYS = [
  'episodeSource.unsupported',
  'episodeSource.unverified',
  'episodeSource.unavailable',
  'episodeSource.notPlayable',
  'episodeSource.tooShort',
  'episodeSource.playerSetup',
] as const;

export function getEpisodeSourceErrorKey(
  value: unknown
): (typeof SOURCE_ERROR_KEYS)[number] | null {
  return SOURCE_ERROR_KEYS.find((key) => key === value) ?? null;
}

export interface EpisodeSource {
  platform: EpisodePlatform;
  videoId: string;
  url: string;
  privacyHash?: string;
}

export function parsePublicVideoUrl(value: string): URL | null {
  try {
    const url = new URL(value.trim());
    if (
      !['https:', 'http:'].includes(url.protocol) ||
      url.username ||
      url.password ||
      (url.port && !['80', '443'].includes(url.port))
    )
      return null;
    return url;
  } catch {
    return null;
  }
}

export function parseEpisodeSource(value: string): EpisodeSource | null {
  const url = parsePublicVideoUrl(value);
  if (!url) return null;
  const host = url.hostname.toLowerCase();
  let id: string | null = null;
  if (host === 'youtu.be') id = url.pathname.slice(1);
  if (
    [
      'youtube.com',
      'www.youtube.com',
      'm.youtube.com',
      'youtube-nocookie.com',
      'www.youtube-nocookie.com',
    ].includes(host)
  ) {
    id =
      url.pathname === '/watch'
        ? url.searchParams.get('v')
        : (url.pathname.match(/^\/(?:embed|v|shorts)\/([^/]+)\/?$/)?.[1] ??
          null);
  }
  if (id && /^[\w-]{11}$/.test(id)) {
    return {
      platform: 'YouTube',
      videoId: id,
      url: `https://www.youtube.com/watch?v=${id}`,
    };
  }
  if (['vimeo.com', 'www.vimeo.com', 'player.vimeo.com'].includes(host)) {
    const match = url.pathname.match(
      /^\/(?:video\/|channels\/[^/]+\/|groups\/[^/]+\/videos\/)?(\d+)(?:\/([a-f\d]+))?\/?$/i
    );
    if (!match) return null;
    const privacyHash = match[2] ?? url.searchParams.get('h') ?? undefined;
    if (privacyHash && !/^[a-f\d]+$/i.test(privacyHash)) return null;
    return {
      platform: 'Vimeo',
      videoId: match[1],
      url: `https://vimeo.com/${match[1]}${privacyHash ? `/${privacyHash}` : ''}`,
      ...(privacyHash && { privacyHash }),
    };
  }
  if (
    [
      'dailymotion.com',
      'www.dailymotion.com',
      'geo.dailymotion.com',
      'dai.ly',
    ].includes(host)
  ) {
    id =
      host === 'dai.ly'
        ? url.pathname.slice(1)
        : host === 'geo.dailymotion.com' &&
            /^\/player\/[a-z\d]+\.html$/i.test(url.pathname)
          ? url.searchParams.get('video')
          : (url.pathname.match(
              /^\/(?:embed\/)?video\/([a-z\d]+)(?:_[^/]*)?\/?$/i
            )?.[1] ?? null);
    if (id && /^[a-z\d]+$/i.test(id)) {
      return {
        platform: 'Dailymotion',
        videoId: id,
        url: `https://www.dailymotion.com/video/${id}`,
      };
    }
  }
  return null;
}

/** Public setting, supplied by the site's own Dailymotion Studio account. */
export function dailymotionPlayerId(): string | null {
  const id = process.env.NEXT_PUBLIC_DAILYMOTION_PLAYER_ID;
  return id && /^[a-z\d]{6,32}$/i.test(id) ? id : null;
}
