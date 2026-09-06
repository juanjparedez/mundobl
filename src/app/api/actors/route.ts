import { NextRequest, NextResponse } from 'next/server';
import { getAllActorsWithCount, prisma } from '@/lib/database';
import { requireRole } from '@/lib/auth-helpers';

export async function GET(request: NextRequest) {
  try {
    // SeriesForm/SeasonForm piden esto solo para armar la lista de nombres
    // del AutoComplete de reparto — no necesitan biografia, funFacts, imagen
    // ni el `_count` de cada uno de los ~1190 actores. `/admin/actores` (la
    // tabla real) sigue pidiendo el shape completo sin el query param.
    const namesOnly = request.nextUrl.searchParams.get('namesOnly') === '1';
    if (namesOnly) {
      const actors = await prisma.actor.findMany({
        where: { isPlaceholder: false },
        select: { name: true },
        orderBy: { name: 'asc' },
      });
      return NextResponse.json(actors);
    }

    const actors = await getAllActorsWithCount();
    return NextResponse.json(actors);
  } catch (error) {
    console.error('Error fetching actors:', error);
    return NextResponse.json(
      { error: 'Error al obtener actores' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireRole(['ADMIN', 'MODERATOR']);
    if (!authResult.authorized) return authResult.response;

    const body = await request.json();

    if (!body.name) {
      return NextResponse.json(
        { error: 'El nombre del actor es requerido' },
        { status: 400 }
      );
    }

    const actor = await prisma.actor.create({
      data: {
        name: body.name,
        stageName: body.stageName || null,
        birthDate: body.birthDate ? new Date(body.birthDate) : null,
        nationality: body.nationality || null,
        imageUrl: body.imageUrl || null,
        biography: body.biography || null,
        funFacts: Array.isArray(body.funFacts) ? body.funFacts : [],
      },
    });

    return NextResponse.json(actor, { status: 201 });
  } catch (error: unknown) {
    console.error('Error al crear actor:', error);

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
      { error: 'Error al crear el actor' },
      { status: 500 }
    );
  }
}
