import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requireRole } from '@/lib/auth-helpers';

// POST - Generar episodios vacíos para una temporada
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireRole(['ADMIN', 'MODERATOR']);
    if (!authResult.authorized) return authResult.response;

    const { seasonId } = await request.json();

    if (!seasonId) {
      return NextResponse.json(
        { error: 'seasonId es requerido' },
        { status: 400 }
      );
    }

    const season = await prisma.season.findUnique({
      where: { id: seasonId },
      select: { episodeCount: true },
    });

    if (!season || !season.episodeCount) {
      return NextResponse.json(
        { error: 'La temporada no tiene un número de episodios definido' },
        { status: 400 }
      );
    }

    // Obtener episodios existentes
    const existingEpisodes = await prisma.episode.findMany({
      where: { seasonId },
      select: { episodeNumber: true },
    });

    const existingNumbers = new Set(
      existingEpisodes.map((e) => e.episodeNumber)
    );

    // Crear los que faltan
    const episodesToCreate = [];
    for (let i = 1; i <= season.episodeCount; i++) {
      if (!existingNumbers.has(i)) {
        episodesToCreate.push({
          seasonId,
          episodeNumber: i,
        });
      }
    }

    if (episodesToCreate.length === 0) {
      // Retornar los episodios existentes
      const allEpisodes = await prisma.episode.findMany({
        where: { seasonId },
        orderBy: { episodeNumber: 'asc' },
        include: {
          viewStatus: true,
          comments: { orderBy: { createdAt: 'desc' } },
        },
      });
      return NextResponse.json({
        episodes: allEpisodes,
        created: 0,
        message: 'Todos los episodios ya existen',
      });
    }

    await prisma.episode.createMany({
      data: episodesToCreate,
    });

    // Retornar todos los episodios actualizados
    const allEpisodes = await prisma.episode.findMany({
      where: { seasonId },
      orderBy: { episodeNumber: 'asc' },
      include: {
        viewStatus: true,
        comments: { orderBy: { createdAt: 'desc' } },
      },
    });

    return NextResponse.json({
      episodes: allEpisodes,
      created: episodesToCreate.length,
      message: `${episodesToCreate.length} episodios generados`,
    });
  } catch (error) {
    console.error('Error generating episodes:', error);
    return NextResponse.json(
      { error: 'Error al generar episodios' },
      { status: 500 }
    );
  }
}
