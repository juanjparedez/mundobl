import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@/generated/prisma';
import { prisma } from '@/lib/database';
import { requireRole } from '@/lib/auth-helpers';

const STATUS_VALUES = ['DRAFT', 'PUBLISHED', 'HIDDEN'] as const;
type StatusValue = (typeof STATUS_VALUES)[number];

// GET /api/admin/reviews — admin/mod, lista todas las reseñas con filtros
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireRole(['ADMIN', 'MODERATOR']);
    if (!authResult.authorized) return authResult.response;

    const { searchParams } = request.nextUrl;
    const statusParam = searchParams.get('status');
    const language = searchParams.get('language');
    const search = searchParams.get('q')?.trim();
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const pageSize = Math.min(
      Math.max(parseInt(searchParams.get('pageSize') || '50', 10), 1),
      200
    );

    const where: Prisma.ReviewWhereInput = {};
    if (statusParam && STATUS_VALUES.includes(statusParam as StatusValue)) {
      where.status = statusParam as StatusValue;
    }
    if (language) where.language = language;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { body: { contains: search, mode: 'insensitive' } },
        { series: { title: { contains: search, mode: 'insensitive' } } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
          series: { select: { id: true, title: true } },
        },
      }),
      prisma.review.count({ where }),
    ]);

    return NextResponse.json({ reviews, total, page, pageSize });
  } catch (error) {
    console.error('Error fetching admin reviews:', error);
    return NextResponse.json(
      { error: 'Error al obtener reseñas' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/reviews?id=X — cambiar status (PUBLISHED/HIDDEN)
export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireRole(['ADMIN', 'MODERATOR']);
    if (!authResult.authorized) return authResult.response;

    const id = parseInt(request.nextUrl.searchParams.get('id') || '', 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID invalido' }, { status: 400 });
    }

    const body = (await request.json()) as { status?: string };
    const status = body.status;
    if (!status || !STATUS_VALUES.includes(status as StatusValue)) {
      return NextResponse.json({ error: 'status invalido' }, { status: 400 });
    }

    const updated = await prisma.review.update({
      where: { id },
      data: {
        status: status as StatusValue,
        publishedAt: status === 'PUBLISHED' ? new Date() : null,
      },
    });

    return NextResponse.json({ success: true, review: updated });
  } catch (error) {
    console.error('Error updating review status:', error);
    return NextResponse.json(
      { error: 'Error al actualizar reseña' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/reviews?id=X — admin only
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireRole(['ADMIN']);
    if (!authResult.authorized) return authResult.response;

    const id = parseInt(request.nextUrl.searchParams.get('id') || '', 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID invalido' }, { status: 400 });
    }

    await prisma.review.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting review:', error);
    return NextResponse.json(
      { error: 'Error al eliminar reseña' },
      { status: 500 }
    );
  }
}
