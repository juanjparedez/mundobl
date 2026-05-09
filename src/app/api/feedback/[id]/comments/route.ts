import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/database';

export const runtime = 'nodejs';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const result = await requireAuth();
    if (!result.authorized) return result.response;

    const { id } = await params;
    const caseId = parseInt(id, 10);
    const body = await request.json();
    const { body: commentBody } = body;

    if (!commentBody || !commentBody.trim()) {
      return NextResponse.json(
        { error: 'Comment body is required' },
        { status: 400 }
      );
    }

    const existingCase = await prisma.featureRequest.findUnique({
      where: { id: caseId },
    });

    if (!existingCase) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    const comment = await prisma.featureRequestComment.create({
      data: {
        body: commentBody,
        userId: result.userId,
        featureRequestId: caseId,
      },
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
    });

    return NextResponse.json(comment);
  } catch (error) {
    console.error('[feedback/{id}/comments POST]', error);
    return NextResponse.json(
      { error: 'Failed to add comment' },
      { status: 500 }
    );
  }
}
