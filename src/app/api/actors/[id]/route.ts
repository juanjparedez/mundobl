import { NextRequest, NextResponse } from 'next/server';
import { getActorById, prisma } from '@/lib/database';
import { requireRole } from '@/lib/auth-helpers';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const actorId = parseInt(id, 10);

    if (isNaN(actorId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const actor = await getActorById(actorId);

    if (!actor) {
      return NextResponse.json(
        { error: 'Actor no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(actor);
  } catch (error) {
    console.error('Error al obtener actor:', error);
    return NextResponse.json(
      { error: 'Error al obtener el actor' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireRole(['ADMIN', 'MODERATOR']);
    if (!authResult.authorized) return authResult.response;

    const { id } = await params;
    const actorId = parseInt(id, 10);

    if (isNaN(actorId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const body = await request.json();

    if (!body.name) {
      return NextResponse.json(
        { error: 'El nombre del actor es requerido' },
        { status: 400 }
      );
    }

    const actor = await prisma.actor.update({
      where: { id: actorId },
      data: {
        name: body.name,
        stageName: body.stageName || null,
        birthDate: body.birthDate ? new Date(body.birthDate) : null,
        nationality: body.nationality || null,
        imageUrl: body.imageUrl || null,
        biography: body.biography || null,
      },
    });

    return NextResponse.json(actor);
  } catch (error: unknown) {
    console.error('Error al actualizar actor:', error);

    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      return NextResponse.json(
        { error: 'Ya existe un actor con ese nombre' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error al actualizar el actor' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireRole(['ADMIN']);
    if (!authResult.authorized) return authResult.response;

    const { id } = await params;
    const actorId = parseInt(id, 10);

    if (isNaN(actorId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const actor = await prisma.actor.findUnique({
      where: { id: actorId },
      include: {
        _count: { select: { series: true, seasons: true } },
      },
    });

    if (!actor) {
      return NextResponse.json(
        { error: 'Actor no encontrado' },
        { status: 404 }
      );
    }

    const totalRelations = actor._count.series + actor._count.seasons;
    if (totalRelations > 0) {
      return NextResponse.json(
        {
          error: `No se puede eliminar. Tiene ${actor._count.series} series y ${actor._count.seasons} temporadas asociadas`,
        },
        { status: 400 }
      );
    }

    await prisma.actor.delete({ where: { id: actorId } });

    return NextResponse.json({ message: 'Actor eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar actor:', error);
    return NextResponse.json(
      { error: 'Error al eliminar el actor' },
      { status: 500 }
    );
  }
}
