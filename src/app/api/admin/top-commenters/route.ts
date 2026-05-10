import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requireRole } from '@/lib/auth-helpers';

// GET /api/admin/top-commenters — top 5 users por count de comentarios
// publicos en los ultimos 30 dias. Usado por TopCommentersWidget del
// dashboard configurable /admin (cubre la columna "Comunidad destacada"
// del mock admin.png).
export async function GET() {
  const authResult = await requireRole(['ADMIN', 'MODERATOR']);
  if (!authResult.authorized) return authResult.response;

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // Group by userId, count comments where userId != null (anonimos
  // excluidos), publicos solo, ultimos 30 dias.
  const grouped = await prisma.comment.groupBy({
    by: ['userId'],
    where: {
      isPrivate: false,
      userId: { not: null },
      createdAt: { gte: thirtyDaysAgo },
    },
    _count: { _all: true },
    orderBy: { _count: { userId: 'desc' } },
    take: 5,
  });

  // groupBy no joinea User, fetch los users en una sola query.
  const userIds = grouped
    .map((g) => g.userId)
    .filter((id): id is string => id !== null);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: {
      id: true,
      name: true,
      nickname: true,
      image: true,
      role: true,
    },
  });
  const userMap = new Map(users.map((u) => [u.id, u]));

  const commenters = grouped
    .map((g) => {
      const user = g.userId ? userMap.get(g.userId) : null;
      if (!user) return null;
      return { user, count: g._count._all };
    })
    .filter(
      (c): c is { user: (typeof users)[number]; count: number } => c !== null
    );

  return NextResponse.json({ commenters });
}
