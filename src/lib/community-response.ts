import { NextResponse } from 'next/server';
import { CommunityError } from './community-input';

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
