import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requireRole } from '@/lib/auth-helpers';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST - Crear/Actualizar ratings de una temporada
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireRole(['ADMIN']);
    if (!authResult.authorized) return authResult.response;

    const { id } = await params;
    const seasonId = parseInt(id, 10);

    if (isNaN(seasonId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const body = await request.json();
    const { ratings } = body;

    if (!ratings) {
      return NextResponse.json(
        { error: 'Se requiere el objeto ratings' },
        { status: 400 }
      );
    }

    // Eliminar ratings anteriores de esta temporada
    await prisma.rating.deleteMany({
      where: { seasonId },
    });

    // Crear nuevos ratings
    const createdRatings = [];
    for (const [category, score] of Object.entries(ratings)) {
      if (typeof score === 'number' && score > 0) {
        const rating = await prisma.rating.create({
          data: {
            category,
            score: score as number,
            seasonId,
          },
        });
        createdRatings.push(rating);
      }
    }

    return NextResponse.json(createdRatings);
  } catch (error) {
    console.error('Error al guardar ratings:', error);
    return NextResponse.json(
      { error: 'Error al guardar los ratings' },
      { status: 500 }
    );
  }
}
