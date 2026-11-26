import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/database';
import { requireRole } from '@/lib/auth-helpers';
import { atomicWrite } from '@/lib/d1';
import { logAction } from '@/lib/access-log';

// POST /api/admin/comments/[id]/dismiss-reports — admin descarta reportes
// borra los CommentReport del comentario y resetea reportCount/reportedAt
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireRole(['ADMIN']);
    if (!authResult.authorized) return authResult.response;

    const { id } = await params;
    const commentId = parseInt(id, 10);
    if (isNaN(commentId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true },
    });
    if (!comment) {
      return NextResponse.json(
        { error: 'Comentario no encontrado' },
        { status: 404 }
      );
    }

    // Both or neither: the counter must match the reports left.
    await atomicWrite([
      Prisma.sql`DELETE FROM "CommentReport" WHERE "commentId" = ${commentId}`,
      Prisma.sql`UPDATE "Comment" SET "reportCount" = 0, "reportedAt" = NULL,
        "updatedAt" = ${new Date()} WHERE id = ${commentId}`,
    ]);

    logAction('UPDATE', request.nextUrl.pathname, 'POST', authResult.userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error dismissing comment reports:', error);
    return NextResponse.json(
      { error: 'Error al descartar reportes' },
      { status: 500 }
    );
  }
}
