import { NextRequest, NextResponse } from 'next/server';
import { getDirectorById, prisma } from '@/lib/database';
import { requireRole } from '@/lib/auth-helpers';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const directorId = parseInt(id, 10);

    if (isNaN(directorId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const director = await getDirectorById(directorId);

    if (!director) {
      return NextResponse.json(
        { error: 'Director no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(director);
  } catch (error) {
    console.error('Error al obtener director:', error);
    return NextResponse.json(
      { error: 'Error al obtener el director' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireRole(['ADMIN', 'MODERATOR']);
    if (!authResult.authorized) return authResult.response;

    const { id } = await params;
    const directorId = parseInt(id, 10);

    if (isNaN(directorId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const body = await request.json();

    if (!body.name) {
      return NextResponse.json(
        { error: 'El nombre del director es requerido' },
        { status: 400 }
      );
    }

    const director = await prisma.director.update({
      where: { id: directorId },
      data: {
        name: body.name,
        nationality: body.nationality || null,
        imageUrl: body.imageUrl || null,
        biography: body.biography || null,
      },
    });

    return NextResponse.json(director);
  } catch (error: unknown) {
    console.error('Error al actualizar director:', error);

    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      return NextResponse.json(
        { error: 'Ya existe un director con ese nombre' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error al actualizar el director' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireRole(['ADMIN']);
    if (!authResult.authorized) return authResult.response;

    const { id } = await params;
    const directorId = parseInt(id, 10);

    if (isNaN(directorId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const director = await prisma.director.findUnique({
      where: { id: directorId },
      include: {
        _count: { select: { series: true } },
      },
    });

    if (!director) {
      return NextResponse.json(
        { error: 'Director no encontrado' },
        { status: 404 }
      );
    }

    if (director._count.series > 0) {
      return NextResponse.json(
        {
          error: `No se puede eliminar. Tiene ${director._count.series} series asociadas`,
        },
        { status: 400 }
      );
    }

    await prisma.director.delete({ where: { id: directorId } });

    return NextResponse.json({
      message: 'Director eliminado correctamente',
    });
  } catch (error) {
    console.error('Error al eliminar director:', error);
    return NextResponse.json(
      { error: 'Error al eliminar el director' },
      { status: 500 }
    );
  }
}
