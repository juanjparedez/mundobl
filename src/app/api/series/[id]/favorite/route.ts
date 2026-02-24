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

    const { id } = await params;
    const seriesId = parseInt(id);
    if (isNaN(seriesId)) {
      return NextResponse.json(
        { error: 'ID de serie inválido' },
        { status: 400 }
      );
    }

    // Toggle: si existe → eliminar, si no → crear
    const existing = await prisma.userFavorite.findUnique({
      where: { userId_seriesId: { userId: authResult.userId, seriesId } },
    });

    if (existing) {
      await prisma.userFavorite.delete({
        where: { userId_seriesId: { userId: authResult.userId, seriesId } },
      });
      return NextResponse.json({ isFavorite: false, seriesId });
    }

    await prisma.userFavorite.create({
      data: { userId: authResult.userId, seriesId },
    });
    return NextResponse.json({ isFavorite: true, seriesId });
  } catch (error) {
    console.error('Error updating favorite status:', error);
    return NextResponse.json(
      { error: 'Error al actualizar favorito' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth();
    if (!authResult.authorized) return authResult.response;

    const { id } = await params;
    const seriesId = parseInt(id);
    if (isNaN(seriesId)) {
      return NextResponse.json(
        { error: 'ID de serie inválido' },
        { status: 400 }
      );
    }

    const favorite = await prisma.userFavorite.findUnique({
      where: { userId_seriesId: { userId: authResult.userId, seriesId } },
    });

    return NextResponse.json({ isFavorite: !!favorite });
  } catch (error) {
    console.error('Error checking favorite status:', error);
    return NextResponse.json(
      { error: 'Error al verificar favorito' },
      { status: 500 }
    );
  }
}
