import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const languageId = parseInt(id, 10);

    if (isNaN(languageId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const body = await request.json();

    if (!body.name?.trim()) {
      return NextResponse.json(
        { error: 'El nombre es requerido' },
        { status: 400 }
      );
    }

    const language = await prisma.language.update({
      where: { id: languageId },
      data: {
        name: body.name.trim(),
        code: body.code || null,
      },
    });

    return NextResponse.json(language);
  } catch (error: unknown) {
    console.error('Error al actualizar idioma:', error);

    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      return NextResponse.json(
        { error: 'Ya existe un idioma con ese nombre' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error al actualizar el idioma' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const languageId = parseInt(id, 10);

    if (isNaN(languageId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    await prisma.language.delete({
      where: { id: languageId },
    });

    return NextResponse.json({ message: 'Idioma eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar idioma:', error);
    return NextResponse.json(
      { error: 'Error al eliminar el idioma' },
      { status: 500 }
    );
  }
}
