import { NextResponse } from 'next/server';
import { getWatchingLibrary } from '@/lib/database';
import { requireAuth } from '@/lib/auth-helpers';

// Keep the dashboard widget contract: only active series by default.
export async function GET() {
  const auth = await requireAuth();
  if (!auth.authorized) return auth.response;
  try {
    return NextResponse.json(await getWatchingLibrary(auth.userId), {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch {
    return NextResponse.json(
      { error: 'Unable to load tracking' },
      { status: 500 }
    );
  }
}
