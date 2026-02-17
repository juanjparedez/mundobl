import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requireRole } from '@/lib/auth-helpers';

// GET - Obtener todos los universos
export async function GET() {
  try {
    const universes = await prisma.universe.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { series: true },
        },
      },
    });

    return NextResponse.json(universes);
  } catch (error) {
    console.error('Error al obtener universos:', error);
    return NextResponse.json(
      { error: 'Error al obtener los universos' },
      { status: 500 }
    );
  }
}

// POST - Crear un nuevo universo
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireRole(['ADMIN', 'MODERATOR']);
    if (!authResult.authorized) return authResult.response;

    const body = await request.json();

    if (!body.name) {
      return NextResponse.json(
        { error: 'El nombre del universo es requerido' },
        { status: 400 }
      );
    }

    const universe = await prisma.universe.create({
      data: {
        name: body.name,
        description: body.description || null,
        imageUrl: body.imageUrl || null,
      },
    });

    return NextResponse.json(universe);
  } catch (error: unknown) {
    console.error('Error al crear universo:', error);

    // Error de duplicado (unique constraint)
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
      { error: 'Error al crear el universo' },
      { status: 500 }
    );
  }
}
