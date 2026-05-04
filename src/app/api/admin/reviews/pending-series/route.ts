import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@/generated/prisma';
import { prisma } from '@/lib/database';
import { requireRole } from '@/lib/auth-helpers';

// GET /api/admin/reviews/pending-series — series que aun no tienen
// ninguna review publicada. Pensado para fomentar nuevas reseñas
// desde el panel de admin.
//
// Query params: q (busqueda en titulo), page, pageSize.
// Devuelve total, page, pageSize y { id, title, year, type, country, imageUrl }.
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireRole(['ADMIN', 'MODERATOR']);
    if (!authResult.authorized) return authResult.response;

    const { searchParams } = request.nextUrl;
    const search = searchParams.get('q')?.trim();
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const pageSize = Math.min(
      Math.max(parseInt(searchParams.get('pageSize') || '50', 10), 1),
      200
    );

    const where: Prisma.SeriesWhereInput = {
      reviews: { none: { status: 'PUBLISHED' } },
    };
    if (search) {
      where.title = { contains: search, mode: 'insensitive' };
    }

    const [series, total, totalSeries] = await Promise.all([
      prisma.series.findMany({
        where,
        orderBy: { title: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          title: true,
          year: true,
          type: true,
          imageUrl: true,
          country: { select: { id: true, name: true, code: true } },
        },
      }),
      prisma.series.count({ where }),
      prisma.series.count(),
    ]);

    return NextResponse.json({
      series,
      total,
      totalSeries,
      withReviews: totalSeries - total,
      page,
      pageSize,
    });
  } catch (error) {
    console.error('Error fetching pending series:', error);
    return NextResponse.json(
      { error: 'Error al obtener series pendientes' },
      { status: 500 }
    );
  }
}
