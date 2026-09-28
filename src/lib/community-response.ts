import { NextResponse } from 'next/server';
import { CommunityError } from './community-input';

export function assertCommunityOrigin(request: Request): void {
  const origin = request.headers.get('origin');
  const url = new URL(request.url);
  // NextURL normalizes loopback hosts to "localhost". Host retains the browser's
  // actual authority; browsers cannot forge it or Origin in a credentialed POST.
  const host = request.headers.get('host') ?? url.host;
  let matches = !origin;
  if (origin) {
    try {
      const source = new URL(origin);
      matches =
        source.origin === origin &&
        source.protocol === url.protocol &&
        source.host.toLowerCase() === host.toLowerCase();
    } catch {
      matches = false;
    }
  }
  if (request.headers.get('sec-fetch-site') === 'cross-site' || !matches)
    throw new CommunityError(403, 'unavailable');
}

/** Cookie-authenticated writes must come from this origin and have bounded JSON bodies. */
export async function readCommunityMutation(
  request: Request
): Promise<unknown> {
  assertCommunityOrigin(request);
  if (
    !request.headers
      .get('content-type')
      ?.toLowerCase()
      .startsWith('application/json')
  )
    throw new CommunityError(415, 'invalid');
  const maxBytes = 256 * 1024;
  if (Number(request.headers.get('content-length')) > maxBytes)
    throw new CommunityError(413, 'limit');
  // Read incrementally: an omitted or dishonest Content-Length cannot allocate an unbounded body.
  const reader = request.body?.getReader();
  if (!reader) throw new CommunityError(400, 'invalid');
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > maxBytes) {
        await reader.cancel();
        throw new CommunityError(413, 'limit');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return JSON.parse(new TextDecoder().decode(bytes)) as unknown;
}

export function communityResponse(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { 'Cache-Control': 'private, no-store' },
  });
}
export function communityFailure(error: unknown) {
  if (error instanceof CommunityError)
    return communityResponse({ error: error.message }, error.status);
  if (error instanceof SyntaxError)
    return communityResponse({ error: 'invalid' }, 400);
  console.error('Community request failed', error);
  return communityResponse({ error: 'error' }, 500);
}
