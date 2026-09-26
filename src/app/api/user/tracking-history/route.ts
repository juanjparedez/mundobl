import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { clearTrackingHistory, getTrackingHistory } from '@/lib/database';
import { dateValue } from '@/lib/tracking-backup';

const headers = { 'Cache-Control': 'private, no-store' };

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.authorized) return auth.response;
  const query = request.nextUrl.searchParams;
  const search = query.get('q')?.trim() ?? '';
  const id = query.get('cursorId');
  const rawDate = query.get('cursorDate');
  const recordedAt = dateValue(rawDate);
  if (
    search.length > 100 ||
    ((id !== null || rawDate !== null) &&
      (!id || id.length > 64 || !recordedAt))
  ) {
    return NextResponse.json(
      { code: 'INVALID_QUERY' },
      { status: 400, headers }
    );
  }
  try {
    return NextResponse.json(
      await getTrackingHistory(
        auth.userId,
        search,
        id && recordedAt ? { id, recordedAt } : undefined
      ),
      { headers }
    );
  } catch {
    return NextResponse.json(
      { code: 'HISTORY_UNAVAILABLE' },
      { status: 503, headers }
    );
  }
}

export async function DELETE() {
  const auth = await requireAuth();
  if (!auth.authorized) return auth.response;
  try {
    const result = await clearTrackingHistory(auth.userId);
    return NextResponse.json({ deleted: result.count }, { headers });
  } catch {
    return NextResponse.json(
      { code: 'HISTORY_UNAVAILABLE' },
      { status: 503, headers }
    );
  }
}
