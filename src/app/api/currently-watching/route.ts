import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requireAuth } from '@/lib/auth-helpers';

// GET - Obtener las series que el usuario autenticado está viendo
export async function GET() {
  try {
    const authResult = await requireAuth();
    if (!authResult.authorized) return authResult.response;

    const currentlyWatching = await prisma.viewStatus.findMany({
      where: {
        status: 'VIENDO',
        seriesId: { not: null },
        userId: authResult.userId,
      },
      include: {
        series: {
          include: {
            country: true,
            seasons: {
              include: {
                episodes: {
                  include: {
                    // Solo el viewStatus del usuario autenticado: sin el filtro,
                    // viewStatus[0] podía ser de otro user y corrompía el
                    // progreso/proximo episodio de cada card.
                    viewStatus: { where: { userId: authResult.userId } },
                  },
                  orderBy: { episodeNumber: 'asc' },
                },
                viewStatus: { where: { userId: authResult.userId } },
              },
              orderBy: { seasonNumber: 'asc' },
            },
          },
        },
      },
      orderBy: {
        lastWatchedAt: 'desc', // Ordenar por última vez vista
      },
    });

    return NextResponse.json(currentlyWatching);
  } catch (error) {
    console.error('Error fetching currently watching:', error);
    return NextResponse.json(
      { error: 'Error al obtener las series' },
      { status: 500 }
    );
  }
}
