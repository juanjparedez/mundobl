import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requireRole } from '@/lib/auth-helpers';
import type { Role } from '@/generated/prisma';

const ALLOWED_ROLES: Role[] = ['VISITOR', 'MODERATOR'];

// PUT /api/users/[id]/role - Cambiar rol de usuario (Solo Admin)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireRole(['ADMIN']);
    if (!authResult.authorized) return authResult.response;

    const { id } = await params;
    const body = await request.json();
    const { role } = body;

    if (!ALLOWED_ROLES.includes(role)) {
      return NextResponse.json(
        { error: 'Rol no válido. Solo se puede asignar VISITOR o MODERATOR.' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // No permitir cambiar el rol de los admins
    const adminEmails = (process.env.ADMIN_EMAILS ?? '')
      .split(',')
      .map((e) => e.trim())
      .filter(Boolean);
    if (user.email && adminEmails.includes(user.email)) {
      return NextResponse.json(
        { error: 'No se puede cambiar el rol del administrador' },
        { status: 403 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, name: true, email: true, role: true },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user role:', error);
    return NextResponse.json(
      { error: 'Failed to update user role' },
      { status: 500 }
    );
  }
}
