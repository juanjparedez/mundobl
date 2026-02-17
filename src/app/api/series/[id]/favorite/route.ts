import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requireRole } from '@/lib/auth-helpers';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireRole(['ADMIN']);
    if (!authResult.authorized) return authResult.response;

    const { id } = await params;
    const body = await request.json();
    const { isFavorite } = body;

    if (typeof isFavorite !== 'boolean') {
      return NextResponse.json(
        { error: 'isFavorite debe ser un booleano' },
        { status: 400 }
      );
    }

    const seriesId = parseInt(id);
    if (isNaN(seriesId)) {
      return NextResponse.json(
        { error: 'ID de serie inválido' },
        { status: 400 }
      );
    }

    // Actualizar el estado de favorito
    const updatedSeries = await prisma.series.update({
      where: { id: seriesId },
      data: { isFavorite },
      select: { id: true, title: true, isFavorite: true },
    });

    return NextResponse.json(updatedSeries);
  } catch (error) {
    console.error('Error updating favorite status:', error);
    return NextResponse.json(
      { error: 'Error al actualizar favorito' },
      { status: 500 }
    );
  }
}
