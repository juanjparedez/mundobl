import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requireAuth } from '@/lib/auth-helpers';

// GET - Obtener sitios sugeridos aprobados (público)
export async function GET() {
  try {
    const suggestions = await prisma.suggestedSite.findMany({
      where: { status: 'aprobado' },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(suggestions);
  } catch (error) {
    console.error('Error fetching approved suggestions:', error);
    return NextResponse.json(
      { error: 'Error al obtener sugerencias' },
      { status: 500 }
    );
  }
}

// POST - Crear una nueva sugerencia (requiere autenticación)
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (!authResult.authorized) return authResult.response;

    const body = await request.json();
    const { name, url, description, category, language } = body;

    if (!name || !url) {
      return NextResponse.json(
        { error: 'Nombre y URL son requeridos' },
        { status: 400 }
      );
    }

    // Validar URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: 'URL no válida' }, { status: 400 });
    }

    const suggestion = await prisma.suggestedSite.create({
      data: {
        name,
        url,
        description: description || null,
        category: category || null,
        language: language || null,
        status: 'pendiente',
        userId: authResult.userId,
      },
    });

    return NextResponse.json(suggestion, { status: 201 });
  } catch (error) {
    console.error('Error creating suggestion:', error);
    return NextResponse.json(
      { error: 'Error al crear la sugerencia' },
      { status: 500 }
    );
  }
}
