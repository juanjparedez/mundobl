import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Obtener un universo específico con sus series
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const universeId = parseInt(id, 10);

    if (isNaN(universeId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const universe = await prisma.universe.findUnique({
      where: { id: universeId },
      include: {
        series: {
          select: {
            id: true,
            title: true,
            year: true,
            type: true,
            imageUrl: true,
          },
          orderBy: { year: 'asc' },
        },
      },
    });

    if (!universe) {
      return NextResponse.json(
        { error: 'Universo no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(universe);
  } catch (error) {
    console.error('Error al obtener universo:', error);
    return NextResponse.json(
      { error: 'Error al obtener el universo' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar un universo
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const universeId = parseInt(id, 10);

    if (isNaN(universeId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const body = await request.json();

    if (!body.name) {
      return NextResponse.json(
        { error: 'El nombre del universo es requerido' },
        { status: 400 }
      );
    }

    const universe = await prisma.universe.update({
      where: { id: universeId },
      data: {
        name: body.name,
        description: body.description || null,
        imageUrl: body.imageUrl || null,
      },
    });

    return NextResponse.json(universe);
  } catch (error: unknown) {
    console.error('Error al actualizar universo:', error);

    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      return NextResponse.json(
        { error: 'Ya existe un universo con ese nombre' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error al actualizar el universo' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar un universo
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const universeId = parseInt(id, 10);

    if (isNaN(universeId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    // Verificar si tiene series asociadas
    const universe = await prisma.universe.findUnique({
      where: { id: universeId },
      include: {
        _count: {
          select: { series: true },
        },
      },
    });

    if (!universe) {
      return NextResponse.json(
        { error: 'Universo no encontrado' },
        { status: 404 }
      );
    }

    if (universe._count.series > 0) {
      return NextResponse.json(
        {
          error: `No se puede eliminar. Tiene ${universe._count.series} series asociadas`,
        },
        { status: 400 }
      );
    }

    await prisma.universe.delete({
      where: { id: universeId },
    });

    return NextResponse.json({ message: 'Universo eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar universo:', error);
    return NextResponse.json(
      { error: 'Error al eliminar el universo' },
      { status: 500 }
    );
  }
}
