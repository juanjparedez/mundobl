import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requireAuth } from '@/lib/auth-helpers';

interface RouteCtx {
  params: Promise<{ id: string }>;
}

async function resolveId(ctx: RouteCtx): Promise<number | null> {
  const { id } = await ctx.params;
  const n = Number(id);
  return Number.isInteger(n) ? n : null;
}

export async function DELETE(_req: Request, context: RouteCtx) {
  const auth = await requireAuth();
  if (!auth.authorized) return auth.response;

  const numId = await resolveId(context);
  if (numId === null) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  await prisma.notification.deleteMany({
    where: { id: numId, userId: auth.userId },
  });
  return NextResponse.json({ ok: true });
}

/**
 * PATCH /api/notifications/[id]
 * Marca una sola notificacion como leida (readAt = now).
 * Idempotente: si ya estaba leida, no falla.
 */
export async function PATCH(_req: NextRequest, context: RouteCtx) {
  const auth = await requireAuth();
  if (!auth.authorized) return auth.response;

  const numId = await resolveId(context);
  if (numId === null) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  await prisma.notification.updateMany({
    where: { id: numId, userId: auth.userId, readAt: null },
    data: { readAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}
