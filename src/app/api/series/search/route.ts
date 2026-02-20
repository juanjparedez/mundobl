import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';

// GET /api/series/search?q=texto&excludeId=123
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const query = searchParams.get('q') || '';
    const excludeId = searchParams.get('excludeId');

    if (!query.trim()) {
      return NextResponse.json([]);
    }

    const series = await prisma.series.findMany({
      where: {
        AND: [
          {
            OR: [
              { title: { contains: query, mode: 'insensitive' } },
              { originalTitle: { contains: query, mode: 'insensitive' } },
            ],
          },
          excludeId ? { id: { not: parseInt(excludeId, 10) } } : {},
        ],
      },
      select: { id: true, title: true, imageUrl: true, year: true, type: true },
      take: 10,
      orderBy: { title: 'asc' },
    });

    return NextResponse.json(series);
  } catch (error) {
    console.error('Error searching series:', error);
    return NextResponse.json(
      { error: 'Error al buscar series' },
      { status: 500 }
    );
  }
}
