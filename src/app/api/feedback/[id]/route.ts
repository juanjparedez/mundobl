import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/database';

export const runtime = 'nodejs';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await requireAuth();
    if (!result.authorized) return result.response;

    const caseId = parseInt(params.id, 10);
    const body = await request.json();

    // Verificar que el usuario es propietario del caso
    const existingCase = await prisma.featureRequest.findUnique({
      where: { id: caseId },
    });

    if (!existingCase || existingCase.userId !== result.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const updated = await prisma.featureRequest.update({
      where: { id: caseId },
      data: {
        title: body.title || existingCase.title,
        description:
          body.description !== undefined
            ? body.description
            : existingCase.description,
        priority: body.priority || existingCase.priority,
      },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
        comments: {
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true },
            },
          },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[feedback/{id} PATCH]', error);
    return NextResponse.json(
      { error: 'Failed to update case' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await requireAuth();
    if (!result.authorized) return result.response;

    const caseId = parseInt(params.id, 10);

    // Verificar que el usuario es propietario del caso
    const existingCase = await prisma.featureRequest.findUnique({
      where: { id: caseId },
    });

    if (!existingCase || existingCase.userId !== result.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await prisma.featureRequest.delete({
      where: { id: caseId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[feedback/{id} DELETE]', error);
    return NextResponse.json(
      { error: 'Failed to delete case' },
      { status: 500 }
    );
  }
}
