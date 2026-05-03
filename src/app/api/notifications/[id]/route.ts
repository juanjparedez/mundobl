import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requireAuth } from '@/lib/auth-helpers';

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (!auth.authorized) return auth.response;

  const { id } = await context.params;
  const numId = Number(id);
  if (!Number.isInteger(numId)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  await prisma.notification.deleteMany({
    where: { id: numId, userId: auth.userId },
  });
  return NextResponse.json({ ok: true });
}
