import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requireAuth } from '@/lib/auth-helpers';

interface DisputePayload {
  commentId: number;
  message: string;
  reportCount: number;
  isPrivate: boolean;
  commentPreview: string;
  target: string;
}

function parseDisputePayload(input: string | null): DisputePayload | null {
  if (!input) return null;
  try {
    const parsed = JSON.parse(input) as Partial<DisputePayload>;
    if (
      typeof parsed.commentId !== 'number' ||
      typeof parsed.message !== 'string' ||
      typeof parsed.reportCount !== 'number' ||
      typeof parsed.isPrivate !== 'boolean' ||
      typeof parsed.commentPreview !== 'string' ||
      typeof parsed.target !== 'string'
    ) {
      return null;
    }

    return {
      commentId: parsed.commentId,
      message: parsed.message,
      reportCount: parsed.reportCount,
      isPrivate: parsed.isPrivate,
      commentPreview: parsed.commentPreview,
      target: parsed.target,
    };
  } catch {
    return null;
  }
}

function resolveTargetLabel(comment: {
  series: { title: string } | null;
  season: { seasonNumber: number; series: { title: string } | null } | null;
  episode:
    | {
        episodeNumber: number;
        season: { seasonNumber: number; series: { title: string } | null } | null;
      }
    | null;
}) {
  if (comment.episode?.season?.series?.title) {
    return `${comment.episode.season.series.title} · T${comment.episode.season.seasonNumber}E${comment.episode.episodeNumber}`;
  }

  if (comment.season?.series?.title) {
    return `${comment.season.series.title} · T${comment.season.seasonNumber}`;
  }

  if (comment.series?.title) {
    return comment.series.title;
  }

  return 'Sin referencia';
}

// GET /api/user/comment-disputes - lista disputas del usuario autenticado
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (!authResult.authorized) return authResult.response;

    const limit = Math.min(
      Math.max(parseInt(request.nextUrl.searchParams.get('limit') || '100', 10), 1),
      200
    );

    const disputes = await prisma.featureRequest.findMany({
      where: {
        userId: authResult.userId,
        type: 'comment_dispute',
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const normalized = disputes.map((dispute) => {
      const payload = parseDisputePayload(dispute.description);
      return {
        id: dispute.id,
        title: dispute.title,
        status: dispute.status,
        priority: dispute.priority,
        createdAt: dispute.createdAt,
        updatedAt: dispute.updatedAt,
        commentId: payload?.commentId ?? null,
        message: payload?.message ?? '',
        reportCount: payload?.reportCount ?? 0,
        isPrivate: payload?.isPrivate ?? false,
        commentPreview: payload?.commentPreview ?? '',
        target: payload?.target ?? 'Sin referencia',
      };
    });

    return NextResponse.json({ disputes: normalized });
  } catch (error) {
    console.error('Error fetching comment disputes:', error);
    return NextResponse.json(
      { error: 'Error al obtener disputas' },
      { status: 500 }
    );
  }
}

// POST /api/user/comment-disputes - crea un descargo sobre un comentario propio reportado
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (!authResult.authorized) return authResult.response;

    const body = (await request.json().catch(() => ({}))) as {
      commentId?: unknown;
      message?: unknown;
    };

    if (
      typeof body.commentId !== 'number' ||
      !Number.isInteger(body.commentId) ||
      body.commentId <= 0
    ) {
      return NextResponse.json({ error: 'Comentario inválido' }, { status: 400 });
    }

    if (typeof body.message !== 'string') {
      return NextResponse.json(
        { error: 'El mensaje es requerido' },
        { status: 400 }
      );
    }

    const message = body.message.trim();
    if (message.length < 10) {
      return NextResponse.json(
        { error: 'El descargo debe tener al menos 10 caracteres' },
        { status: 400 }
      );
    }

    if (message.length > 2000) {
      return NextResponse.json(
        { error: 'El descargo no puede superar 2000 caracteres' },
        { status: 400 }
      );
    }

    const comment = await prisma.comment.findUnique({
      where: { id: body.commentId },
      select: {
        id: true,
        userId: true,
        content: true,
        isPrivate: true,
        reportCount: true,
        series: { select: { title: true } },
        season: {
          select: {
            seasonNumber: true,
            series: { select: { title: true } },
          },
        },
        episode: {
          select: {
            episodeNumber: true,
            season: {
              select: {
                seasonNumber: true,
                series: { select: { title: true } },
              },
            },
          },
        },
      },
    });

    if (!comment || comment.userId !== authResult.userId) {
      return NextResponse.json(
        { error: 'Comentario no encontrado' },
        { status: 404 }
      );
    }

    if (comment.reportCount <= 0) {
      return NextResponse.json(
        { error: 'Solo se puede abrir disputa en comentarios reportados' },
        { status: 400 }
      );
    }

    const targetLabel = resolveTargetLabel(comment);

    const payload: DisputePayload = {
      commentId: comment.id,
      message,
      reportCount: comment.reportCount,
      isPrivate: comment.isPrivate,
      commentPreview: comment.content.slice(0, 400),
      target: targetLabel,
    };

    const created = await prisma.featureRequest.create({
      data: {
        userId: authResult.userId,
        type: 'comment_dispute',
        status: 'pendiente',
        priority: 'media',
        title: `Disputa comentario #${comment.id}`,
        description: JSON.stringify(payload),
      },
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, dispute: created }, { status: 201 });
  } catch (error) {
    console.error('Error creating comment dispute:', error);
    return NextResponse.json(
      { error: 'Error al crear la disputa' },
      { status: 500 }
    );
  }
}
