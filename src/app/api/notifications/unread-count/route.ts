import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requireAuth } from '@/lib/auth-helpers';

export async function GET() {
  const auth = await requireAuth();
  if (!auth.authorized) return NextResponse.json({ count: 0 });

  const count = await prisma.notification.count({
    where: { userId: auth.userId, readAt: null },
  });
  return NextResponse.json(
    { count },
    {
      headers: {
        'Cache-Control': 'private, max-age=30, stale-while-revalidate=60',
      },
    }
  );
}
