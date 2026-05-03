import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requireAuth } from '@/lib/auth-helpers';
import { auth } from '@/lib/auth';
import { notifyParticipantsOfNewComment } from '@/lib/notifications';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const currentUserId = session?.user?.id;

    const { id } = await params;
    const seriesId = parseInt(id, 10);
    if (isNaN(seriesId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const comments = await prisma.comment.findMany({
      where: {
        seriesId,
        OR: [
          { isPrivate: false },
          ...(currentUserId
            ? [{ isPrivate: true, userId: currentUserId }]
            : []),
        ],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error('Error fetching series comments:', error);
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
    const seriesId = parseInt(resolvedParams.id, 10);
    const body = await request.json();
    const { content, isPrivate } = body;

    if (!content || typeof content !== 'string' || content.trim() === '') {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      );
    }

    const comment = await prisma.comment.create({
      data: {
        seriesId,
        content: content.trim(),
        isPrivate: isPrivate === true,
        userId: authResult.userId,
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
    });

    // Avisar a otros usuarios que comentaron antes en esta misma serie
    // (solo si el nuevo comentario es público — los privados no notifican).
    if (!comment.isPrivate) {
      void notifyParticipantsOfNewComment({
        currentCommentId: comment.id,
        currentUserId: authResult.userId,
        target: { seriesId },
        seriesIdForLink: seriesId,
        excerpt: content.trim().slice(0, 80),
      });
    }

    return NextResponse.json(comment);
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}
