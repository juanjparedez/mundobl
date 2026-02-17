import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';

// POST - Fusionar dos actores (mover referencias del source al target, eliminar source)
export async function POST(request: NextRequest) {
  try {
    const { sourceId, targetId } = await request.json();

    if (!sourceId || !targetId) {
      return NextResponse.json(
        { error: 'sourceId y targetId son requeridos' },
        { status: 400 }
      );
    }

    if (sourceId === targetId) {
      return NextResponse.json(
        { error: 'No puedes fusionar un actor consigo mismo' },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      // 1. Mover SeriesActor: source → target
      const seriesActors = await tx.seriesActor.findMany({
        where: { actorId: sourceId },
      });

      for (const sa of seriesActors) {
        // Verificar si ya existe (seriesId, targetId, character)
        const existing = await tx.seriesActor.findFirst({
          where: {
            seriesId: sa.seriesId,
            actorId: targetId,
            character: sa.character,
          },
        });

        if (existing) {
          // El target ya tiene esta relación, eliminar la del source
          await tx.seriesActor.delete({ where: { id: sa.id } });
        } else {
          // Mover al target
          await tx.seriesActor.update({
            where: { id: sa.id },
            data: { actorId: targetId },
          });
        }
      }

      // 2. Mover SeasonActor: source → target
      const seasonActors = await tx.seasonActor.findMany({
        where: { actorId: sourceId },
      });

      for (const sa of seasonActors) {
        const existing = await tx.seasonActor.findFirst({
          where: {
            seasonId: sa.seasonId,
            actorId: targetId,
            character: sa.character,
          },
        });

        if (existing) {
          await tx.seasonActor.delete({ where: { id: sa.id } });
        } else {
          await tx.seasonActor.update({
            where: { id: sa.id },
            data: { actorId: targetId },
          });
        }
      }

      // 3. Eliminar actor source
      await tx.actor.delete({ where: { id: sourceId } });
    });

    return NextResponse.json({
      success: true,
      message: 'Actores fusionados exitosamente',
    });
  } catch (error) {
    console.error('Error merging actors:', error);
    return NextResponse.json(
      { error: 'Error al fusionar actores' },
      { status: 500 }
    );
  }
}
