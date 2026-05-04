import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requireAuth } from '@/lib/auth-helpers';

// GET /api/feature-requests/[id]/comments — requiere auth (solo el dueño o admin/mod puede ver)
export async function GET(
  _request: NextRequest,
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

    // Verificar que la solicitud existe y que el usuario es el dueño o admin/mod
    const featureRequest = await prisma.featureRequest.findUnique({
      where: { id: requestId },
      select: { userId: true },
    });

    if (!featureRequest) {
      return NextResponse.json(
        { error: 'Solicitud no encontrada' },
        { status: 404 }
      );
    }

    const isOwner = featureRequest.userId === authResult.userId;
    const isAdminOrMod =
      authResult.role === 'ADMIN' || authResult.role === 'MODERATOR';

    if (!isOwner && !isAdminOrMod) {
      return NextResponse.json({ error: 'Sin acceso' }, { status: 403 });
    }

    const comments = await prisma.featureRequestComment.findMany({
      where: { featureRequestId: requestId },
      include: {
        user: { select: { id: true, name: true, image: true, role: true } },
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

// POST /api/feature-requests/[id]/comments — requiere auth
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

    const body = await request.json();
    const { body: commentBody } = body as { body: string };

    if (!commentBody || typeof commentBody !== 'string' || !commentBody.trim()) {
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

    // Verificar acceso: dueño o admin/mod
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

    const isOwner = featureRequest.userId === authResult.userId;
    const isAdminOrMod =
      authResult.role === 'ADMIN' || authResult.role === 'MODERATOR';

    if (!isOwner && !isAdminOrMod) {
      return NextResponse.json({ error: 'Sin acceso' }, { status: 403 });
    }

    const comment = await prisma.featureRequestComment.create({
      data: {
        body: commentBody.trim(),
        userId: authResult.userId!,
        featureRequestId: requestId,
      },
      include: {
        user: { select: { id: true, name: true, image: true, role: true } },
      },
    });

    // Si el comentario lo agrega admin/mod, notificar al dueño de la solicitud
    if (isAdminOrMod && featureRequest.userId && featureRequest.userId !== authResult.userId!) {
      const { notifyUser } = await import('@/lib/notifications');
      await notifyUser({
        userId: featureRequest.userId,
        type: 'feature_comment',
        title: `Nuevo comentario en tu solicitud: "${featureRequest.title}"`,
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
