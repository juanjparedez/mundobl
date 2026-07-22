import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helpers';
import { prisma } from '@/lib/database';
import { notifyUser } from '@/lib/notifications';
import { Prisma } from '@/generated/prisma';

export const runtime = 'nodejs';

const VALID_STATUSES = ['OPEN', 'IN_PROGRESS', 'COMPLETED', 'REJECTED'];
const VALID_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

// Include compartido para que GET y PATCH devuelvan la misma forma de caso
// (el modal de detalle lee `comments`; sin esto crashea con TypeError).
const CASE_INCLUDE = {
  user: {
    select: { id: true, name: true, nickname: true, email: true, image: true },
  },
  assignedTo: {
    select: { id: true, name: true, email: true },
  },
  comments: {
    orderBy: { createdAt: 'asc' as const },
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
} as const;

export async function GET(request: NextRequest) {
  try {
    const result = await requireRole(['ADMIN']);
    if (!result.authorized) return result.response;

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || 'OPEN';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '50', 10);
    const search = searchParams.get('search') || '';

    const where: Prisma.FeatureRequestWhereInput = {};

    if (status !== 'ALL' && VALID_STATUSES.includes(status)) {
      where.status = status as Prisma.FeatureRequestWhereInput['status'];
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
        include: CASE_INCLUDE,
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

    const updateData: Record<string, string | null> = {};
    if (status) {
      if (!VALID_STATUSES.includes(status)) {
        return NextResponse.json(
          { error: 'Status no válido' },
          { status: 400 }
        );
      }
      updateData.status = status;
    }
    if (priority) {
      if (!VALID_PRIORITIES.includes(priority)) {
        return NextResponse.json(
          { error: 'Prioridad no válida' },
          { status: 400 }
        );
      }
      updateData.priority = priority;
    }
    if (assignedToId !== undefined)
      updateData.assignedToId = assignedToId || null;

    // Estado previo para decidir si notificar al reportante (paridad con
    // PUT /api/feature-requests/[id], que sí valida y notifica).
    const previous = await prisma.featureRequest.findUnique({
      where: { id: parseInt(id, 10) },
      select: { status: true, userId: true, title: true },
    });

    const updated = await prisma.featureRequest.update({
      where: { id: parseInt(id, 10) },
      data: updateData,
      include: CASE_INCLUDE,
    });

    if (
      previous &&
      previous.userId &&
      status &&
      status !== previous.status &&
      previous.userId !== result.userId
    ) {
      await notifyUser({
        userId: previous.userId,
        type: 'feature_status',
        title: `Cambio en tu solicitud: "${previous.title}"`,
        body: `El estado pasó a "${status}".`,
        linkPath: '/feedback',
        refType: 'feature_request',
        refId: parseInt(id, 10),
      }).catch(() => {
        /* never block the main op */
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[admin/feedback PATCH]', error);
    return NextResponse.json(
      { error: 'Failed to update case' },
      { status: 500 }
    );
  }
}
