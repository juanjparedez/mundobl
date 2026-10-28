/**
 * Pais del visitante (ISO-2) segun Vercel/Cloudflare, desde la IP, o null
 * si no se sabe. No se guarda en ningun lado, como dice /privacidad.
 */
export function viewerCountryFromHeaders(headers: Headers): string | null {
  const raw = headers.get('x-vercel-ip-country') ?? headers.get('cf-ipcountry');
  // Cloudflare usa XX para "desconocido" y T1 para Tor.
  return raw && /^[A-Z]{2}$/.test(raw) && raw !== 'XX' ? raw : null;
}
