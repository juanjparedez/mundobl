import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requireAuth } from '@/lib/auth-helpers';

export async function GET() {
  try {
    const authResult = await requireAuth();
    if (!authResult.authorized) return authResult.response;

    const favorites = await prisma.userFavorite.findMany({
      where: { userId: authResult.userId },
      select: { seriesId: true },
    });

    const favoriteIds = favorites.map((f) => f.seriesId);
    return NextResponse.json(favoriteIds);
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return NextResponse.json(
      { error: 'Error al obtener favoritos' },
      { status: 500 }
    );
  }
}
