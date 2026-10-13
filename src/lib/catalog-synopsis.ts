/** Small, short-lived browser cache of public text; coalesces hover → modal. */
export function createCatalogSynopsisReader(
  request: typeof fetch = fetch,
  now = Date.now
) {
  const cache = new Map<string, { value: string | null; expires: number }>();
  const pending = new Map<string, Promise<string | null>>();
  return function read(id: string): Promise<string | null> {
    const hit = cache.get(id);
    if (hit && hit.expires > now()) return Promise.resolve(hit.value);
    const inflight = pending.get(id);
    if (inflight) return inflight;
    const promise = request(`/api/series/${encodeURIComponent(id)}/preview`)
      .then(async (response) => {
        if (!response.ok) throw new Error('Preview unavailable');
        const data: { synopsis?: unknown } = await response.json();
        if (data.synopsis !== null && typeof data.synopsis !== 'string')
          throw new Error('Invalid preview');
        if (cache.size >= 50) cache.delete(cache.keys().next().value!);
        cache.set(id, { value: data.synopsis, expires: now() + 60_000 });
        return data.synopsis;
      })
      .finally(() => pending.delete(id));
    pending.set(id, promise);
    return promise;
  };
}
export const readCatalogSynopsis = createCatalogSynopsisReader();
