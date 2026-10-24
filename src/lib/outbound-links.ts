// ============================================
// Enlaces salientes a plataformas ("Donde ver")
// ============================================
//
// Por que existe: para hablar con productoras hace falta poder decir
// "enviamos N personas a tu canal oficial". Hasta ahora esos clics no se
// median en ningun lado, y como los links salian con rel="noreferrer", la
// plataforma tampoco sabia que venian de MundoBL.
//
// Dos piezas, ambas solo para links oficiales:
//  - UTM en la URL, para que la productora nos vea en SU analitica. Es la
//    excepcion deliberada a la regla de share-utm.ts (no etiquetar dominios
//    ajenos): aca el objetivo es justamente que el otro lado nos mida.
//  - Un contador diario agregado propio (WatchLinkClickDaily), sin ids de
//    visitante, para poder armar el numero por serie y por productora.

export const WATCH_LINK_SURFACES = ['series', 'info', 'watching'] as const;
export type WatchLinkSurface = (typeof WATCH_LINK_SURFACES)[number];

const UTM_SOURCE = 'mundobl';
const UTM_MEDIUM = 'referral';
const UTM_CAMPAIGN = 'where_to_watch';

/**
 * Agrega UTM de MundoBL a un link oficial. No pisa UTMs existentes, no toca
 * links no oficiales ni URLs que no sean https; ante cualquier error devuelve
 * la entrada intacta: medir nunca puede romper el link.
 */
export function withOutboundUtm(url: string, official: boolean): string {
  if (!official) return url;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return url;
    if (parsed.searchParams.has('utm_source')) return url;
    parsed.searchParams.set('utm_source', UTM_SOURCE);
    parsed.searchParams.set('utm_medium', UTM_MEDIUM);
    parsed.searchParams.set('utm_campaign', UTM_CAMPAIGN);
    return parsed.toString();
  } catch {
    return url;
  }
}

/**
 * rel del link: los oficiales mandan el origen (sin path, por la
 * Referrer-Policy strict-origin-when-cross-origin del sitio) para que la
 * plataforma vea "mundobl.com.ar" como fuente; los no oficiales no mandan nada.
 */
export function outboundRel(official: boolean): string {
  return official ? 'noopener nofollow' : 'noopener noreferrer nofollow';
}

// Doble clic o reintento inmediato no son dos personas. Vive en memoria a
// proposito: nada de historial por titulo en storage del navegador.
const recentClicks = new Map<number, number>();
const DEDUPE_MS = 30_000;

/** Cuenta un clic saliente. Nunca interrumpe la navegacion. */
export function recordWatchLinkClick(
  watchLinkId: number,
  surface: WatchLinkSurface
): void {
  try {
    const now = Date.now();
    const last = recentClicks.get(watchLinkId) ?? 0;
    if (now - last < DEDUPE_MS) return;
    recentClicks.set(watchLinkId, now);
    void fetch('/api/watch-link-clicks', {
      method: 'POST',
      keepalive: true,
      referrerPolicy: 'no-referrer',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ watchLinkId, surface }),
    }).catch(() => undefined);
  } catch {
    /* La medicion nunca rompe el link. */
  }
}
