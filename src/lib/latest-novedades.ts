/** Public timestamp only: share concurrent reads across navigation components. */
export function createLatestNovedadesReader(
  request: (url: string) => Promise<Response> = fetch,
  now: () => number = Date.now
) {
  let cached: { timestamp: number | null; expiresAt: number } | undefined;
  let pending: Promise<number | null> | undefined;
  return function read(): Promise<number | null> {
    if (cached && cached.expiresAt > now())
      return Promise.resolve(cached.timestamp);
    if (pending) return pending;
    pending = request('/api/novedades/latest')
      .then(async (response) => {
        if (!response.ok) throw new Error('Latest novedades request failed');
        const data: { timestamp?: unknown } = await response.json();
        if (
          data.timestamp !== null &&
          (typeof data.timestamp !== 'number' ||
            !Number.isFinite(data.timestamp))
        ) {
          throw new Error('Invalid novedades timestamp');
        }
        cached = { timestamp: data.timestamp, expiresAt: now() + 60_000 };
        return data.timestamp;
      })
      .finally(() => {
        pending = undefined;
      });
    return pending;
  };
}

export const readLatestNovedades = createLatestNovedadesReader();
