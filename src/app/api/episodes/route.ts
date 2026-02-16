import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';

// GET - Obtener episodios de una temporada
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const seasonId = searchParams.get('seasonId');

    if (!seasonId) {
      return NextResponse.json(
        { error: 'seasonId es requerido' },
        { status: 400 }
      );
    }

    const episodes = await prisma.episode.findMany({
      where: { seasonId: parseInt(seasonId, 10) },
      orderBy: { episodeNumber: 'asc' },
    });

    return NextResponse.json(episodes);
  } catch (error) {
    console.error('Error al obtener episodios:', error);
    return NextResponse.json(
      { error: 'Error al obtener los episodios' },
      { status: 500 }
    );
  }
}

// POST - Crear un nuevo episodio
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.seasonId || !body.episodeNumber) {
      return NextResponse.json(
        { error: 'seasonId y episodeNumber son requeridos' },
        { status: 400 }
      );
    }

    const episode = await prisma.episode.create({
      data: {
        seasonId: body.seasonId,
        episodeNumber: body.episodeNumber,
        title: body.title || null,
        duration: body.duration || null,
        airDate: body.airDate ? new Date(body.airDate) : null,
        synopsis: body.synopsis || null,
      },
    });

    return NextResponse.json(episode);
  } catch (error: unknown) {
    console.error('Error al crear episodio:', error);

    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      return NextResponse.json(
        { error: 'Ya existe un episodio con ese número en esta temporada' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error al crear el episodio' },
      { status: 500 }
    );
  }
}
