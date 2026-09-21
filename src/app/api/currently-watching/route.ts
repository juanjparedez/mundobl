import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requireAuth } from '@/lib/auth-helpers';
import { isWatchableEpisode } from '@/lib/watchable';

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

    // Para el boton "Seguir viendo" en /watching: si la serie tiene algun
    // episodio mirable, se puede retomar directo en /ver sin pasar por la
    // ficha del catalogo. `series` es nullable a nivel de tipo (relacion
    // opcional en el schema) aunque el `where` ya garantiza `seriesId` no
    // nulo, de ahi el `!`.
    const result = currentlyWatching
      .filter((item) => item.series !== null)
      .map((item) => ({
        ...item,
        series: {
          ...item.series!,
          hasWatchableEpisode: item.series!.seasons.some((season) =>
            season.episodes.some(isWatchableEpisode)
          ),
        },
      }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching currently watching:', error);
    return NextResponse.json(
      { error: 'Error al obtener las series' },
      { status: 500 }
    );
  }
}
