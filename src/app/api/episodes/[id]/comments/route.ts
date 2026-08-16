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

    const resolvedParams = await params;
    const episodeId = parseInt(resolvedParams.id, 10);

    if (isNaN(episodeId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const comments = await prisma.comment.findMany({
      where: {
        episodeId,
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

    const sanitizeComment = (c: (typeof comments)[0]) => {
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
    console.error('Error fetching episode comments:', error);
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
    const episodeId = parseInt(resolvedParams.id, 10);

    if (isNaN(episodeId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const body = await request.json();
    const { content, isPrivate, isAnonymous, parentId } = body;

    if (!content || content.trim() === '') {
      return NextResponse.json(
        { error: 'El contenido es requerido' },
        { status: 400 }
      );
    }

    const parsedParentId =
      typeof parentId === 'number' && parentId > 0 ? parentId : null;

    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        isPrivate: isPrivate === true,
        isAnonymous: isAnonymous === true,
        episodeId,
        parentId: parsedParentId,
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
      const episode = await prisma.episode.findUnique({
        where: { id: episodeId },
        select: {
          episodeNumber: true,
          season: {
            select: {
              seriesId: true,
              seasonNumber: true,
              series: { select: { title: true } },
            },
          },
        },
      });
      const seriesId = episode?.season?.seriesId;
      if (seriesId && episode) {
        const rawAuthorName = formatPublicName(comment.user);
        const authorName = comment.isAnonymous
          ? `Anónimo (${rawAuthorName})`
          : rawAuthorName;
        const excerpt = content.trim().slice(0, 80);
        const titleLabel = `${episode.season.series.title} (T${episode.season.seasonNumber}E${episode.episodeNumber})`;

        void notifyParticipantsOfNewComment({
          currentCommentId: comment.id,
          currentUserId: authResult.userId,
          target: { episodeId },
          seriesIdForLink: seriesId,
          excerpt,
        });

        void notifyAdminsOfNewComment({
          currentCommentId: comment.id,
          currentUserId: authResult.userId,
          authorName,
          seriesId,
          seriesTitle: titleLabel,
          excerpt,
          isReply: parsedParentId !== null,
        });

        if (parsedParentId) {
          void notifyParentAuthorOfReply({
            parentCommentId: parsedParentId,
            currentCommentId: comment.id,
            currentUserId: authResult.userId,
            authorName: comment.isAnonymous
              ? 'Un usuario anónimo'
              : rawAuthorName,
            seriesId,
            seriesTitle: titleLabel,
            excerpt,
          });
        }
      }
    }

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error('Error creating episode comment:', error);
    return NextResponse.json(
      { error: 'Error al crear comentario' },
      { status: 500 }
    );
  }
}
