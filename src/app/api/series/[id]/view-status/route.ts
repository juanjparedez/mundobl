import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const seriesId = parseInt(resolvedParams.id, 10);
    const body = await request.json();
    const { watched, currentlyWatching } = body;

    // Buscar si ya existe un ViewStatus para esta serie
    const existing = await prisma.viewStatus.findUnique({
      where: { seriesId },
    });

    let viewStatus;

    // Preparar datos a actualizar
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

    if (existing) {
      // Actualizar existente
      viewStatus = await prisma.viewStatus.update({
        where: { seriesId },
        data: updateData,
      });
    } else {
      // Crear nuevo
      viewStatus = await prisma.viewStatus.create({
        data: {
          seriesId,
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
