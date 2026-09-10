// ============================================
// Etiquetado UTM de los enlaces que se comparten
// ============================================
//
// Por que existe: medido el 2026-09-10, de 437 visitantes en 30 dias, 364
// llegaron sin referrer ("directo") contra 216 de Google. Ese "directo" es
// casi todo dark social — enlaces pegados en WhatsApp, Telegram o DMs, que
// no mandan referrer. Hoy ese canal, el mas grande del sitio, es
// completamente invisible: no sabemos si alguien comparte ni que comparte.
//
// Etiquetar el enlace en el momento de compartirlo es la unica forma de
// separar "alguien tecleo el dominio" de "alguien lo recomendo". Incluye a
// proposito el boton de copiar, que probablemente sea el canal real.

export type ShareChannel =
  | 'whatsapp'
  | 'telegram'
  | 'twitter'
  | 'facebook'
  | 'native'
  | 'copy';

const CAMPAIGN = 'share_button';
const MEDIUM = 'share';

/** Hosts propios. Solo se etiquetan enlaces nuestros: ponerle UTM a un
 *  dominio ajeno ensucia la analitica de otro y no nos mide nada. */
const OWN_HOSTS = new Set([
  'mundobl.com.ar',
  'www.mundobl.com.ar',
  'mundobl.win',
]);

function isOwnUrl(parsed: URL): boolean {
  if (OWN_HOSTS.has(parsed.hostname)) return true;
  // En preview de Vercel y en local el host cambia en cada deploy, asi que
  // se compara contra el origen desde el que corre la pagina.
  if (typeof window !== 'undefined') {
    return parsed.origin === window.location.origin;
  }
  return false;
}

/**
 * Devuelve la misma URL con los parametros de campana del canal.
 *
 * Preserva los query params que ya tenga y no pisa UTMs existentes (si el
 * enlace ya venia etiquetado, gana la etiqueta original). Ante una URL que
 * no se puede parsear o que no es nuestra, devuelve la entrada intacta:
 * medir nunca puede romper el compartir.
 */
export function withUtm(url: string, source: ShareChannel): string {
  try {
    const parsed = new URL(url);
    if (!isOwnUrl(parsed)) return url;
    if (parsed.searchParams.has('utm_source')) return url;

    parsed.searchParams.set('utm_source', source);
    parsed.searchParams.set('utm_medium', MEDIUM);
    parsed.searchParams.set('utm_campaign', CAMPAIGN);
    return parsed.toString();
  } catch {
    return url;
  }
}
