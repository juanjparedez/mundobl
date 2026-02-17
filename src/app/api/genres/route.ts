import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';

export async function GET() {
  try {
    const genres = await prisma.genre.findMany({
      include: {
        _count: { select: { series: true } },
      },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(genres);
  } catch (error) {
    console.error('Error fetching genres:', error);
    return NextResponse.json(
      { error: 'Error al obtener géneros' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.name?.trim()) {
      return NextResponse.json(
        { error: 'El nombre del género es requerido' },
        { status: 400 }
      );
    }

    const genre = await prisma.genre.create({
      data: {
        name: body.name.trim(),
      },
    });

    return NextResponse.json(genre, { status: 201 });
  } catch (error: unknown) {
    console.error('Error al crear género:', error);

    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      return NextResponse.json(
        { error: 'Ya existe un género con ese nombre' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error al crear el género' },
      { status: 500 }
    );
  }
}
