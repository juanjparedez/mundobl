import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { getTrackingInsights } from '@/lib/database';

const headers = { 'Cache-Control': 'private, no-store' };
export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.authorized) return auth.response;
  const days = Number(request.nextUrl.searchParams.get('days') ?? '30');
  if (days !== 7 && days !== 30 && days !== 365) {
    return NextResponse.json(
      { code: 'INVALID_PERIOD' },
      { status: 400, headers }
    );
  }
  try {
    return NextResponse.json(await getTrackingInsights(auth.userId, days), {
      headers,
    });
  } catch {
    return NextResponse.json(
      { code: 'STATS_UNAVAILABLE' },
      { status: 503, headers }
    );
  }
}
