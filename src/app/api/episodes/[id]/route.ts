import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requireRole } from '@/lib/auth-helpers';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Obtener un episodio específico
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const episodeId = parseInt(id, 10);

    if (isNaN(episodeId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const episode = await prisma.episode.findUnique({
      where: { id: episodeId },
      include: {
        season: {
          include: {
            series: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    });

    if (!episode) {
      return NextResponse.json(
        { error: 'Episodio no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(episode);
  } catch (error) {
    console.error('Error al obtener episodio:', error);
    return NextResponse.json(
      { error: 'Error al obtener el episodio' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar un episodio
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireRole(['ADMIN', 'MODERATOR']);
    if (!authResult.authorized) return authResult.response;

    const { id } = await params;
    const episodeId = parseInt(id, 10);

    if (isNaN(episodeId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const body = await request.json();

    const episode = await prisma.episode.update({
      where: { id: episodeId },
      data: {
        title: body.title || null,
        episodeNumber: body.episodeNumber,
        duration: body.duration || null,
        airDate: body.airDate ? new Date(body.airDate) : null,
        synopsis: body.synopsis || null,
      },
    });

    return NextResponse.json(episode);
  } catch (error: unknown) {
    console.error('Error al actualizar episodio:', error);

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
      { error: 'Error al actualizar el episodio' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar un episodio
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireRole(['ADMIN']);
    if (!authResult.authorized) return authResult.response;

    const { id } = await params;
    const episodeId = parseInt(id, 10);

    if (isNaN(episodeId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    await prisma.episode.delete({
      where: { id: episodeId },
    });

    return NextResponse.json({ message: 'Episodio eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar episodio:', error);
    return NextResponse.json(
      { error: 'Error al eliminar el episodio' },
      { status: 500 }
    );
  }
}
