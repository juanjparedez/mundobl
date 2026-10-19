import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { getRecommendationsForUser } from '@/lib/database';

export async function GET() {
  const auth = await requireAuth();
  if (!auth.authorized) return auth.response;
  try {
    return NextResponse.json(await getRecommendationsForUser(auth.userId), {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch {
    return NextResponse.json(
      { error: 'Unable to load recommendations' },
      { status: 500 }
    );
  }
}
