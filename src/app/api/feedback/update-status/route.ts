import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/database';

export const runtime = 'nodejs';

export async function PATCH(request: NextRequest) {
  try {
    const result = await requireAuth();
    if (!result.authorized) return result.response;

    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: 'ID and status are required' },
        { status: 400 }
      );
    }

    const existingCase = await prisma.featureRequest.findUnique({
      where: { id: parseInt(id, 10) },
    });

    if (!existingCase || existingCase.userId !== result.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const updated = await prisma.featureRequest.update({
      where: { id: parseInt(id, 10) },
      data: { status },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            nickname: true,
            email: true,
            image: true,
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                nickname: true,
                email: true,
                image: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[feedback/update-status PATCH]', error);
    return NextResponse.json(
      { error: 'Failed to update status' },
      { status: 500 }
    );
  }
}
