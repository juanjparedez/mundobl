import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { searchContributionMetadata } from '@/lib/database';
import { isContributionMetadataKind } from '@/lib/contribution-metadata';

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.authorized) return auth.response;
  const kind = request.nextUrl.searchParams.get('kind');
  const search = request.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (!isContributionMetadataKind(kind) || search.length > 100) {
    return NextResponse.json({ code: 'INVALID_QUERY' }, { status: 400 });
  }
  try {
    const names = await searchContributionMetadata(kind, search);
    return NextResponse.json(
      { names },
      { headers: { 'Cache-Control': 'private, no-store' } }
    );
  } catch {
    return NextResponse.json({ code: 'METADATA_UNAVAILABLE' }, { status: 503 });
  }
}
