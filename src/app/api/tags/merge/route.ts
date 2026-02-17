import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requireRole } from '@/lib/auth-helpers';

// POST - Fusionar dos tags (mover referencias del source al target, eliminar source)
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
        { error: 'No puedes fusionar un tag consigo mismo' },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      // 1. Mover SeriesTag: source → target
      const seriesTags = await tx.seriesTag.findMany({
        where: { tagId: sourceId },
      });

      for (const st of seriesTags) {
        // Verificar si ya existe (seriesId, targetId)
        const existing = await tx.seriesTag.findFirst({
          where: {
            seriesId: st.seriesId,
            tagId: targetId,
          },
        });

        if (existing) {
          await tx.seriesTag.delete({ where: { id: st.id } });
        } else {
          await tx.seriesTag.update({
            where: { id: st.id },
            data: { tagId: targetId },
          });
        }
      }

      // 2. Eliminar tag source
      await tx.tag.delete({ where: { id: sourceId } });
    });

    return NextResponse.json({
      success: true,
      message: 'Tags fusionados exitosamente',
    });
  } catch (error) {
    console.error('Error merging tags:', error);
    return NextResponse.json(
      { error: 'Error al fusionar tags' },
      { status: 500 }
    );
  }
}
