import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requireAuth } from '@/lib/auth-helpers';
import { checkCommentRateLimit } from '@/lib/rate-limit';
import { auth } from '@/lib/auth';
import {
  notifyParticipantsOfNewComment,
  notifyAdminsOfNewComment,
  notifyParentAuthorOfReply,
} from '@/lib/notifications';
import { formatPublicName } from '@/lib/user-display';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const currentUserId = session?.user?.id;
    const isAdminOrMod =
      session?.user?.role === 'ADMIN' || session?.user?.role === 'MODERATOR';

    const { id } = await params;
    const seriesId = parseInt(id, 10);
    if (isNaN(seriesId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const comments = await prisma.comment.findMany({
      where: {
        seriesId,
        parentId: null,
        OR: [
          { isPrivate: false },
          ...(currentUserId
            ? [{ isPrivate: true, userId: currentUserId }]
            : []),
        ],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            nickname: true,
            image: true,
            role: true,
          },
        },
        replies: {
          where: {
            OR: [
              { isPrivate: false },
              ...(currentUserId
                ? [{ isPrivate: true, userId: currentUserId }]
                : []),
            ],
          },
          orderBy: { createdAt: 'asc' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                nickname: true,
                image: true,
                role: true,
              },
            },
          },
        },
      },
    });

    // Sanitizar autor si es anónimo y el usuario no es admin/autor
    const sanitizeComment = (c: typeof comments[0]) => {
      const isAuthor = currentUserId && c.userId === currentUserId;
      const hideIdentity = c.isAnonymous && !isAdminOrMod && !isAuthor;

      return {
        ...c,
        user: hideIdentity ? null : c.user,
        replies: c.replies?.map((r) => {
          const isReplyAuthor = currentUserId && r.userId === currentUserId;
          const hideReplyIdentity =
            r.isAnonymous && !isAdminOrMod && !isReplyAuthor;
          return {
            ...r,
            user: hideReplyIdentity ? null : r.user,
          };
        }),
      };
    };

    return NextResponse.json(comments.map(sanitizeComment));
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

    const rl = await checkCommentRateLimit(authResult.userId);
    if (!rl.ok) {
      return NextResponse.json(
        { error: rl.reason },
        {
          status: 429,
          headers: { 'Retry-After': String(rl.retryAfterSeconds) },
        }
      );
    }

    const resolvedParams = await params;
    const seriesId = parseInt(resolvedParams.id, 10);
    const body = await request.json();
    const { content, isPrivate, isAnonymous, parentId } = body;

    if (!content || typeof content !== 'string' || content.trim() === '') {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      );
    }

    const parsedParentId =
      typeof parentId === 'number' && parentId > 0 ? parentId : null;

    const comment = await prisma.comment.create({
      data: {
        seriesId,
        parentId: parsedParentId,
        content: content.trim(),
        isPrivate: isPrivate === true,
        isAnonymous: isAnonymous === true,
        userId: authResult.userId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            nickname: true,
            image: true,
            role: true,
          },
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                nickname: true,
                image: true,
                role: true,
              },
            },
          },
        },
      },
    });

    if (!comment.isPrivate) {
      const series = await prisma.series.findUnique({
        where: { id: seriesId },
        select: { title: true },
      });
      const rawAuthorName = formatPublicName(comment.user);
      const authorName = comment.isAnonymous
        ? `Anónimo (${rawAuthorName})`
        : rawAuthorName;
      const excerpt = content.trim().slice(0, 80);

      // Notificar a los participantes del hilo
      void notifyParticipantsOfNewComment({
        currentCommentId: comment.id,
        currentUserId: authResult.userId,
        target: { seriesId },
        seriesIdForLink: seriesId,
        excerpt,
      });

      // Notificar a administradores y moderadores
      void notifyAdminsOfNewComment({
        currentCommentId: comment.id,
        currentUserId: authResult.userId,
        authorName,
        seriesId,
        seriesTitle: series?.title,
        excerpt,
        isReply: parsedParentId !== null,
      });

      // Si es una respuesta a otro comentario, notificar al autor del padre
      if (parsedParentId) {
        void notifyParentAuthorOfReply({
          parentCommentId: parsedParentId,
          currentCommentId: comment.id,
          currentUserId: authResult.userId,
          authorName: comment.isAnonymous ? 'Un usuario anónimo' : rawAuthorName,
          seriesId,
          seriesTitle: series?.title,
          excerpt,
        });
      }
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
