import { NextRequest, NextResponse } from 'next/server';
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

    // Tres caminos: crear, cambiar (helpful↔unhelpful) o togglear (mismo voto = borrar).
    const result = await prisma.$transaction(async (tx) => {
      if (!existing) {
        await tx.reviewVote.create({
          data: { reviewId, userId: authResult.userId, helpful: helpful },
        });
        await tx.review.update({
          where: { id: reviewId },
          data: helpful
            ? { helpfulCount: { increment: 1 } }
            : { unhelpfulCount: { increment: 1 } },
        });
        return { vote: helpful as boolean | null };
      }

      if (existing.helpful === helpful) {
        // Mismo voto: borrar (toggle off).
        await tx.reviewVote.delete({ where: { id: existing.id } });
        await tx.review.update({
          where: { id: reviewId },
          data: existing.helpful
            ? { helpfulCount: { decrement: 1 } }
            : { unhelpfulCount: { decrement: 1 } },
        });
        return { vote: null };
      }

      // Cambio de voto: actualizar y mover el contador.
      await tx.reviewVote.update({
        where: { id: existing.id },
        data: { helpful: helpful },
      });
      await tx.review.update({
        where: { id: reviewId },
        data: helpful
          ? {
              helpfulCount: { increment: 1 },
              unhelpfulCount: { decrement: 1 },
            }
          : {
              helpfulCount: { decrement: 1 },
              unhelpfulCount: { increment: 1 },
            },
      });
      return { vote: helpful as boolean | null };
    });

    const updated = await prisma.review.findUnique({
      where: { id: reviewId },
      select: { helpfulCount: true, unhelpfulCount: true },
    });

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
