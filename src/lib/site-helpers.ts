/**
 * Helpers para sitios externos. Pricipalmente para derivar favicon /
 * branding desde la URL cuando el sitio no tiene logo propio en DB.
 */

/**
 * Devuelve el favicon de Google's S2 favicon service.
 * size: 16 | 32 | 64 | 128 (default 32).
 *
 * Ventaja: cero infra propia, cero rate limit en uso normal, sin tracking.
 * Cubre 99% de los sitios web. Si el dominio no tiene favicon o el
 * servicio responde 404, Chrome muestra el ícono globe default.
 *
 * Devuelve null si la URL es invalida.
 */
export function getFaviconUrl(
  siteUrl: string,
  size: 16 | 32 | 64 | 128 = 64
): string | null {
  try {
    const url = new URL(siteUrl);
    return `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=${size}`;
  } catch {
    return null;
  }
}

/**
 * Hostname limpio para mostrar (sin protocolo ni www).
 * Si la URL es invalida, devuelve la cadena original.
 */
export function getDisplayHostname(siteUrl: string): string {
  try {
    return new URL(siteUrl).hostname.replace(/^www\./, '');
  } catch {
    return siteUrl;
  }
}
