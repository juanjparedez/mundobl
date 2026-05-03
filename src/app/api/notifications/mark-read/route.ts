import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requireAuth } from '@/lib/auth-helpers';

interface Body {
  ids?: number[];
  all?: boolean;
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth.authorized) return auth.response;

  const body = (await req.json().catch(() => ({}))) as Body;
  const now = new Date();

  if (body.all) {
    await prisma.notification.updateMany({
      where: { userId: auth.userId, readAt: null },
      data: { readAt: now },
    });
    return NextResponse.json({ ok: true });
  }

  if (Array.isArray(body.ids) && body.ids.length > 0) {
    await prisma.notification.updateMany({
      where: { userId: auth.userId, id: { in: body.ids }, readAt: null },
      data: { readAt: now },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'No ids provided' }, { status: 400 });
}
