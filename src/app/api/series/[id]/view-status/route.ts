import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requireAuth } from '@/lib/auth-helpers';

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

    const updateData: Record<string, string | Date | null> = { status };

    if (status === 'VISTA') {
      updateData.watchedDate = new Date();
    } else if (status === 'SIN_VER') {
      updateData.watchedDate = null;
    }

    if (status === 'VIENDO') {
      updateData.lastWatchedAt = new Date();
    }

    const existing = await prisma.viewStatus.findUnique({
      where: { userId_seriesId: { userId: authResult.userId, seriesId } },
    });

    let viewStatus;

    if (existing) {
      viewStatus = await prisma.viewStatus.update({
        where: { userId_seriesId: { userId: authResult.userId, seriesId } },
        data: updateData,
      });
    } else {
      viewStatus = await prisma.viewStatus.create({
        data: {
          seriesId,
          userId: authResult.userId,
          ...updateData,
        },
      });
    }

    return NextResponse.json(viewStatus);
  } catch (error) {
    console.error('Error updating view status:', error);
    return NextResponse.json(
      { error: 'Failed to update view status' },
      { status: 500 }
    );
  }
}
