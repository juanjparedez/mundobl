import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@/generated/prisma';
import { prisma } from '@/lib/database';
import { requireAuth } from '@/lib/auth-helpers';

// POST /api/comments/[id]/report — usuario logueado reporta un comentario (1 vez)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth();
    if (!authResult.authorized) return authResult.response;

    const { id } = await params;
    const commentId = parseInt(id, 10);
    if (isNaN(commentId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const reason: string | null =
      typeof body?.reason === 'string' && body.reason.trim()
        ? body.reason.trim().slice(0, 500)
        : null;

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true, isPrivate: true, userId: true },
    });
    if (!comment) {
      return NextResponse.json(
        { error: 'Comentario no encontrado' },
        { status: 404 }
      );
    }
    if (comment.isPrivate) {
      return NextResponse.json(
        { error: 'No se puede reportar un comentario privado' },
        { status: 400 }
      );
    }
    if (comment.userId === authResult.userId) {
      return NextResponse.json(
        { error: 'No podés reportar tu propio comentario' },
        { status: 400 }
      );
    }

    try {
      await prisma.$transaction([
        prisma.commentReport.create({
          data: {
            commentId,
            userId: authResult.userId,
            reason,
          },
        }),
        prisma.comment.update({
          where: { id: commentId },
          data: {
            reportCount: { increment: 1 },
            reportedAt: new Date(),
          },
        }),
      ]);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        return NextResponse.json(
          { error: 'Ya reportaste este comentario' },
          { status: 409 }
        );
      }
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reporting comment:', error);
    return NextResponse.json(
      { error: 'Error al reportar comentario' },
      { status: 500 }
    );
  }
}
