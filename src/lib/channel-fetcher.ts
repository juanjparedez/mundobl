// ============================================
// Fetching de videos desde canales YouTube / Vimeo
// ============================================

export interface ChannelVideo {
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  videoId: string;
  channelName: string;
  channelUrl: string;
  publishedAt: string;
  platform: 'YouTube' | 'Vimeo';
}

export interface ChannelFetchResult {
  videos: ChannelVideo[];
  channelName: string;
  channelUrl: string;
  nextPageToken: string | null;
  totalResults: number;
}

// ---- YouTube ----

const YT_API_BASE = 'https://www.googleapis.com/youtube/v3';

interface YouTubeChannelRef {
  type: 'id' | 'handle' | 'username';
  value: string;
}

function parseYouTubeChannelUrl(url: string): YouTubeChannelRef | null {
  // /channel/UCxxxxxxx
  const channelMatch = url.match(/youtube\.com\/channel\/(UC[\w-]+)/);
  if (channelMatch) return { type: 'id', value: channelMatch[1] };

  // /@handle
  const handleMatch = url.match(/youtube\.com\/@([\w.-]+)/);
  if (handleMatch) return { type: 'handle', value: handleMatch[1] };

  // /c/customname (treat as handle)
  const customMatch = url.match(/youtube\.com\/c\/([\w.-]+)/);
  if (customMatch) return { type: 'handle', value: customMatch[1] };

  // /user/username
  const userMatch = url.match(/youtube\.com\/user\/([\w.-]+)/);
  if (userMatch) return { type: 'username', value: userMatch[1] };

  return null;
}

async function ytFetch(
  endpoint: string,
  params: Record<string, string>
): Promise<Response> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey)
    throw new Error(
      'API key de YouTube no configurada. Agregala como YOUTUBE_API_KEY en las variables de entorno.'
    );

  const searchParams = new URLSearchParams({ ...params, key: apiKey });
  const res = await fetch(
    `${YT_API_BASE}/${endpoint}?${searchParams.toString()}`
  );
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    const errObj = err as { error?: { message?: string } } | null;
    throw new Error(
      `YouTube API error: ${errObj?.error?.message || res.statusText}`
    );
  }
  return res;
}

interface YouTubeChannelResponse {
  items?: Array<{
    id: string;
    snippet?: { title: string; customUrl?: string };
    contentDetails?: { relatedPlaylists?: { uploads?: string } };
  }>;
}

interface YouTubePlaylistResponse {
  items?: Array<{
    snippet: {
      title: string;
      description: string;
      thumbnails: {
        high?: { url: string };
        medium?: { url: string };
        default?: { url: string };
      };
      resourceId: { videoId: string };
      channelTitle: string;
      channelId: string;
      publishedAt: string;
    };
  }>;
  nextPageToken?: string;
  pageInfo?: { totalResults: number };
}

async function resolveYouTubeChannelId(
  ref: YouTubeChannelRef
): Promise<string> {
  if (ref.type === 'id') return ref.value;

  const params: Record<string, string> = { part: 'id' };

  if (ref.type === 'handle') {
    params.forHandle = ref.value;
  } else {
    params.forUsername = ref.value;
  }

  const res = await ytFetch('channels', params);
  const data: YouTubeChannelResponse = await res.json();

  if (!data.items?.length) {
    throw new Error(`No se encontró el canal de YouTube: ${ref.value}`);
  }

  return data.items[0].id;
}

export async function fetchYouTubeChannel(
  url: string,
  pageToken?: string
): Promise<ChannelFetchResult> {
  const ref = parseYouTubeChannelUrl(url);
  if (!ref) throw new Error('URL de canal de YouTube no válida');

  const channelId = await resolveYouTubeChannelId(ref);

  // Get channel info
  const channelRes = await ytFetch('channels', {
    part: 'snippet,contentDetails',
    id: channelId,
  });
  const channelData: YouTubeChannelResponse = await channelRes.json();
  const channel = channelData.items?.[0];
  if (!channel) throw new Error('Canal no encontrado');

  const uploadsPlaylistId = channel.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsPlaylistId)
    throw new Error('No se pudo obtener la playlist de uploads');

  const channelName = channel.snippet?.title || ref.value;
  const channelUrl = `https://www.youtube.com/channel/${channelId}`;

  // Fetch videos from uploads playlist
  const playlistParams: Record<string, string> = {
    part: 'snippet',
    playlistId: uploadsPlaylistId,
    maxResults: '50',
  };
  if (pageToken) playlistParams.pageToken = pageToken;

  const playlistRes = await ytFetch('playlistItems', playlistParams);
  const playlistData: YouTubePlaylistResponse = await playlistRes.json();

  const videos: ChannelVideo[] = (playlistData.items || []).map((item) => {
    const thumb =
      item.snippet.thumbnails.high?.url ||
      item.snippet.thumbnails.medium?.url ||
      item.snippet.thumbnails.default?.url ||
      '';
    return {
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnailUrl: thumb,
      videoUrl: `https://www.youtube.com/watch?v=${item.snippet.resourceId.videoId}`,
      videoId: item.snippet.resourceId.videoId,
      channelName: item.snippet.channelTitle || channelName,
      channelUrl,
      publishedAt: item.snippet.publishedAt,
      platform: 'YouTube' as const,
    };
  });

  return {
    videos,
    channelName,
    channelUrl,
    nextPageToken: playlistData.nextPageToken || null,
    totalResults: playlistData.pageInfo?.totalResults || videos.length,
  };
}

// ---- YouTube Playlists (para importar series completas) ----

interface YouTubePlaylistInfoResponse {
  items?: Array<{
    id: string;
    snippet?: {
      title: string;
      description: string;
      channelId: string;
      channelTitle: string;
      thumbnails: {
        high?: { url: string };
        medium?: { url: string };
        default?: { url: string };
      };
    };
    contentDetails?: { itemCount: number };
  }>;
}

export interface PlaylistFetchResult extends ChannelFetchResult {
  playlistId: string;
  playlistTitle: string;
  playlistDescription: string;
  playlistThumbnailUrl: string;
  itemCount: number;
}

function parseYouTubePlaylistId(url: string): string | null {
  const match = url.match(/[?&]list=([\w-]+)/);
  if (match) return match[1];
  const slashMatch = url.match(/youtube\.com\/playlist\/([\w-]+)/);
  if (slashMatch) return slashMatch[1];
  return null;
}

export async function fetchYouTubePlaylist(
  url: string,
  pageToken?: string
): Promise<PlaylistFetchResult> {
  const playlistId = parseYouTubePlaylistId(url);
  if (!playlistId)
    throw new Error(
      'URL de playlist de YouTube invalida (esperaba ?list=PLxxx)'
    );

  const infoRes = await ytFetch('playlists', {
    part: 'snippet,contentDetails',
    id: playlistId,
  });
  const infoData: YouTubePlaylistInfoResponse = await infoRes.json();
  const info = infoData.items?.[0];
  if (!info) throw new Error(`Playlist no encontrada: ${playlistId}`);

  const channelId = info.snippet?.channelId || '';
  const channelName = info.snippet?.channelTitle || '';
  const channelUrl = channelId
    ? `https://www.youtube.com/channel/${channelId}`
    : '';

  const playlistParams: Record<string, string> = {
    part: 'snippet',
    playlistId,
    maxResults: '50',
  };
  if (pageToken) playlistParams.pageToken = pageToken;

  const playlistRes = await ytFetch('playlistItems', playlistParams);
  const playlistData: YouTubePlaylistResponse = await playlistRes.json();

  const videos: ChannelVideo[] = (playlistData.items || []).map((item) => {
    const thumb =
      item.snippet.thumbnails.high?.url ||
      item.snippet.thumbnails.medium?.url ||
      item.snippet.thumbnails.default?.url ||
      '';
    return {
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnailUrl: thumb,
      videoUrl: `https://www.youtube.com/watch?v=${item.snippet.resourceId.videoId}`,
      videoId: item.snippet.resourceId.videoId,
      channelName: item.snippet.channelTitle || channelName,
      channelUrl,
      publishedAt: item.snippet.publishedAt,
      platform: 'YouTube' as const,
    };
  });

  const playlistThumb =
    info.snippet?.thumbnails.high?.url ||
    info.snippet?.thumbnails.medium?.url ||
    info.snippet?.thumbnails.default?.url ||
    '';

  return {
    videos,
    channelName,
    channelUrl,
    nextPageToken: playlistData.nextPageToken || null,
    totalResults: playlistData.pageInfo?.totalResults || videos.length,
    playlistId,
    playlistTitle: info.snippet?.title || '',
    playlistDescription: info.snippet?.description || '',
    playlistThumbnailUrl: playlistThumb,
    itemCount: info.contentDetails?.itemCount || videos.length,
  };
}

export async function fetchAllYouTubePlaylistVideos(
  url: string,
  maxPages: number = 10
): Promise<PlaylistFetchResult> {
  const first = await fetchYouTubePlaylist(url);
  let allVideos = [...first.videos];
  let nextPageToken = first.nextPageToken;
  let pages = 1;

  while (nextPageToken && pages < maxPages) {
    const next = await fetchYouTubePlaylist(url, nextPageToken);
    allVideos = allVideos.concat(next.videos);
    nextPageToken = next.nextPageToken;
    pages++;
  }

  return { ...first, videos: allVideos, nextPageToken };
}

// Mercado core del sitio (locale primario ES + audiencia real LatAm/España).
// Si el primer video de una playlist esta bloqueado en varios de estos,
// la serie completa no le sirve a la audiencia real, sin importar cuantos
// episodios tenga (aprendido en carne propia: se importaron 6 series BL
// oficiales y una — Never Let Me Go — resulto bloqueada en TODO occidente).
export const CORE_MARKETS = ['AR', 'MX', 'ES', 'CL', 'CO', 'PE', 'US'];

export interface RegionRestrictionCheck {
  checked: boolean; // false si el video no se encontro / la API fallo
  blockedCoreMarkets: string[]; // subset de CORE_MARKETS bloqueado
}

/**
 * Chequea si un video de YouTube esta geo-bloqueado en el mercado core
 * del sitio, via contentDetails.regionRestriction (blocked o allowed —
 * la API usa una lista u otra, nunca ambas). Se usa el PRIMER video de
 * la playlist como muestra representativa: el bloqueo suele ser por
 * licencia de toda la serie, no por episodio suelto.
 */
export async function checkYouTubeRegionRestriction(
  videoId: string
): Promise<RegionRestrictionCheck> {
  try {
    const res = await ytFetch('videos', {
      part: 'contentDetails',
      id: videoId,
    });
    const data = (await res.json()) as {
      items?: Array<{
        contentDetails?: {
          regionRestriction?: { blocked?: string[]; allowed?: string[] };
        };
      }>;
    };
    const item = data.items?.[0];
    if (!item) return { checked: false, blockedCoreMarkets: [] };

    const rr = item.contentDetails?.regionRestriction;
    if (!rr) return { checked: true, blockedCoreMarkets: [] };

    const blockedCoreMarkets = rr.blocked
      ? CORE_MARKETS.filter((m) => rr.blocked!.includes(m))
      : rr.allowed
        ? CORE_MARKETS.filter((m) => !rr.allowed!.includes(m))
        : [];

    return { checked: true, blockedCoreMarkets };
  } catch {
    // No bloqueamos el import por un error de esta llamada extra — el
    // admin puede seguir sin el chequeo (queda "checked: false").
    return { checked: false, blockedCoreMarkets: [] };
  }
}

/**
 * Chequea, para una tanda de video IDs, cuales ya vienen marcados por
 * YouTube como restringidos para mayores de edad
 * (contentDetails.contentRating.ytRating === "ytAgeRestricted") o
 * explicitamente no aptos para chicos (status.madeForKids === false no
 * es señal suficiente por si sola — la mayoria del catalogo BL/GL cae ahi
 * sin ser "para adultos" — asi que solo usamos ytRating como señal dura).
 *
 * Uso: import masivo del rol COLLABORATOR (ver /admin/colaborador) —
 * defensa extra ademas de que el rol lo asigna un ADMIN a mano. NO
 * reemplaza esa vetting: solo capta lo que la propia YouTube ya evaluo.
 * Batchea de a 50 ids (limite de la API) via `videos.list`.
 */
export async function checkYouTubeAgeRestriction(
  videoIds: string[]
): Promise<Map<string, boolean>> {
  const result = new Map<string, boolean>();
  const uniqueIds = Array.from(new Set(videoIds)).filter(Boolean);
  if (uniqueIds.length === 0) return result;

  const chunks: string[][] = [];
  for (let i = 0; i < uniqueIds.length; i += 50) {
    chunks.push(uniqueIds.slice(i, i + 50));
  }

  for (const chunk of chunks) {
    try {
      const res = await ytFetch('videos', {
        part: 'contentDetails',
        id: chunk.join(','),
      });
      const data = (await res.json()) as {
        items?: Array<{
          id: string;
          contentDetails?: { contentRating?: { ytRating?: string } };
        }>;
      };
      for (const item of data.items ?? []) {
        result.set(
          item.id,
          item.contentDetails?.contentRating?.ytRating === 'ytAgeRestricted'
        );
      }
    } catch {
      // Si esta tanda falla no bloqueamos el import — los ids de este
      // chunk simplemente quedan sin entrada en el Map (tratados como
      // "no chequeado" por el caller).
    }
  }

  return result;
}

// ---- Vimeo ----

const VIMEO_API_BASE = 'https://api.vimeo.com';

interface VimeoVideoResponse {
  data: Array<{
    name: string;
    description: string | null;
    uri: string;
    link: string;
    pictures: { sizes: Array<{ width: number; link: string }> };
    user: { name: string; link: string };
    created_time: string;
  }>;
  total: number;
  page: number;
  per_page: number;
  paging: { next: string | null };
}

function parseVimeoUserUrl(url: string): string | null {
  // /channels/name
  const channelMatch = url.match(/vimeo\.com\/channels\/([\w.-]+)/);
  if (channelMatch) return channelMatch[1];

  // /username (exclude known paths)
  const userMatch = url.match(/vimeo\.com\/([\w.-]+)/);
  if (
    userMatch &&
    !['video', 'categories', 'watch', 'manage'].includes(userMatch[1])
  ) {
    return userMatch[1];
  }

  return null;
}

export async function fetchVimeoChannel(
  url: string,
  pageToken?: string
): Promise<ChannelFetchResult> {
  const token = process.env.VIMEO_ACCESS_TOKEN;
  if (!token)
    throw new Error(
      'Token de Vimeo no configurado. Agregalo como VIMEO_ACCESS_TOKEN en las variables de entorno.'
    );

  const userId = parseVimeoUserUrl(url);
  if (!userId) throw new Error('URL de usuario de Vimeo no válida');

  const page = pageToken ? parseInt(pageToken, 10) : 1;

  const res = await fetch(
    `${VIMEO_API_BASE}/users/${userId}/videos?per_page=25&page=${page}&sort=date`,
    {
      headers: {
        Authorization: `bearer ${token}`,
        Accept: 'application/vnd.vimeo.*+json;version=3.4',
      },
    }
  );

  if (!res.ok) {
    if (res.status === 404)
      throw new Error(`Usuario de Vimeo no encontrado: ${userId}`);
    throw new Error(`Vimeo API error: ${res.statusText}`);
  }

  const data: VimeoVideoResponse = await res.json();

  const videos: ChannelVideo[] = data.data.map((item) => {
    const vimeoId = item.uri.split('/').pop() || '';
    const thumb =
      item.pictures.sizes.find((s) => s.width >= 640)?.link ||
      item.pictures.sizes[item.pictures.sizes.length - 1]?.link ||
      '';

    return {
      title: item.name,
      description: item.description || '',
      thumbnailUrl: thumb,
      videoUrl: item.link,
      videoId: vimeoId,
      channelName: item.user.name,
      channelUrl: item.user.link,
      publishedAt: item.created_time,
      platform: 'Vimeo' as const,
    };
  });

  const hasMore = data.paging.next !== null;
  const nextPage = hasMore ? String(page + 1) : null;

  return {
    videos,
    channelName: data.data[0]?.user.name || userId,
    channelUrl: data.data[0]?.user.link || `https://vimeo.com/${userId}`,
    nextPageToken: nextPage,
    totalResults: data.total,
  };
}
