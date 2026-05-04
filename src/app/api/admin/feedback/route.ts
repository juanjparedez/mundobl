import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helpers';
import { prisma } from '@/lib/database';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const result = await requireRole(['ADMIN']);
    if (!result.authorized) return result.response;

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || 'OPEN';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '50', 10);
    const search = searchParams.get('search') || '';

    const where: any = {};

    if (status !== 'ALL') {
      where.status = status;
    }

    if (search.trim()) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [cases, total] = await Promise.all([
      prisma.featureRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          user: {
            select: { id: true, name: true, email: true, image: true },
          },
          assignedTo: {
            select: { id: true, name: true, email: true },
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
    console.error('[admin/feedback GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch cases' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const result = await requireRole(['ADMIN']);
    if (!result.authorized) return result.response;

    const body = await request.json();
    const { id, status, priority, assignedToId } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (assignedToId !== undefined)
      updateData.assignedToId = assignedToId || null;

    const updated = await prisma.featureRequest.update({
      where: { id: parseInt(id, 10) },
      data: updateData,
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[admin/feedback PATCH]', error);
    return NextResponse.json(
      { error: 'Failed to update case' },
      { status: 500 }
    );
  }
}
