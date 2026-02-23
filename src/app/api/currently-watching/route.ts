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
                    viewStatus: true,
                  },
                  orderBy: { episodeNumber: 'asc' },
                },
                viewStatus: true,
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
