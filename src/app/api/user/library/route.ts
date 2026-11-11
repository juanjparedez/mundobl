import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { errorDetails } from '@/lib/error-details';
import { getWatchingLibrary } from '@/lib/database';

export async function GET() {
  const auth = await requireAuth();
  if (!auth.authorized) return auth.response;
  try {
    return NextResponse.json(await getWatchingLibrary(auth.userId, 'all'), {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('GET /api/user/library failed', errorDetails(error));
    return NextResponse.json(
      { error: 'Unable to load library' },
      { status: 500 }
    );
  }
}
