import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requireAuth } from '@/lib/auth-helpers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const seasonId = parseInt(resolvedParams.id, 10);

    if (isNaN(seasonId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const comments = await prisma.comment.findMany({
      where: { seasonId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error('Error fetching season comments:', error);
    return NextResponse.json(
      { error: 'Error al obtener comentarios' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth();
    if (!authResult.authorized) return authResult.response;

    const resolvedParams = await params;
    const seasonId = parseInt(resolvedParams.id, 10);

    if (isNaN(seasonId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const body = await request.json();
    const { content } = body;

    if (!content || content.trim() === '') {
      return NextResponse.json(
        { error: 'El contenido es requerido' },
        { status: 400 }
      );
    }

    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        seasonId,
        userId: authResult.userId,
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error('Error creating season comment:', error);
    return NextResponse.json(
      { error: 'Error al crear comentario' },
      { status: 500 }
    );
  }
}
