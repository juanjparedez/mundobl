import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/database';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const result = await requireAuth();
    if (!result.authorized) return result.response;

    const body = await request.json();
    const { title, description, type, priority } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const featureRequest = await prisma.featureRequest.create({
      data: {
        userId: result.userId,
        title,
        description: description || null,
        type: type || 'idea',
        priority: priority || 'MEDIUM',
        status: 'OPEN',
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

    return NextResponse.json(featureRequest);
  } catch (error) {
    console.error('[feedback POST]', error);
    return NextResponse.json(
      { error: 'Failed to create case' },
      { status: 500 }
    );
  }
}
