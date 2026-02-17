import { NextRequest, NextResponse } from 'next/server';
import { getAllDirectorsWithCount, prisma } from '@/lib/database';

export async function GET() {
  try {
    const directors = await getAllDirectorsWithCount();
    return NextResponse.json(directors);
  } catch (error) {
    console.error('Error fetching directors:', error);
    return NextResponse.json(
      { error: 'Error al obtener directores' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.name) {
      return NextResponse.json(
        { error: 'El nombre del director es requerido' },
        { status: 400 }
      );
    }

    const director = await prisma.director.create({
      data: {
        name: body.name,
        nationality: body.nationality || null,
        imageUrl: body.imageUrl || null,
        biography: body.biography || null,
      },
    });

    return NextResponse.json(director, { status: 201 });
  } catch (error: unknown) {
    console.error('Error al crear director:', error);

    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      return NextResponse.json(
        { error: 'Ya existe un director con ese nombre' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error al crear el director' },
      { status: 500 }
    );
  }
}
