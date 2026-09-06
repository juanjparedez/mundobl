import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requireAuth } from '@/lib/auth-helpers';
import { checkFeatureRequestCommentRateLimit } from '@/lib/rate-limit';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const requestId = parseInt(id);
    if (isNaN(requestId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const featureRequest = await prisma.featureRequest.findUnique({
      where: { id: requestId },
      select: { id: true },
    });

    if (!featureRequest) {
      return NextResponse.json(
        { error: 'Solicitud no encontrada' },
        { status: 404 }
      );
    }

    const comments = await prisma.featureRequestComment.findMany({
      where: { featureRequestId: requestId },
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
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
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

    const { id } = await params;
    const requestId = parseInt(id);
    if (isNaN(requestId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const rl = await checkFeatureRequestCommentRateLimit(authResult.userId!);
    if (!rl.ok) {
      return NextResponse.json(
        { error: rl.reason },
        {
          status: 429,
          headers: { 'Retry-After': String(rl.retryAfterSeconds) },
        }
      );
    }

    const body = await request.json();
    const { body: commentBody } = body as { body: string };

    if (
      !commentBody ||
      typeof commentBody !== 'string' ||
      !commentBody.trim()
    ) {
      return NextResponse.json(
        { error: 'El comentario no puede estar vacío' },
        { status: 400 }
      );
    }

    if (commentBody.trim().length > 2000) {
      return NextResponse.json(
        { error: 'El comentario es demasiado largo (máx 2000 caracteres)' },
        { status: 400 }
      );
    }

    const featureRequest = await prisma.featureRequest.findUnique({
      where: { id: requestId },
      select: { userId: true, title: true },
    });

    if (!featureRequest) {
      return NextResponse.json(
        { error: 'Solicitud no encontrada' },
        { status: 404 }
      );
    }

    const isAdminOrMod =
      authResult.role === 'ADMIN' || authResult.role === 'MODERATOR';

    const comment = await prisma.featureRequestComment.create({
      data: {
        body: commentBody.trim(),
        userId: authResult.userId!,
        featureRequestId: requestId,
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
      },
    });

    if (
      featureRequest.userId &&
      featureRequest.userId !== authResult.userId!
    ) {
      const { notifyUser } = await import('@/lib/notifications');
      const notifTitle = isAdminOrMod
        ? `Respuesta del equipo en tu solicitud: "${featureRequest.title}"`
        : `Nuevo comentario en tu solicitud: "${featureRequest.title}"`;

      await notifyUser({
        userId: featureRequest.userId,
        type: 'feature_comment',
        title: notifTitle,
        body: commentBody.trim().substring(0, 100),
        linkPath: '/feedback?tab=mis-solicitudes',
        refType: 'feature_request',
        refId: requestId,
      }).catch(() => {});
    }

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

