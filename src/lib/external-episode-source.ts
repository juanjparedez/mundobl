import { CORE_MARKETS } from './channel-fetcher';
import { dailymotionPlayerId, type EpisodeSource } from './episode-platforms';
import {
  findOfficialVideoPublisher,
  OFFICIAL_VIDEO_PUBLISHERS,
  type OfficialVideoPublisher,
} from './official-video-publishers';
import { MIN_EPISODE_SECONDS, type PlaybackProbe } from './playability';

export type EpisodeSourceErrorCode =
  | 'unsupported'
  | 'unverified'
  | 'unavailable'
  | 'notPlayable'
  | 'tooShort'
  | 'playerSetup';

export class EpisodeSourceError extends Error {
  constructor(
    readonly code: EpisodeSourceErrorCode,
    readonly status: 422 | 503 = 422
  ) {
    super(code);
    this.name = 'EpisodeSourceError';
  }
}

export interface ExternalEpisodeInfo {
  source: EpisodeSource;
  title: string;
  ownerId: string;
  channelName: string;
  channelUrl: string;
  thumbnailUrl: string | null;
  probe: PlaybackProbe;
}

interface SourceDependencies {
  fetcher?: typeof fetch;
  vimeoToken?: string;
  playerId?: string | null;
  publishers?: readonly OfficialVideoPublisher[];
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}
function text(value: unknown): string | null {
  return typeof value === 'string' && value.length ? value : null;
}
function duration(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? Math.floor(value)
    : null;
}
function imageUrl(value: unknown): string | null {
  const raw = text(value);
  if (!raw) return null;
  try {
    return new URL(raw).protocol === 'https:' ? raw : null;
  } catch {
    return null;
  }
}

/** Only fixed provider endpoints; no arbitrary page scraping or redirects. */
async function readJson(
  url: URL,
  fetcher: typeof fetch,
  token?: string
): Promise<Record<string, unknown>> {
  try {
    const response = await fetcher(url, {
      headers: {
        Accept: 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      redirect: 'error',
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    });
    if (response.status === 404 || response.status === 410)
      throw new EpisodeSourceError('notPlayable');
    // Authentication, throttling and transport failures are not evidence of removal.
    if (!response.ok) throw new EpisodeSourceError('unavailable', 503);
    return record(await response.json());
  } catch (error) {
    if (error instanceof EpisodeSourceError) throw error;
    throw new EpisodeSourceError('unavailable', 503);
  }
}

export async function verifyExternalEpisode(
  source: EpisodeSource,
  dependencies: SourceDependencies = {}
): Promise<ExternalEpisodeInfo> {
  const fetcher = dependencies.fetcher ?? fetch;
  const publishers = dependencies.publishers ?? OFFICIAL_VIDEO_PUBLISHERS;
  let ownerId: string | null = null;
  let title: string | null = null;
  let seconds: number | null = null;
  let thumbnailUrl: string | null = null;
  let blockedMarkets: string[] = [];
  if (source.platform === 'Vimeo') {
    const token = dependencies.vimeoToken ?? process.env.VIMEO_ACCESS_TOKEN;
    if (!token) throw new EpisodeSourceError('unavailable', 503);
    const url = new URL(`https://api.vimeo.com/videos/${source.videoId}`);
    url.searchParams.set(
      'fields',
      'uri,name,duration,user.uri,status,privacy.view,privacy.embed,pictures.base_link,content_rating'
    );
    const data = await readJson(url, fetcher, token);
    const privacy = record(data.privacy);
    if (
      data.uri !== `/videos/${source.videoId}` ||
      data.status !== 'available' ||
      privacy.view !== 'anybody' ||
      privacy.embed !== 'public'
    ) {
      throw new EpisodeSourceError('notPlayable');
    }
    ownerId =
      text(record(data.user).uri)?.match(/^\/users\/(\d+)$/)?.[1] ?? null;
    title = text(data.name);
    seconds = duration(data.duration);
    thumbnailUrl = imageUrl(record(data.pictures).base_link);
    // Require the public, unauthenticated embed response too. Access granted
    // to the site's API token does not prove access granted to visitors.
    const oembed = new URL('https://vimeo.com/api/oembed.json');
    oembed.searchParams.set('url', source.url);
    const publicData = await readJson(oembed, fetcher);
    if (
      String(publicData.video_id) !== source.videoId ||
      publicData.type !== 'video'
    ) {
      throw new EpisodeSourceError('notPlayable');
    }
  } else if (source.platform === 'Dailymotion') {
    const playerId = dependencies.playerId ?? dailymotionPlayerId();
    if (!playerId || !/^[a-z\d]{6,32}$/i.test(playerId))
      throw new EpisodeSourceError('playerSetup', 503);
    const url = new URL(`https://api.dailymotion.com/video/${source.videoId}`);
    url.searchParams.set(
      'fields',
      'id,title,owner.id,duration,private,status,explicit,allow_embed,geoblocking,thumbnail_url'
    );
    const data = await readJson(url, fetcher);
    if (
      data.id !== source.videoId ||
      data.private !== false ||
      data.status !== 'published' ||
      data.explicit !== false ||
      data.allow_embed !== true
    ) {
      throw new EpisodeSourceError('notPlayable');
    }
    ownerId = text(data['owner.id']);
    title = text(data.title);
    seconds = duration(data.duration);
    thumbnailUrl = imageUrl(data.thumbnail_url);
    if (Array.isArray(data.geoblocking) && data.geoblocking.length) {
      const [mode, ...countries] = data.geoblocking;
      if (mode !== 'allow' && mode !== 'deny')
        throw new EpisodeSourceError('unavailable', 503);
      blockedMarkets =
        mode === 'allow' && countries.length === 0
          ? []
          : CORE_MARKETS.filter((market) =>
              mode === 'allow'
                ? !countries.includes(market)
                : countries.includes(market)
            );
    }
    const oembed = new URL('https://www.dailymotion.com/services/oembed');
    oembed.searchParams.set('url', source.url);
    oembed.searchParams.set('player', playerId);
    oembed.searchParams.set('format', 'json');
    const publicData = await readJson(oembed, fetcher);
    const html = text(publicData.html);
    if (
      publicData.type !== 'video' ||
      !html?.includes(`geo.dailymotion.com/player/${playerId}.html`)
    ) {
      throw new EpisodeSourceError('notPlayable');
    }
  } else {
    throw new EpisodeSourceError('unsupported');
  }
  if (!ownerId || !title || seconds === null)
    throw new EpisodeSourceError('unavailable', 503);
  const publisher = findOfficialVideoPublisher(
    source.platform,
    ownerId,
    source.videoId,
    publishers
  );
  if (!publisher) throw new EpisodeSourceError('unverified');
  if (seconds < MIN_EPISODE_SECONDS) throw new EpisodeSourceError('tooShort');
  if (blockedMarkets.length) throw new EpisodeSourceError('notPlayable');
  return {
    source,
    title,
    ownerId,
    channelName: publisher.name,
    channelUrl: publisher.profileUrl,
    thumbnailUrl,
    probe: {
      videoId: source.videoId,
      status: 'OK',
      blockedMarkets,
      durationSeconds: seconds,
      detail: null,
    },
  };
}

/** A transient outage preserves the last successful availability result. */
export async function probeExternalEpisode(
  source: EpisodeSource
): Promise<PlaybackProbe> {
  try {
    return (await verifyExternalEpisode(source)).probe;
  } catch (error) {
    return {
      videoId: source.videoId,
      status:
        error instanceof EpisodeSourceError && error.status === 422
          ? 'NOT_EMBEDDABLE'
          : 'UNKNOWN',
      blockedMarkets: [],
      durationSeconds: null,
      detail: error instanceof EpisodeSourceError ? error.code : 'unavailable',
    };
  }
}
