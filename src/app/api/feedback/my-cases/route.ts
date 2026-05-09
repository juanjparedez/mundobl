import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/database';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const result = await requireAuth();
    if (!result.authorized) return result.response;

    const userId = result.userId;

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
    const type = searchParams.get('type') || 'all'; // all, bug, feature, idea

    const where: any = {
      userId: userId,
    };

    if (type !== 'all') {
      where.type = type;
    }

    const [cases, total] = await Promise.all([
      prisma.featureRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          assignedTo: {
            select: { id: true, name: true, email: true },
          },
          comments: {
            orderBy: { createdAt: 'desc' },
            take: 3,
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
      }),
      prisma.featureRequest.count({ where }),
    ]);

    return NextResponse.json({
      cases,
      total,
      page,
      pageSize,
    });
  } catch (error) {
    console.error('[feedback/my-cases GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch your cases' },
      { status: 500 }
    );
  }
}
