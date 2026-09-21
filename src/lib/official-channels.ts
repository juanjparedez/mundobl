/**
 * Lista blanca de contenido oficial.
 *
 * Regla del proyecto (docs/politica-contenido-oficial.md): MundoBL solo
 * embebe episodios de canales oficiales de productoras/distribuidoras y
 * solo enlaza "donde ver" a plataformas con licencia. Nada de re-subidas,
 * fansubs ni sitios de terceros, aunque esten en YouTube.
 *
 * Este modulo es puro (sin fetch, sin Prisma) para poder usarse en server,
 * cliente y scripts. La verificacion fuerte (resolver el canal real de un
 * video via YouTube Data API) vive en channel-fetcher.ts.
 *
 * TODOS los handles fueron verificados uno por uno contra el titulo real
 * del canal (2026-09-06 y 2026-09-21). No agregar de memoria: los handles
 * "obvios" son casi siempre homonimos (@BeOnCloud es un canal personal,
 * @domundi es "Ios 23:59", @Strongberry un musico centroafricano).
 *
 * Para sumar un canal: abrir el canal, confirmar que el titulo es la
 * productora, correr `npx tsx scripts/resolve-official-channel-ids.ts` y
 * pegar handle + channelId.
 */

export interface OfficialChannel {
  name: string;
  /** Handle sin la arroba. */
  handle: string;
  /** ID estable del canal (UC...). Es lo que se compara en los imports. */
  channelId: string | null;
  /** Bandera del pais de la productora, para ubicarla de un vistazo. */
  country: string;
}

// channelId resueltos con scripts/resolve-official-channel-ids.ts el
// 2026-09-21; el titulo real de cada canal coincidio con la productora.
export const OFFICIAL_CHANNELS: OfficialChannel[] = [
  {
    name: 'GMMTV',
    handle: 'gmmtv',
    channelId: 'UC8BzJM6_VbZTdiNLD4R1jxQ',
    country: '🇹🇭',
  },
  {
    name: 'Be On Cloud',
    handle: 'beoncloudofficial',
    channelId: 'UCYeFp-y95VTQOVZ6eId163g',
    country: '🇹🇭',
  },
  {
    name: 'Idol Factory',
    handle: 'idolfactory',
    channelId: 'UC2Xc1Vt6JfBLN3gcd054xNA',
    country: '🇹🇭',
  },
  {
    name: 'Star Hunter',
    handle: 'StarHunterEntertainment',
    channelId: 'UCDi8KLG12RgYufRoGXPs_rQ',
    country: '🇹🇭',
  },
  {
    name: 'Dee Hup House',
    handle: 'DeeHupHouse',
    channelId: 'UCmxbeR0kmwe2M7x3JpdWU_w',
    country: '🇹🇭',
  },
  {
    name: 'DomundiTV',
    handle: 'domunditv',
    channelId: 'UCtcAQTSa2Ogq-eNzHQNBchQ',
    country: '🇹🇭',
  },
  {
    name: 'Studio Wabi Sabi',
    handle: 'StudioWabiSabi',
    channelId: 'UCPXE51seODgcGxLQF_X5jzQ',
    country: '🇹🇭',
  },
  {
    name: 'Mandee',
    handle: 'MandeeWork',
    channelId: 'UC_HtEPrXQYKJ9Pihwg0u1Rw',
    country: '🇹🇭',
  },
  {
    name: 'Strongberry',
    handle: 'StrongberryKr',
    channelId: 'UCB86p_-7ueY4yQwDLBXxCgw',
    country: '🇰🇷',
  },
  {
    name: 'IdeaFirst',
    handle: 'TheIdeaFirstCompany',
    channelId: 'UCyAqWxV1z4QTC8n-wRQN_mQ',
    country: '🇵🇭',
  },
  {
    name: 'GagaOOLala',
    handle: 'GagaOOLala',
    channelId: 'UCDlQgVysoHmuRWX5RriR90Q',
    country: '🇹🇼',
  },
  {
    name: 'WeTV Thailand',
    handle: 'WeTVThailand',
    channelId: 'UCWY3HiAc_WwJRLS3IO79NmQ',
    country: '🇹🇭',
  },
];

/** URL canonica del canal, para links y para el barrido. */
export function officialChannelUrl(ch: OfficialChannel): string {
  return `https://www.youtube.com/@${ch.handle}`;
}

export interface YouTubeChannelRef {
  type: 'id' | 'handle' | 'username';
  value: string;
}

/** Extrae la referencia de canal de una URL de YouTube (canal, no video). */
export function parseYouTubeChannelRef(url: string): YouTubeChannelRef | null {
  const channelMatch = url.match(/youtube\.com\/channel\/(UC[\w-]+)/);
  if (channelMatch) return { type: 'id', value: channelMatch[1] };

  const handleMatch = url.match(/youtube\.com\/@([\w.-]+)/);
  if (handleMatch) return { type: 'handle', value: handleMatch[1] };

  const customMatch = url.match(/youtube\.com\/c\/([\w.-]+)/);
  if (customMatch) return { type: 'handle', value: customMatch[1] };

  const userMatch = url.match(/youtube\.com\/user\/([\w.-]+)/);
  if (userMatch) return { type: 'username', value: userMatch[1] };

  return null;
}

const OFFICIAL_IDS = new Set(
  OFFICIAL_CHANNELS.map((c) => c.channelId).filter((id): id is string => !!id)
);
const OFFICIAL_HANDLES = new Set(
  OFFICIAL_CHANNELS.map((c) => c.handle.toLowerCase())
);

export function isOfficialChannelId(
  channelId: string | null | undefined
): boolean {
  return !!channelId && OFFICIAL_IDS.has(channelId);
}

/**
 * Chequeo debil, por URL guardada: sirve para auditar datos existentes y
 * para el barrido. Para un import nuevo usar el channelId real del video
 * (ver verifyYouTubeVideosOfficial en channel-fetcher.ts), porque la URL
 * de canal que manda el cliente no es confiable.
 */
export function isOfficialChannelUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const ref = parseYouTubeChannelRef(url);
  if (!ref) return false;
  if (ref.type === 'id') return OFFICIAL_IDS.has(ref.value);
  return OFFICIAL_HANDLES.has(ref.value.toLowerCase());
}

/**
 * Plataformas con licencia admitidas en "Donde ver". Se compara por host
 * (con o sin www, y subdominios). YouTube entra solo si el link apunta a un
 * canal oficial (se valida aparte con isOfficialChannelUrl).
 */
export const LICENSED_WATCH_HOSTS = [
  'viki.com',
  'gagaoolala.com',
  'iq.com',
  'iqiyi.com',
  'netflix.com',
  'wetv.vip',
  'viu.com',
  'youku.tv',
  'youku.com',
  'primevideo.com',
  'amazon.com',
  'disneyplus.com',
  'max.com',
  'hbomax.com',
  'tv.apple.com',
  'crunchyroll.com',
  'rakuten.tv',
  'bilibili.tv',
  'shortime.app',
  'youtube.com',
  'youtu.be',
];

/** Hosts conocidos de distribucion sin licencia: se borran sin preguntar. */
export const BLOCKED_WATCH_HOSTS = ['doramasflix.io', 'doramasflix.com'];

export function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return null;
  }
}

function hostMatches(host: string, allowed: string): boolean {
  return host === allowed || host.endsWith(`.${allowed}`);
}

export type WatchLinkVerdict = 'licensed' | 'blocked' | 'review';

/**
 * 'licensed'  → plataforma con licencia (o canal oficial de YouTube).
 * 'blocked'   → host pirata conocido.
 * 'review'    → no se puede decidir solo (YouTube fuera de la lista,
 *               Telegram, sitios desconocidos): lo revisa una persona.
 */
export function classifyWatchLink(url: string): WatchLinkVerdict {
  const host = hostOf(url);
  if (!host) return 'review';
  if (BLOCKED_WATCH_HOSTS.some((h) => hostMatches(host, h))) return 'blocked';
  if (hostMatches(host, 'youtube.com') || hostMatches(host, 'youtu.be')) {
    return isOfficialChannelUrl(url) ? 'licensed' : 'review';
  }
  if (LICENSED_WATCH_HOSTS.some((h) => hostMatches(host, h))) return 'licensed';
  return 'review';
}

/** Mensaje unico para todos los puntos de entrada que rechazan contenido. */
export const UNOFFICIAL_CHANNEL_ERROR =
  'Solo se pueden agregar episodios publicados por el canal oficial de la productora o distribuidora. Este video pertenece a otro canal. Si creés que ese canal es oficial, pedí que lo sumen a la lista desde Feedback.';
