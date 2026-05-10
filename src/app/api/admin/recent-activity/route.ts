import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requireRole } from '@/lib/auth-helpers';

// GET /api/admin/recent-activity — eventos recientes del equipo
// (ADMIN/MODERATOR) sobre el sistema. Filtra AccessLog para CREATE,
// UPDATE, DELETE en paths /admin/* y une con User para mostrar quien.
//
// Usado por RecentAdminActivityWidget del dashboard configurable /admin.
export async function GET() {
  const authResult = await requireRole(['ADMIN', 'MODERATOR']);
  if (!authResult.authorized) return authResult.response;

  const events = await prisma.accessLog.findMany({
    where: {
      action: { in: ['CREATE', 'UPDATE', 'DELETE'] },
      path: { startsWith: '/admin' },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      id: true,
      action: true,
      path: true,
      method: true,
      createdAt: true,
      user: {
        select: {
          name: true,
          nickname: true,
          image: true,
          role: true,
        },
      },
    },
  });

  return NextResponse.json({ events });
}
