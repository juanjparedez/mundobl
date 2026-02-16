import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const seriesId = parseInt(resolvedParams.id, 10);
    const body = await request.json();
    const { ratings } = body;

    if (!ratings || typeof ratings !== 'object') {
      return NextResponse.json({ error: 'Invalid ratings data' }, { status: 400 });
    }

    // Eliminar ratings existentes de la serie
    await prisma.rating.deleteMany({
      where: { seriesId },
    });

    // Crear nuevos ratings
    const ratingPromises = Object.entries(ratings).map(([category, score]) =>
      prisma.rating.create({
        data: {
          seriesId,
          category,
          score: score as number,
        },
      })
    );

    const savedRatings = await Promise.all(ratingPromises);

    return NextResponse.json({ success: true, ratings: savedRatings });
  } catch (error) {
    console.error('Error saving ratings:', error);
    return NextResponse.json({ error: 'Failed to save ratings' }, { status: 500 });
  }
}
