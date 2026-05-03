import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requireAuth } from '@/lib/auth-helpers';

// GET /api/user/comments - lista comentarios del usuario autenticado
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (!authResult.authorized) return authResult.response;

    const limit = Math.min(
      Math.max(parseInt(request.nextUrl.searchParams.get('limit') || '100', 10), 1),
      200
    );

    const comments = await prisma.comment.findMany({
      where: { userId: authResult.userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        series: { select: { id: true, title: true } },
        season: {
          select: {
            id: true,
            seasonNumber: true,
            series: { select: { id: true, title: true } },
          },
        },
        episode: {
          select: {
            id: true,
            episodeNumber: true,
            season: {
              select: {
                seasonNumber: true,
                series: { select: { id: true, title: true } },
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ comments });
  } catch (error) {
    console.error('Error fetching user comments:', error);
    return NextResponse.json(
      { error: 'Error al obtener tus comentarios' },
      { status: 500 }
    );
  }
}

// DELETE /api/user/comments - borra comentarios propios en lote
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (!authResult.authorized) return authResult.response;

    const body = (await request.json().catch(() => ({}))) as { ids?: unknown };
    if (!Array.isArray(body.ids)) {
      return NextResponse.json(
        { error: 'Se requiere un array de IDs' },
        { status: 400 }
      );
    }

    const ids = Array.from(
      new Set(
        body.ids.filter(
          (id): id is number =>
            typeof id === 'number' && Number.isInteger(id) && id > 0
        )
      )
    );

    if (ids.length === 0) {
      return NextResponse.json(
        { error: 'No hay IDs válidos para eliminar' },
        { status: 400 }
      );
    }

    if (ids.length > 200) {
      return NextResponse.json(
        { error: 'Máximo 200 comentarios por operación' },
        { status: 400 }
      );
    }

    const result = await prisma.comment.deleteMany({
      where: {
        id: { in: ids },
        userId: authResult.userId,
      },
    });

    return NextResponse.json({ success: true, deleted: result.count });
  } catch (error) {
    console.error('Error deleting user comments:', error);
    return NextResponse.json(
      { error: 'Error al eliminar tus comentarios' },
      { status: 500 }
    );
  }
}
