import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import {
  getWatchingPreferences,
  saveWatchingPreferences,
} from '@/lib/database';
import {
  parseInitialPreferences,
  parsePreferenceChange,
} from '@/lib/watching-preferences';

const headers = { 'Cache-Control': 'no-store' };
export async function GET() {
  const auth = await requireAuth();
  if (!auth.authorized) return auth.response;
  try {
    return NextResponse.json(
      { preferences: await getWatchingPreferences(auth.userId) },
      { headers }
    );
  } catch {
    return NextResponse.json(
      { error: 'Unable to load preferences' },
      { status: 500, headers }
    );
  }
}

async function save(request: Request, initialize: boolean) {
  const auth = await requireAuth();
  if (!auth.authorized) return auth.response;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON' },
      { status: 400, headers }
    );
  }
  const change = parsePreferenceChange(body);
  const initial = parseInitialPreferences(body);
  if (initialize ? !initial : !change)
    return NextResponse.json(
      { error: 'Invalid preferences' },
      { status: 400, headers }
    );
  try {
    const preferences = await saveWatchingPreferences(
      auth.userId,
      initialize ? { initial: initial! } : { change: change! }
    );
    return NextResponse.json({ preferences }, { headers });
  } catch {
    return NextResponse.json(
      { error: 'Unable to save preferences' },
      { status: 500, headers }
    );
  }
}

// Bootstrap a device's legacy preferences only if the account has none.
export async function POST(request: Request) {
  return save(request, true);
}
export async function PATCH(request: Request) {
  return save(request, false);
}
