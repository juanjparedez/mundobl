import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helpers';
import { prisma } from '@/lib/database';

export async function GET(request: NextRequest) {
  const authResult = await requireRole(['ADMIN', 'MODERATOR']);
  if (!authResult.authorized) return authResult.response;

  const status = request.nextUrl.searchParams.get('status') ?? 'PENDING';
  const allowedStatuses = new Set(['PENDING', 'APPROVED', 'REJECTED']);
  const where = allowedStatuses.has(status) ? { status } : undefined;

  const suggestions = await prisma.glossarySuggestion.findMany({
    where,
    orderBy: { createdAt: 'asc' },
    include: {
      user: { select: { id: true, name: true, nickname: true, image: true } },
    },
  });

  return NextResponse.json(suggestions);
}
