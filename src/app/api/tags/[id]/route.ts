import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PUT - Actualizar un tag
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const tagId = parseInt(id, 10);

    if (isNaN(tagId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const body = await request.json();

    if (!body.name?.trim()) {
      return NextResponse.json(
        { error: 'El nombre es requerido' },
        { status: 400 }
      );
    }

    const tag = await prisma.tag.update({
      where: { id: tagId },
      data: {
        name: body.name.trim(),
        category: body.category || undefined,
      },
    });

    return NextResponse.json(tag);
  } catch (error: unknown) {
    console.error('Error al actualizar tag:', error);

    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      return NextResponse.json(
        { error: 'Ya existe un tag con ese nombre' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error al actualizar el tag' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar un tag
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const tagId = parseInt(id, 10);

    if (isNaN(tagId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    await prisma.tag.delete({
      where: { id: tagId },
    });

    return NextResponse.json({ message: 'Tag eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar tag:', error);
    return NextResponse.json(
      { error: 'Error al eliminar el tag' },
      { status: 500 }
    );
  }
}
