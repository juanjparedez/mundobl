import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requireRole } from '@/lib/auth-helpers';

// POST /api/admin/comments/[id]/dismiss-reports — admin descarta reportes
// borra los CommentReport del comentario y resetea reportCount/reportedAt
export async function POST(
  _request: NextRequest,
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

    await prisma.$transaction([
      prisma.commentReport.deleteMany({ where: { commentId } }),
      prisma.comment.update({
        where: { id: commentId },
        data: { reportCount: 0, reportedAt: null },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error dismissing comment reports:', error);
    return NextResponse.json(
      { error: 'Error al descartar reportes' },
      { status: 500 }
    );
  }
}
