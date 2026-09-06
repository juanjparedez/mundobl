import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requireRole } from '@/lib/auth-helpers';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireRole(['ADMIN', 'MODERATOR']);
    if (!authResult.authorized) return authResult.response;

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
    const authResult = await requireRole(['ADMIN']);
    if (!authResult.authorized) return authResult.response;

    const { id } = await params;
    const companyId = parseInt(id, 10);

    if (isNaN(companyId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    // Guarda de uso, igual que actores y directores. Sin esto el borrado
    // "funcionaba" y dejaba las series sin productora en silencio: la FK
    // Series.productionCompanyId es opcional, asi que Postgres la pone en NULL.
    const company = await prisma.productionCompany.findUnique({
      where: { id: companyId },
      include: {
        _count: { select: { series: true, seriesLinks: true } },
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Productora no encontrada' },
        { status: 404 }
      );
    }

    const usedBy = Math.max(company._count.series, company._count.seriesLinks);
    if (usedBy > 0) {
      return NextResponse.json(
        {
          error: `No se puede eliminar. Tiene ${usedBy} series asociadas`,
        },
        { status: 400 }
      );
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
