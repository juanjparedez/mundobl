import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requireAuth } from '@/lib/auth-helpers';

export async function GET() {
  const auth = await requireAuth();
  if (!auth.authorized) return auth.response;

  const [items, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: auth.userId },
      orderBy: { createdAt: 'desc' },
      take: 30,
    }),
    prisma.notification.count({
      where: { userId: auth.userId, readAt: null },
    }),
  ]);

  return NextResponse.json({ items, unreadCount });
}

export async function DELETE() {
  const auth = await requireAuth();
  if (!auth.authorized) return auth.response;

  await prisma.notification.deleteMany({ where: { userId: auth.userId } });
  return NextResponse.json({ ok: true });
}
