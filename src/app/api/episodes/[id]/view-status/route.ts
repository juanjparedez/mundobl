import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST/PUT - Marcar episodio como visto/no visto
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const episodeId = parseInt(id, 10);

    if (isNaN(episodeId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const body = await request.json();
    const { watched } = body;

    // Verificar que el episodio existe
    const episode = await prisma.episode.findUnique({
      where: { id: episodeId },
    });

    if (!episode) {
      return NextResponse.json(
        { error: 'Episodio no encontrado' },
        { status: 404 }
      );
    }

    // Crear o actualizar el estado de visualización
    const viewStatus = await prisma.viewStatus.upsert({
      where: { episodeId },
      update: {
        watched,
        watchedDate: watched ? new Date() : null,
      },
      create: {
        episodeId,
        watched,
        watchedDate: watched ? new Date() : null,
      },
    });

    return NextResponse.json(viewStatus);
  } catch (error) {
    console.error('Error al actualizar estado de visualización:', error);
    return NextResponse.json(
      { error: 'Error al actualizar el estado' },
      { status: 500 }
    );
  }
}

// GET - Obtener estado de visualización de un episodio
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const episodeId = parseInt(id, 10);

    if (isNaN(episodeId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const viewStatus = await prisma.viewStatus.findUnique({
      where: { episodeId },
    });

    return NextResponse.json(viewStatus || { watched: false });
  } catch (error) {
    console.error('Error al obtener estado de visualización:', error);
    return NextResponse.json(
      { error: 'Error al obtener el estado' },
      { status: 500 }
    );
  }
}
