import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requireAuth } from '@/lib/auth-helpers';
import { notifyUser } from '@/lib/notifications';

const VOTE_MILESTONES = [1, 5, 10, 25, 50, 100];

// POST /api/feature-requests/[id]/vote — autenticado, toggle voto
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth();
    if (!authResult.authorized) return authResult.response;

    const { id } = await params;
    const featureRequestId = parseInt(id);

    const existing = await prisma.featureVote.findUnique({
      where: {
        userId_featureRequestId: {
          userId: authResult.userId,
          featureRequestId,
        },
      },
    });

    if (existing) {
      await prisma.featureVote.delete({
        where: { id: existing.id },
      });
      return NextResponse.json({ voted: false });
    }

    await prisma.featureVote.create({
      data: {
        userId: authResult.userId,
        featureRequestId,
      },
    });

    // Notificar al autor solo cuando los votos cruzan un hito y no
    // cuando es el mismo autor el que vota.
    const [voteCount, fr] = await Promise.all([
      prisma.featureVote.count({ where: { featureRequestId } }),
      prisma.featureRequest.findUnique({
        where: { id: featureRequestId },
        select: { userId: true, title: true },
      }),
    ]);

    if (
      fr?.userId &&
      fr.userId !== authResult.userId &&
      VOTE_MILESTONES.includes(voteCount)
    ) {
      void notifyUser({
        userId: fr.userId,
        type: 'feature_votes_milestone',
        title: `Tu solicitud "${fr.title}" alcanzó ${voteCount} ${voteCount === 1 ? 'voto' : 'votos'}`,
        linkPath: '/feedback',
        refType: 'feature_votes_milestone',
        refId: `${featureRequestId}:${voteCount}`,
      }).catch(() => {});
    }

    return NextResponse.json({ voted: true });
  } catch (error) {
    console.error('Error toggling vote:', error);
    return NextResponse.json({ error: 'Error al votar' }, { status: 500 });
  }
}
