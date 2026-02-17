import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requireAuth } from '@/lib/auth-helpers';

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

    return NextResponse.json({ voted: true });
  } catch (error) {
    console.error('Error toggling vote:', error);
    return NextResponse.json({ error: 'Error al votar' }, { status: 500 });
  }
}
