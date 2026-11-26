import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/database';
import { requireAuth } from '@/lib/auth-helpers';
import { atomicWrite } from '@/lib/d1';
import { isUniqueViolation } from '@/lib/create-many';

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
      const now = new Date();
      // Both or neither: a duplicate report must not bump the counter.
      await atomicWrite([
        Prisma.sql`INSERT INTO "CommentReport" ("commentId", "userId", "reason", "createdAt")
          VALUES (${commentId}, ${authResult.userId}, ${reason ?? null}, ${now})`,
        Prisma.sql`UPDATE "Comment" SET "reportCount" = "reportCount" + 1,
          "reportedAt" = ${now}, "updatedAt" = ${now} WHERE id = ${commentId}`,
      ]);
    } catch (error) {
      if (isUniqueViolation(error)) {
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
