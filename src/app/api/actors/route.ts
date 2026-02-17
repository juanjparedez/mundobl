import { NextRequest, NextResponse } from 'next/server';
import { getAllActorsWithCount, prisma } from '@/lib/database';

export async function GET() {
  try {
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
