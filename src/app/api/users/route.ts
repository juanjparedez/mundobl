import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requireRole } from '@/lib/auth-helpers';

// GET /api/users - Obtener todos los usuarios (Solo Admin)
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireRole(['ADMIN']);
    if (!authResult.authorized) return authResult.response;

    const roleParam = request.nextUrl.searchParams.get('role');
    const roleFilter =
      roleParam === 'ADMIN' ||
      roleParam === 'MODERATOR' ||
      roleParam === 'VISITOR'
        ? roleParam
        : null;

    const users = await prisma.user.findMany({
      where: roleFilter ? { role: roleFilter } : undefined,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        banned: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
