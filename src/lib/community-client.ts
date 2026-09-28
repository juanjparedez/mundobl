export class CommunityRequestError extends Error {
  constructor(
    public readonly status: number,
    public readonly code?: string
  ) {
    super(`Community request: ${status}`);
  }
}
export async function communityFetch<T>(
  url: string,
  method = 'GET',
  body?: unknown,
  signal?: AbortSignal
): Promise<T> {
  const response = await fetch(url, {
    method,
    signal,
    cache: 'no-store',
    ...(body === undefined
      ? {}
      : {
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }),
  });
  if (!response.ok) {
    const payload: unknown = await response.json().catch(() => null);
    const code =
      payload &&
      typeof payload === 'object' &&
      'error' in payload &&
      typeof payload.error === 'string'
        ? payload.error
        : undefined;
    throw new CommunityRequestError(response.status, code);
  }
  return response.json() as Promise<T>;
}
