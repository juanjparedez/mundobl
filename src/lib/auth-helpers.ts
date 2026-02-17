import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import type { Role } from '@/generated/prisma';

interface AuthSuccess {
  authorized: true;
  userId: string;
  role: Role;
}

interface AuthFailure {
  authorized: false;
  response: NextResponse;
}

type AuthResult = AuthSuccess | AuthFailure;

export async function requireAuth(): Promise<AuthResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      authorized: false,
      response: NextResponse.json({ error: 'No autenticado' }, { status: 401 }),
    };
  }
  return { authorized: true, userId: session.user.id, role: session.user.role };
}

export async function requireRole(allowedRoles: Role[]): Promise<AuthResult> {
  const result = await requireAuth();
  if (!result.authorized) return result;

  if (!allowedRoles.includes(result.role)) {
    return {
      authorized: false,
      response: NextResponse.json({ error: 'No autorizado' }, { status: 403 }),
    };
  }
  return result;
}
