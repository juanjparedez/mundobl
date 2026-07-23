import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helpers';
import { prisma } from '@/lib/database';

export const runtime = 'nodejs';

function parseLimit(raw: string | null): number {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return 10;
  return Math.max(1, Math.min(100, Math.floor(parsed)));
}

function parsePage(raw: string | null): number {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return 1;
  return Math.max(1, Math.floor(parsed));
}

export async function GET(request: NextRequest) {
  const authResult = await requireRole(['ADMIN']);
  if (!authResult.authorized) return authResult.response;

  const page = parsePage(request.nextUrl.searchParams.get('page'));
  const pageSize = parseLimit(
    request.nextUrl.searchParams.get('pageSize') ??
      request.nextUrl.searchParams.get('limit')
  );

  const where = {
    OR: [{ action: { startsWith: 'ERROR_' } }, { action: 'ERROR' }],
  };

  const errors = await prisma.accessLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * pageSize,
    take: pageSize,
    select: {
      id: true,
      action: true,
      path: true,
      method: true,
      metadata: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          name: true,
          nickname: true,
        },
      },
    },
  });
  const total = await prisma.accessLog.count({ where });

  return NextResponse.json({
    ok: true,
    errors,
    total,
    page,
    pageSize,
    serverTime: Date.now(),
  });
}
