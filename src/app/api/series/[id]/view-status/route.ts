import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requireAuth } from '@/lib/auth-helpers';
import { setSeriesTrackingStatus } from '@/lib/tracking';

const VALID_STATUSES = [
  'SIN_VER',
  'VIENDO',
  'VISTA',
  'ABANDONADA',
  'RETOMAR',
] as const;
type WatchStatusInput = (typeof VALID_STATUSES)[number];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth();
    if (!authResult.authorized) return authResult.response;

    const resolvedParams = await params;
    const seriesId = parseInt(resolvedParams.id, 10);
    const body = await request.json();
    const { status } = body as { status: WatchStatusInput };

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Estado inválido' }, { status: 400 });
    }

    const viewStatus = await prisma.$transaction((tx) =>
      setSeriesTrackingStatus(tx, authResult.userId, seriesId, status)
    );

    return NextResponse.json(viewStatus);
  } catch (error) {
    console.error('Error updating view status:', error);
    return NextResponse.json(
      { error: 'Failed to update view status' },
      { status: 500 }
    );
  }
}
