import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requireRole } from '@/lib/auth-helpers';

// POST - Fusionar géneros (mover referencias de los géneros source al target, eliminar sources)
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireRole(['ADMIN', 'MODERATOR']);
    if (!authResult.authorized) return authResult.response;

    const body = await request.json();
    const targetId = typeof body.targetId === 'number' ? body.targetId : parseInt(body.targetId, 10);
    const sourceIdsRaw: unknown[] = Array.isArray(body.sourceIds)
      ? body.sourceIds
      : body.sourceId !== undefined
      ? [body.sourceId]
      : [];

    const sourceIds: number[] = sourceIdsRaw
      .map((id) => (typeof id === 'number' ? id : parseInt(String(id), 10)))
      .filter((id) => !isNaN(id) && id !== targetId);

    if (isNaN(targetId) || sourceIds.length === 0) {
      return NextResponse.json(
        { error: 'Se requieren género destino (targetId) y al menos un género origen (sourceId/sourceIds)' },
        { status: 400 }
      );
    }

    // Verificar que el target exista
    const targetGenre = await prisma.genre.findUnique({
      where: { id: targetId },
    });

    if (!targetGenre) {
      return NextResponse.json(
        { error: 'El género destino no existe' },
        { status: 404 }
      );
    }

    let affectedCount = 0;

    await prisma.$transaction(async (tx) => {
      for (const sourceId of sourceIds) {
        // 1. Mover SeriesGenre: source → target
        const seriesGenres = await tx.seriesGenre.findMany({
          where: { genreId: sourceId },
        });

        for (const sg of seriesGenres) {
          // Verificar si ya existe (seriesId, targetId)
          const existing = await tx.seriesGenre.findFirst({
            where: {
              seriesId: sg.seriesId,
              genreId: targetId,
            },
          });

          if (existing) {
            await tx.seriesGenre.delete({ where: { id: sg.id } });
          } else {
            await tx.seriesGenre.update({
              where: { id: sg.id },
              data: { genreId: targetId },
            });
            affectedCount++;
          }
        }

        // 2. Eliminar género source
        await tx.genre.delete({ where: { id: sourceId } });
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Géneros fusionados exitosamente',
      affectedSeries: affectedCount,
    });
  } catch (error) {
    console.error('Error merging genres:', error);
    return NextResponse.json(
      { error: 'Error al fusionar los géneros' },
      { status: 500 }
    );
  }
}
