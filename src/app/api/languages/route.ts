import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requireRole } from '@/lib/auth-helpers';

export async function GET() {
  try {
    const languages = await prisma.language.findMany({
      include: {
        _count: {
          select: {
            seriesOriginalLanguage: true,
            dubbings: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(languages);
  } catch (error) {
    console.error('Error fetching languages:', error);
    return NextResponse.json(
      { error: 'Error al obtener idiomas' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireRole(['ADMIN', 'MODERATOR']);
    if (!authResult.authorized) return authResult.response;

    const body = await request.json();

    if (!body.name?.trim()) {
      return NextResponse.json(
        { error: 'El nombre del idioma es requerido' },
        { status: 400 }
      );
    }

    const language = await prisma.language.create({
      data: {
        name: body.name.trim(),
        code: body.code || null,
      },
    });

    return NextResponse.json(language, { status: 201 });
  } catch (error: unknown) {
    console.error('Error al crear idioma:', error);

    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      return NextResponse.json(
        { error: 'Ya existe un idioma con ese nombre' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error al crear el idioma' },
      { status: 500 }
    );
  }
}
