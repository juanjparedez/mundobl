import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requireRole } from '@/lib/auth-helpers';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireRole(['ADMIN']);
    if (!authResult.authorized) return authResult.response;

    const { id } = await params;
    const siteId = parseInt(id, 10);

    if (isNaN(siteId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const body = await request.json();

    if (!body.name?.trim() || !body.url?.trim()) {
      return NextResponse.json(
        { error: 'El nombre y la URL son requeridos' },
        { status: 400 }
      );
    }

    const site = await prisma.recommendedSite.update({
      where: { id: siteId },
      data: {
        name: body.name.trim(),
        url: body.url.trim(),
        description: body.description?.trim() || null,
        category: body.category || null,
        language: body.language || null,
        imageUrl: body.imageUrl?.trim() || null,
        sortOrder: body.sortOrder ?? 0,
      },
    });

    return NextResponse.json(site);
  } catch (error) {
    console.error('Error al actualizar sitio:', error);
    return NextResponse.json(
      { error: 'Error al actualizar el sitio' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireRole(['ADMIN']);
    if (!authResult.authorized) return authResult.response;

    const { id } = await params;
    const siteId = parseInt(id, 10);

    if (isNaN(siteId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    await prisma.recommendedSite.delete({
      where: { id: siteId },
    });

    return NextResponse.json({ message: 'Sitio eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar sitio:', error);
    return NextResponse.json(
      { error: 'Error al eliminar el sitio' },
      { status: 500 }
    );
  }
}
