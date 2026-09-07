// ============================================
// Sondeo de reproducibilidad de embeds
// ============================================
//
// Responde una sola pregunta: "¿este embed se puede mirar de verdad?".
//
// Existe porque el catalogo de /ver se pudre solo. Un episodio importado
// hoy puede, sin que nadie toque nada:
//   - quedar geo-bloqueado cuando la productora licencia la serie a
//     Viki/iQIYI para occidente (patron confirmado con GMMTV),
//   - recibir un age-gate de YouTube, que mata el embed en TODOS lados
//     (ni con VPN: YouTube exige login en su propio dominio),
//   - ser borrado o pasado a privado,
//   - perder el permiso de embed.
//
// Hay dos fuentes y NO son intercambiables:
//
//   probeViaApi     — YouTube Data API. Devuelve regionRestriction, que
//                     lista los paises bloqueados de TODO el mundo en una
//                     sola llamada. Es la fuente correcta y la unica que
//                     puede llenar playbackBlockedMarkets completo.
//                     Necesita YOUTUBE_API_KEY.
//
//   probeViaWatchPage — Lee la watch page publica. NO necesita API key,
//                     pero solo sabe del pais desde el que corre el
//                     proceso. Fallback para cuando la key esta caida o
//                     agotada, y unica via para el chequeo "¿de verdad
//                     anda desde Argentina?" corriendo local.
//
// Ambas devuelven la misma forma para que el caller no se entere.

import { CORE_MARKETS } from './channel-fetcher';

/** Espejo de `EpisodePlayback` en prisma/schema.prisma. */
export type PlaybackStatus =
  | 'UNKNOWN'
  | 'OK'
  | 'GEO_BLOCKED'
  | 'AGE_RESTRICTED'
  | 'REMOVED'
  | 'NOT_EMBEDDABLE';

export interface PlaybackProbe {
  videoId: string;
  status: PlaybackStatus;
  /** Subset de CORE_MARKETS bloqueado. Vacio si status != GEO_BLOCKED. */
  blockedMarkets: string[];
  /** Texto crudo devuelto por YouTube, para diagnosticar casos raros. */
  detail: string | null;
  /**
   * Duracion en segundos, o null si la fuente no la trae (la watch page
   * no se parsea para esto).
   *
   * Sirve para detectar trailers cargados como episodios, que es un caso
   * real y silencioso: /ver mostraba "Some More" y "Long time no see"
   * como mirables cuando su unico "episodio" era el trailer oficial, de
   * 43 y 69 segundos. La duracion es la señal CONFIABLE — filtrar por
   * titulo falla en los dos sentidos: "clip" matchea dentro de "Eclipse"
   * y un trailer en coreano se llama "예고편".
   */
  durationSeconds: number | null;
}

/**
 * Por debajo de esto, un "episodio" casi seguro es un trailer, un teaser
 * o un clip. Los BL cortos legitimos rondan los 10-15 minutos; los
 * trailers no pasan de 2.
 */
export const MIN_EPISODE_SECONDS = 5 * 60;

/** Parsea la duracion ISO-8601 de YouTube (PT1M9S, PT43S, PT1H2M3S). */
export function parseIsoDuration(iso: string | undefined): number | null {
  if (!iso) return null;
  const m = iso.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!m) return null;
  const [, h, min, s] = m;
  return Number(h ?? 0) * 3600 + Number(min ?? 0) * 60 + Number(s ?? 0);
}

const WATCH_PAGE_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

// La API acepta hasta 50 ids por llamada de videos.list y cuesta 1 unidad
// de cuota, sin importar cuantos ids mandes. Sondear 1.800 episodios sale
// 36 unidades de las 10.000 diarias.
export const API_BATCH_SIZE = 50;

// ---------------------------------------------------------------------
// Fuente 1: YouTube Data API (preferida)
// ---------------------------------------------------------------------

interface ApiVideoItem {
  id: string;
  contentDetails?: {
    regionRestriction?: { blocked?: string[]; allowed?: string[] };
    contentRating?: { ytRating?: string };
    duration?: string;
  };
  status?: { embeddable?: boolean; privacyStatus?: string };
}

/**
 * Sondea hasta API_BATCH_SIZE videos de una. Los ids que YouTube no
 * devuelve se reportan como REMOVED: la API omite del response los
 * videos borrados o privados, no los marca.
 */
export async function probeViaApi(
  videoIds: string[],
  apiKey: string
): Promise<PlaybackProbe[]> {
  if (videoIds.length === 0) return [];
  if (videoIds.length > API_BATCH_SIZE) {
    throw new Error(
      `probeViaApi acepta hasta ${API_BATCH_SIZE} ids por llamada, recibio ${videoIds.length}.`
    );
  }

  const url = new URL('https://www.googleapis.com/youtube/v3/videos');
  url.searchParams.set('part', 'contentDetails,status');
  url.searchParams.set('id', videoIds.join(','));
  url.searchParams.set('key', apiKey);

  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    const body = await res.text();
    throw new PlayabilityApiError(
      `YouTube Data API respondio ${res.status}: ${body.slice(0, 200)}`,
      res.status
    );
  }

  const data = (await res.json()) as { items?: ApiVideoItem[] };
  const byId = new Map((data.items ?? []).map((i) => [i.id, i]));

  return videoIds.map((videoId) => {
    const item = byId.get(videoId);
    // La API omite silenciosamente lo borrado/privado.
    if (!item) {
      return {
        videoId,
        status: 'REMOVED' as const,
        blockedMarkets: [],
        detail: 'La API no devolvio el video (borrado o privado).',
        durationSeconds: null,
      };
    }

    const durationSeconds = parseIsoDuration(item.contentDetails?.duration);

    // El age-gate gana sobre todo lo demas: aunque no este geo-bloqueado,
    // el embed no arranca en ningun lado.
    if (item.contentDetails?.contentRating?.ytRating === 'ytAgeRestricted') {
      return {
        videoId,
        status: 'AGE_RESTRICTED' as const,
        blockedMarkets: [],
        detail: 'ytAgeRestricted',
        durationSeconds,
      };
    }

    if (item.status?.embeddable === false) {
      return {
        videoId,
        status: 'NOT_EMBEDDABLE' as const,
        blockedMarkets: [],
        detail: 'El uploader deshabilito el embed.',
        durationSeconds,
      };
    }

    const blockedMarkets = resolveBlockedMarkets(
      item.contentDetails?.regionRestriction
    );
    if (blockedMarkets.length > 0) {
      return {
        videoId,
        status: 'GEO_BLOCKED' as const,
        blockedMarkets,
        detail: `Bloqueado en ${blockedMarkets.join(', ')}.`,
        durationSeconds,
      };
    }

    return {
      videoId,
      status: 'OK' as const,
      blockedMarkets: [],
      detail: null,
      durationSeconds,
    };
  });
}

/**
 * `regionRestriction` viene con `blocked` O con `allowed`, nunca las dos.
 * Con `allowed`, todo lo que no este en la lista esta bloqueado.
 */
function resolveBlockedMarkets(
  rr: { blocked?: string[]; allowed?: string[] } | undefined
): string[] {
  if (!rr) return [];
  if (rr.blocked) return CORE_MARKETS.filter((m) => rr.blocked!.includes(m));
  if (rr.allowed) return CORE_MARKETS.filter((m) => !rr.allowed!.includes(m));
  return [];
}

export class PlayabilityApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
    this.name = 'PlayabilityApiError';
  }
}

// ---------------------------------------------------------------------
// Fuente 2: watch page publica (fallback sin API key)
// ---------------------------------------------------------------------

/**
 * Sondea un video leyendo la watch page. Solo refleja el pais desde el
 * que corre este proceso, asi que `blockedMarkets` se llena con
 * `localMarket` y nada mas — no asumas que el resto de los mercados
 * estan bien solo porque este sondeo dio OK.
 *
 * `localMarket` es el ISO-2 del pais donde corre el proceso (ej. 'AR'
 * corriendo local en Buenos Aires). Va como dato del caller porque este
 * modulo no puede adivinarlo.
 */
export async function probeViaWatchPage(
  videoId: string,
  localMarket: string
): Promise<PlaybackProbe> {
  let html: string;
  try {
    const res = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        'User-Agent': WATCH_PAGE_UA,
        'Accept-Language': 'es-AR,es;q=0.9',
      },
      cache: 'no-store',
    });
    html = await res.text();
  } catch (err) {
    // Un fallo de red no es informacion sobre el video: no pisar el
    // estado guardado con un veredicto inventado.
    return {
      videoId,
      status: 'UNKNOWN',
      blockedMarkets: [],
      detail: `Fallo de red: ${err instanceof Error ? err.message : 'desconocido'}`,
      durationSeconds: null,
    };
  }

  return parseWatchPage(videoId, html, localMarket);
}

/**
 * Separada de probeViaWatchPage para poder testearla con HTML fijo sin
 * salir a la red.
 */
export function parseWatchPage(
  videoId: string,
  html: string,
  localMarket: string
): PlaybackProbe {
  const status = html.match(/"playabilityStatus":\{"status":"([A-Z_]+)"/)?.[1];
  if (!status) {
    return {
      videoId,
      status: 'UNKNOWN',
      blockedMarkets: [],
      detail: 'No se encontro playabilityStatus en la pagina.',
      durationSeconds: null,
    };
  }

  if (status === 'OK') {
    // Publico y reproducible, pero puede tener el embed deshabilitado.
    const embeddable = html.match(/"playableInEmbed":(true|false)/)?.[1];
    if (embeddable === 'false') {
      return {
        videoId,
        status: 'NOT_EMBEDDABLE',
        blockedMarkets: [],
        detail: 'playableInEmbed=false',
        durationSeconds: null,
      };
    }
    return {
      videoId,
      status: 'OK',
      blockedMarkets: [],
      detail: null,
      durationSeconds: null,
    };
  }

  // El `reason` corto es generico ("Video no disponible") tanto para geo
  // como para borrado. La descripcion larga del errorScreen es la que
  // distingue: "...no permitio que estuviera disponible en tu país".
  const reason = html.match(
    /"playabilityStatus":\{"status":"[A-Z_]+","reason":"([^"]{0,120})/
  )?.[1];
  const description = html.match(
    /"interstitialViewModel":\{"title":\{"content":"[^"]*"\},"description":\{"content":"([^"]{0,200})/
  )?.[1];
  const haystack = `${reason ?? ''} ${description ?? ''}`;

  if (/edad|age|confirm your age/i.test(haystack)) {
    return {
      videoId,
      status: 'AGE_RESTRICTED',
      blockedMarkets: [],
      detail: haystack.trim() || null,
      durationSeconds: null,
    };
  }

  if (/en tu país|in your country|no lo permite en tu/i.test(haystack)) {
    return {
      videoId,
      status: 'GEO_BLOCKED',
      blockedMarkets: [localMarket],
      detail: haystack.trim() || null,
      durationSeconds: null,
    };
  }

  if (status === 'LOGIN_REQUIRED') {
    // Sin senal de edad explicita, LOGIN_REQUIRED es video privado.
    return {
      videoId,
      status: 'REMOVED',
      blockedMarkets: [],
      detail: haystack.trim() || 'LOGIN_REQUIRED',
      durationSeconds: null,
    };
  }

  return {
    videoId,
    status: 'REMOVED',
    blockedMarkets: [],
    detail: haystack.trim() || status,
    durationSeconds: null,
  };
}

// ---------------------------------------------------------------------
// Lectura del resultado
// ---------------------------------------------------------------------

/**
 * ¿El visitante de `market` puede mirar este episodio?
 *
 * UNKNOWN cuenta como reproducible a proposito: un episodio todavia no
 * sondeado no se esconde de /ver. Es preferible mostrar de mas a vaciar
 * la pagina por un audit que no corrio.
 */
export function isPlayableIn(
  playback: PlaybackStatus,
  blockedMarkets: string[],
  market: string
): boolean {
  switch (playback) {
    case 'OK':
    case 'UNKNOWN':
      return true;
    case 'GEO_BLOCKED':
      return !blockedMarkets.includes(market);
    // AGE_RESTRICTED, REMOVED y NOT_EMBEDDABLE no andan en ningun mercado.
    default:
      return false;
  }
}
