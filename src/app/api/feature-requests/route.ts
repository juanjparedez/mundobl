import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requireAuth } from '@/lib/auth-helpers';

// GET /api/feature-requests — público, lista todos con conteo de votos
export async function GET() {
  try {
    const requests = await prisma.featureRequest.findMany({
      include: {
        user: { select: { id: true, name: true, image: true } },
        _count: { select: { votes: true } },
        votes: { select: { userId: true } },
        images: { select: { id: true, url: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error('Error fetching feature requests:', error);
    return NextResponse.json(
      { error: 'Error al obtener las solicitudes' },
      { status: 500 }
    );
  }
}

// POST /api/feature-requests — autenticado, crear nuevo
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (!authResult.authorized) return authResult.response;

    const body = await request.json();
    const { title, description, type, imageUrls } = body as {
      title: string;
      description?: string;
      type: string;
      imageUrls?: string[];
    };

    if (!title || !type) {
      return NextResponse.json(
        { error: 'Título y tipo son requeridos' },
        { status: 400 }
      );
    }

    const validTypes = ['bug', 'feature', 'idea'];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'Tipo no válido' }, { status: 400 });
    }

    const featureRequest = await prisma.featureRequest.create({
      data: {
        title,
        description: description || null,
        type,
        userId: authResult.userId,
        images:
          imageUrls && imageUrls.length > 0
            ? { create: imageUrls.map((url) => ({ url })) }
            : undefined,
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
        _count: { select: { votes: true } },
        votes: { select: { userId: true } },
        images: { select: { id: true, url: true } },
      },
    });

    return NextResponse.json(featureRequest, { status: 201 });
  } catch (error) {
    console.error('Error creating feature request:', error);
    return NextResponse.json(
      { error: 'Error al crear la solicitud' },
      { status: 500 }
    );
  }
}
