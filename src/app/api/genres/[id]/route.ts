import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requireRole } from '@/lib/auth-helpers';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PUT - Actualizar un género
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireRole(['ADMIN', 'MODERATOR']);
    if (!authResult.authorized) return authResult.response;

    const { id } = await params;
    const genreId = parseInt(id, 10);

    if (isNaN(genreId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const body = await request.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';

    if (!name) {
      return NextResponse.json(
        { error: 'El nombre es requerido' },
        { status: 400 }
      );
    }

    // Comprobar si ya existe otro género con el mismo nombre (case-insensitive)
    const existing = await prisma.genre.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
        NOT: { id: genreId },
      },
    });
    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe un género con ese nombre' },
        { status: 400 }
      );
    }

    const genre = await prisma.genre.update({
      where: { id: genreId },
      data: { name },
    });

    return NextResponse.json(genre);
  } catch (error: unknown) {
    console.error('Error al actualizar género:', error);

    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      return NextResponse.json(
        { error: 'Ya existe un género con ese nombre' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error al actualizar el género' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar un género
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireRole(['ADMIN']);
    if (!authResult.authorized) return authResult.response;

    const { id } = await params;
    const genreId = parseInt(id, 10);

    if (isNaN(genreId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    await prisma.genre.delete({
      where: { id: genreId },
    });

    return NextResponse.json({ message: 'Género eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar género:', error);
    return NextResponse.json(
      { error: 'Error al eliminar el género' },
      { status: 500 }
    );
  }
}
