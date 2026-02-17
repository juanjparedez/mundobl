import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database';

// GET - Obtener todas las series que estás viendo actualmente
export async function GET() {
  try {
    const currentlyWatching = await prisma.viewStatus.findMany({
      where: {
        status: 'VIENDO',
        seriesId: { not: null },
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
