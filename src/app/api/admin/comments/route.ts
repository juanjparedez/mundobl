import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requireRole } from '@/lib/auth-helpers';

// GET /api/admin/comments — admin only, lista comentarios publicos con filtros
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireRole(['ADMIN']);
    if (!authResult.authorized) return authResult.response;

    const { searchParams } = request.nextUrl;
    const target = searchParams.get('target');
    const userId = searchParams.get('userId');
    const search = searchParams.get('q')?.trim();
    const reportedOnly = searchParams.get('reported') === 'true';
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const pageSize = Math.min(
      Math.max(parseInt(searchParams.get('pageSize') || '50', 10), 1),
      200
    );

    const where: {
      isPrivate: boolean;
      userId?: string;
      seriesId?: { not: null };
      seasonId?: { not: null };
      episodeId?: { not: null };
      content?: { contains: string; mode: 'insensitive' };
      reportCount?: { gt: number };
    } = { isPrivate: false };

    if (target === 'series') where.seriesId = { not: null };
    else if (target === 'season') where.seasonId = { not: null };
    else if (target === 'episode') where.episodeId = { not: null };

    if (userId) where.userId = userId;
    if (search) where.content = { contains: search, mode: 'insensitive' };
    if (reportedOnly) where.reportCount = { gt: 0 };

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where,
        orderBy: reportedOnly
          ? [{ reportCount: 'desc' }, { reportedAt: 'desc' }]
          : { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
          series: { select: { id: true, title: true } },
          season: {
            select: {
              id: true,
              seasonNumber: true,
              series: { select: { id: true, title: true } },
            },
          },
          episode: {
            select: {
              id: true,
              episodeNumber: true,
              title: true,
              season: {
                select: {
                  seasonNumber: true,
                  series: { select: { id: true, title: true } },
                },
              },
            },
          },
        },
      }),
      prisma.comment.count({ where }),
    ]);

    return NextResponse.json({ comments, total, page, pageSize });
  } catch (error) {
    console.error('Error fetching admin comments:', error);
    return NextResponse.json(
      { error: 'Error al obtener comentarios' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/comments?id=X — admin only
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireRole(['ADMIN']);
    if (!authResult.authorized) return authResult.response;

    const id = parseInt(request.nextUrl.searchParams.get('id') || '', 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    await prisma.comment.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { error: 'Error al eliminar comentario' },
      { status: 500 }
    );
  }
}
