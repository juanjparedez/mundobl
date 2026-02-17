import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requireAuth } from '@/lib/auth-helpers';

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
    const { watched, currentlyWatching } = body;

    const existing = await prisma.viewStatus.findUnique({
      where: { userId_seriesId: { userId: authResult.userId, seriesId } },
    });

    const updateData: Record<string, boolean | Date | null> = {};
    if (typeof watched === 'boolean') {
      updateData.watched = watched;
      updateData.watchedDate = watched ? new Date() : null;
    }
    if (typeof currentlyWatching === 'boolean') {
      updateData.currentlyWatching = currentlyWatching;
      updateData.lastWatchedAt = currentlyWatching
        ? new Date()
        : (existing?.lastWatchedAt ?? null);
    }

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
