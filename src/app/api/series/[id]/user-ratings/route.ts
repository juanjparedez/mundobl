import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requireAuth } from '@/lib/auth-helpers';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/series/[id]/user-ratings - Obtener ratings de usuarios (público)
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const seriesId = parseInt(id, 10);

    if (isNaN(seriesId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const userRatings = await prisma.userRating.findMany({
      where: { seriesId },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
    });

    // Calcular promedios por categoría y general
    const byCategory: Record<string, { total: number; count: number }> = {};
    const userIds = new Set<string>();

    for (const rating of userRatings) {
      userIds.add(rating.userId);
      if (!byCategory[rating.category]) {
        byCategory[rating.category] = { total: 0, count: 0 };
      }
      byCategory[rating.category].total += rating.score;
      byCategory[rating.category].count += 1;
    }

    const averages: Record<string, number> = {};
    let overallTotal = 0;
    let overallCount = 0;

    for (const [category, data] of Object.entries(byCategory)) {
      averages[category] = Math.round((data.total / data.count) * 10) / 10;
      overallTotal += data.total;
      overallCount += data.count;
    }

    const overallAverage =
      overallCount > 0
        ? Math.round((overallTotal / overallCount) * 10) / 10
        : null;

    return NextResponse.json({
      averages,
      overallAverage,
      totalVoters: userIds.size,
      ratings: userRatings,
    });
  } catch (error) {
    console.error('Error fetching user ratings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user ratings' },
      { status: 500 }
    );
  }
}

// POST /api/series/[id]/user-ratings - Guardar ratings del usuario
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireAuth();
    if (!authResult.authorized) return authResult.response;

    const { id } = await params;
    const seriesId = parseInt(id, 10);

    if (isNaN(seriesId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const body = await request.json();
    const { ratings } = body;

    if (!ratings || typeof ratings !== 'object') {
      return NextResponse.json(
        { error: 'Invalid ratings data' },
        { status: 400 }
      );
    }

    // Upsert cada categoría del usuario
    const savedRatings = await Promise.all(
      Object.entries(ratings).map(([category, score]) =>
        prisma.userRating.upsert({
          where: {
            userId_seriesId_category: {
              userId: authResult.userId,
              seriesId,
              category,
            },
          },
          update: { score: score as number },
          create: {
            userId: authResult.userId,
            seriesId,
            category,
            score: score as number,
          },
        })
      )
    );

    return NextResponse.json({ success: true, ratings: savedRatings });
  } catch (error) {
    console.error('Error saving user ratings:', error);
    return NextResponse.json(
      { error: 'Failed to save user ratings' },
      { status: 500 }
    );
  }
}
