import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requireRole } from '@/lib/auth-helpers';

// POST - Fusionar dos directores (mover referencias del source al target, eliminar source)
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireRole(['ADMIN']);
    if (!authResult.authorized) return authResult.response;

    const { sourceId, targetId } = await request.json();

    if (!sourceId || !targetId) {
      return NextResponse.json(
        { error: 'sourceId y targetId son requeridos' },
        { status: 400 }
      );
    }

    if (sourceId === targetId) {
      return NextResponse.json(
        { error: 'No puedes fusionar un director consigo mismo' },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      // 1. Mover SeriesDirector: source → target
      const seriesDirectors = await tx.seriesDirector.findMany({
        where: { directorId: sourceId },
      });

      for (const sd of seriesDirectors) {
        // Verificar si ya existe (seriesId, targetId)
        const existing = await tx.seriesDirector.findFirst({
          where: {
            seriesId: sd.seriesId,
            directorId: targetId,
          },
        });

        if (existing) {
          await tx.seriesDirector.delete({ where: { id: sd.id } });
        } else {
          await tx.seriesDirector.update({
            where: { id: sd.id },
            data: { directorId: targetId },
          });
        }
      }

      // 2. Eliminar director source
      await tx.director.delete({ where: { id: sourceId } });
    });

    return NextResponse.json({
      success: true,
      message: 'Directores fusionados exitosamente',
    });
  } catch (error) {
    console.error('Error merging directors:', error);
    return NextResponse.json(
      { error: 'Error al fusionar directores' },
      { status: 500 }
    );
  }
}
