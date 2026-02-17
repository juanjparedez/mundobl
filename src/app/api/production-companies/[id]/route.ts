import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const companyId = parseInt(id, 10);

    if (isNaN(companyId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const body = await request.json();

    if (!body.name?.trim()) {
      return NextResponse.json(
        { error: 'El nombre es requerido' },
        { status: 400 }
      );
    }

    const company = await prisma.productionCompany.update({
      where: { id: companyId },
      data: {
        name: body.name.trim(),
        country: body.country || null,
      },
    });

    return NextResponse.json(company);
  } catch (error: unknown) {
    console.error('Error al actualizar productora:', error);

    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      return NextResponse.json(
        { error: 'Ya existe una productora con ese nombre' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error al actualizar la productora' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const companyId = parseInt(id, 10);

    if (isNaN(companyId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    await prisma.productionCompany.delete({
      where: { id: companyId },
    });

    return NextResponse.json({ message: 'Productora eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar productora:', error);
    return NextResponse.json(
      { error: 'Error al eliminar la productora' },
      { status: 500 }
    );
  }
}
