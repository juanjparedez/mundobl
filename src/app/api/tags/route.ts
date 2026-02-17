import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requireRole } from '@/lib/auth-helpers';

// GET - Obtener todos los tags
export async function GET() {
  try {
    const tags = await prisma.tag.findMany({
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
      include: {
        _count: {
          select: { series: true },
        },
      },
    });

    return NextResponse.json(tags);
  } catch (error) {
    console.error('Error al obtener tags:', error);
    return NextResponse.json(
      { error: 'Error al obtener los tags' },
      { status: 500 }
    );
  }
}

// POST - Crear un nuevo tag
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireRole(['ADMIN', 'MODERATOR']);
    if (!authResult.authorized) return authResult.response;

    const body = await request.json();

    if (!body.name) {
      return NextResponse.json(
        { error: 'El nombre del tag es requerido' },
        { status: 400 }
      );
    }

    const tag = await prisma.tag.create({
      data: {
        name: body.name,
        category: body.category || 'trope',
      },
    });

    return NextResponse.json(tag);
  } catch (error: unknown) {
    console.error('Error al crear tag:', error);

    // Error de duplicado (unique constraint)
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      return NextResponse.json(
        { error: 'Ya existe un tag con ese nombre' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error al crear el tag' },
      { status: 500 }
    );
  }
}
