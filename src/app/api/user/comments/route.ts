import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@/generated/prisma';
import { prisma } from '@/lib/database';
import { requireAuth } from '@/lib/auth-helpers';

// GET /api/user/comments - lista comentarios del usuario autenticado
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (!authResult.authorized) return authResult.response;

    const { searchParams } = request.nextUrl;
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const pageSize = Math.min(
      Math.max(parseInt(searchParams.get('pageSize') || '20', 10), 1),
      100
    );
    const search = searchParams.get('q')?.trim();
    const visibility = searchParams.get('visibility');
    const target = searchParams.get('target');
    const reportedOnly = searchParams.get('reported') === 'true';

    const where: Prisma.CommentWhereInput = {
      userId: authResult.userId,
    };

    if (search) {
      where.content = { contains: search, mode: 'insensitive' };
    }

    if (visibility === 'public') {
      where.isPrivate = false;
    } else if (visibility === 'private') {
      where.isPrivate = true;
    }

    if (target === 'series') {
      where.seriesId = { not: null };
      where.seasonId = null;
      where.episodeId = null;
    } else if (target === 'season') {
      where.seasonId = { not: null };
      where.episodeId = null;
    } else if (target === 'episode') {
      where.episodeId = { not: null };
    }

    if (reportedOnly) {
      where.reportCount = { gt: 0 };
    }

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
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
      }),
      prisma.comment.count({ where }),
    ]);

    return NextResponse.json({ comments, total, page, pageSize });
  } catch (error) {
    console.error('Error fetching user comments:', error);
    return NextResponse.json(
      { error: 'Error al obtener tus comentarios' },
      { status: 500 }
    );
  }
}

// PATCH /api/user/comments - acciones masivas o edición de comentario propio
export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (!authResult.authorized) return authResult.response;

    const body = (await request.json().catch(() => ({}))) as {
      action?: string;
      ids?: unknown;
      isPrivate?: unknown;
      id?: unknown;
      content?: unknown;
    };

    if (body.action === 'setVisibility') {
      if (!Array.isArray(body.ids) || typeof body.isPrivate !== 'boolean') {
        return NextResponse.json(
          { error: 'Datos inválidos para actualizar visibilidad' },
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
          { error: 'No hay IDs válidos para actualizar' },
          { status: 400 }
        );
      }

      const result = await prisma.comment.updateMany({
        where: {
          id: { in: ids },
          userId: authResult.userId,
        },
        data: { isPrivate: body.isPrivate },
      });

      return NextResponse.json({ success: true, updated: result.count });
    }

    if (body.action === 'updateContent') {
      if (
        typeof body.id !== 'number' ||
        !Number.isInteger(body.id) ||
        body.id <= 0
      ) {
        return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
      }

      if (typeof body.content !== 'string') {
        return NextResponse.json(
          { error: 'El contenido es requerido' },
          { status: 400 }
        );
      }

      const content = body.content.trim();
      if (!content) {
        return NextResponse.json(
          { error: 'El contenido no puede estar vacío' },
          { status: 400 }
        );
      }

      if (content.length > 2000) {
        return NextResponse.json(
          { error: 'El comentario no puede superar 2000 caracteres' },
          { status: 400 }
        );
      }

      const existing = await prisma.comment.findUnique({
        where: { id: body.id },
        select: { id: true, userId: true },
      });

      if (!existing || existing.userId !== authResult.userId) {
        return NextResponse.json(
          { error: 'Comentario no encontrado' },
          { status: 404 }
        );
      }

      const updatedComment = await prisma.comment.update({
        where: { id: body.id },
        data: { content },
      });

      return NextResponse.json({ success: true, comment: updatedComment });
    }

    return NextResponse.json({ error: 'Acción no soportada' }, { status: 400 });
  } catch (error) {
    console.error('Error updating user comments:', error);
    return NextResponse.json(
      { error: 'Error al actualizar comentarios' },
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
