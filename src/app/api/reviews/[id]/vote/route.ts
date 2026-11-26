import { NextRequest, NextResponse } from 'next/server';
import { awardAchievementsAfterResponse } from '@/lib/achievement-store';
import { prisma } from '@/lib/database';
import { requireAuth } from '@/lib/auth-helpers';

interface VoteInput {
  helpful?: boolean;
}

// POST /api/reviews/[id]/vote — body: { helpful: boolean }
// Crea o actualiza el voto del usuario sobre la review.
// Si el usuario vuelve a votar lo mismo, BORRA el voto (toggle).
// Mantiene helpfulCount/unhelpfulCount denormalizados en Review.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth();
    if (!authResult.authorized) return authResult.response;

    const { id } = await params;
    const reviewId = parseInt(id, 10);
    if (isNaN(reviewId)) {
      return NextResponse.json({ error: 'ID invalido' }, { status: 400 });
    }

    const body = (await request.json()) as VoteInput;
    if (typeof body.helpful !== 'boolean') {
      return NextResponse.json(
        { error: 'helpful debe ser boolean' },
        { status: 400 }
      );
    }
    const helpful: boolean = body.helpful;

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: { id: true, userId: true, status: true },
    });
    if (!review) {
      return NextResponse.json(
        { error: 'Reseña no encontrada' },
        { status: 404 }
      );
    }
    if (review.userId === authResult.userId) {
      return NextResponse.json(
        { error: 'No podés votar tu propia reseña' },
        { status: 400 }
      );
    }
    if (review.status !== 'PUBLISHED') {
      return NextResponse.json(
        { error: 'Solo se pueden votar reseñas publicadas' },
        { status: 400 }
      );
    }

    const existing = await prisma.reviewVote.findUnique({
      where: {
        reviewId_userId: { reviewId, userId: authResult.userId },
      },
    });

    // Tres caminos: crear, cambiar (helpful<->unhelpful) o togglear (mismo
    // voto = borrar). Los contadores se recalculan desde los votos en una
    // sola sentencia: sin transacciones en D1, asi nunca quedan corridos.
    let vote: boolean | null;
    if (!existing) {
      await prisma.reviewVote.create({
        data: { reviewId, userId: authResult.userId, helpful },
      });
      vote = helpful;
    } else if (existing.helpful === helpful) {
      await prisma.reviewVote.deleteMany({ where: { id: existing.id } });
      vote = null;
    } else {
      await prisma.reviewVote.update({
        where: { id: existing.id },
        data: { helpful },
      });
      vote = helpful;
    }
    await prisma.$executeRaw`
      UPDATE "Review" SET
        "helpfulCount" = (SELECT COUNT(*) FROM "ReviewVote" WHERE "reviewId" = ${reviewId} AND helpful = 1),
        "unhelpfulCount" = (SELECT COUNT(*) FROM "ReviewVote" WHERE "reviewId" = ${reviewId} AND helpful = 0)
      WHERE id = ${reviewId}`;
    const result = { vote };

    const updated = await prisma.review.findUnique({
      where: { id: reviewId },
      select: { helpfulCount: true, unhelpfulCount: true },
    });

    // El voto "util" cuenta para el autor de la reseña.
    awardAchievementsAfterResponse(review.userId, ['helpfulVotes']);
    return NextResponse.json({
      success: true,
      myVote: result.vote,
      helpfulCount: updated?.helpfulCount ?? 0,
      unhelpfulCount: updated?.unhelpfulCount ?? 0,
    });
  } catch (error) {
    console.error('Error voting review:', error);
    return NextResponse.json({ error: 'Error al votar' }, { status: 500 });
  }
}
