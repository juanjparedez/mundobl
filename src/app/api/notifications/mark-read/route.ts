import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { countInChunks } from '@/lib/d1-lists';
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
    await countInChunks(body.ids, (chunk) =>
      prisma.notification.updateMany({
        where: { userId: auth.userId, id: { in: chunk }, readAt: null },
        data: { readAt: now },
      })
    );
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'No ids provided' }, { status: 400 });
}
