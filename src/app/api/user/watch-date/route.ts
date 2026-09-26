import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { correctWatchDate, getWatchDate } from '@/lib/database';
import { parseWatchDateEdit } from '@/lib/watch-date';

const headers = { 'Cache-Control': 'private, no-store' };
export async function PATCH(request: Request) {
  const auth = await requireAuth();
  if (!auth.authorized) return auth.response;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { code: 'INVALID_DATE_EDIT' },
      { status: 400, headers }
    );
  }
  const edit = parseWatchDateEdit(body);
  if (!edit)
    return NextResponse.json(
      { code: 'INVALID_DATE_EDIT' },
      { status: 400, headers }
    );
  try {
    const saved = await correctWatchDate(
      auth.userId,
      edit.target,
      edit.watchedDate,
      edit.expectedDate
    );
    if (!saved)
      return NextResponse.json(
        { code: 'STALE_OR_UNWATCHED' },
        { status: 409, headers }
      );
    return NextResponse.json({ watchedDate: edit.watchedDate }, { headers });
  } catch {
    return NextResponse.json(
      { code: 'DATE_EDIT_FAILED' },
      { status: 503, headers }
    );
  }
}

export async function GET(request: Request) {
  const auth = await requireAuth();
  if (!auth.authorized) return auth.response;
  const params = new URL(request.url).searchParams;
  const target = Object.fromEntries(
    ['seriesId', 'seasonId', 'episodeId']
      .filter((key) => params.has(key))
      .map((key) => [key, Number(params.get(key))])
  );
  const parsed = parseWatchDateEdit({
    ...target,
    watchedDate: null,
    expectedDate: null,
  });
  if (!parsed)
    return NextResponse.json(
      { code: 'INVALID_TARGET' },
      { status: 400, headers }
    );
  try {
    const row = await getWatchDate(auth.userId, parsed.target);
    if (!row)
      return NextResponse.json(
        { code: 'NOT_WATCHED' },
        { status: 404, headers }
      );
    return NextResponse.json(row, { headers });
  } catch {
    return NextResponse.json(
      { code: 'DATE_READ_FAILED' },
      { status: 503, headers }
    );
  }
}
