/** Compare the browser authority, preserving loopback aliases normalized by NextURL. */
export function isSameOriginRequest(
  request: Request,
  requireOrigin = true
): boolean {
  if (request.headers.get('sec-fetch-site') === 'cross-site') return false;
  const origin = request.headers.get('origin');
  if (!origin) return !requireOrigin;
  try {
    const url = new URL(request.url);
    const source = new URL(origin);
    const host = request.headers.get('host') ?? url.host;
    return (
      source.origin === origin &&
      source.protocol === url.protocol &&
      source.host.toLowerCase() === host.toLowerCase()
    );
  } catch {
    return false;
  }
}
