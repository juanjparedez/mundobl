import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';

// GET /api/news — lista pública de noticias PUBLISHED
// Query params: page, pageSize, q (búsqueda en título)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const search = searchParams.get('q')?.trim();
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const pageSize = Math.min(
      Math.max(parseInt(searchParams.get('pageSize') || '20', 10), 1),
      50
    );

    const where = {
      status: 'PUBLISHED' as const,
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' as const } },
              { summary: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [news, total] = await Promise.all([
      prisma.news.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          title: true,
          summary: true,
          originalUrl: true,
          sourceName: true,
          sourceLogo: true,
          imageUrl: true,
          publishedAt: true,
          aiGenerated: true,
          tags: {
            select: { tag: { select: { id: true, name: true } } },
          },
          relatedSeries: { select: { id: true, title: true } },
        },
      }),
      prisma.news.count({ where }),
    ]);

    return NextResponse.json({ news, total, page, pageSize });
  } catch (error) {
    console.error('[api/news] GET error:', error);
    return NextResponse.json(
      { error: 'Error al obtener noticias' },
      { status: 500 }
    );
  }
}
