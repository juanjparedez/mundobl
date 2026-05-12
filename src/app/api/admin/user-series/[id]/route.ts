import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requireRole } from '@/lib/auth-helpers';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * DELETE /api/admin/user-series/[id]
 *
 * Borra un aporte USER_EMBED. Cascade en schema borra Season/Episode/
 * tags/genres/dubbings/actors asociados. Si la serie tiene comments,
 * reviews o subscriptions externos, el cascade tambien los borra
 * (esos no deberian existir porque /api/series/[id]/subscribe y
 * /api/reviews POST rechazan USER_EMBED, pero por las dudas se devuelve
 * un counter informativo).
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = await requireRole(['ADMIN']);
  if (!auth.authorized) return auth.response;

  const { id } = await context.params;
  const seriesId = parseInt(id, 10);
  if (isNaN(seriesId)) {
    return NextResponse.json({ error: 'ID invalido.' }, { status: 400 });
  }

  const existing = await prisma.series.findUnique({
    where: { id: seriesId },
    select: {
      id: true,
      origin: true,
      _count: {
        select: { comments: true, reviews: true, subscriptions: true },
      },
    },
  });
  if (!existing) {
    return NextResponse.json(
      { error: 'Serie no encontrada.' },
      { status: 404 }
    );
  }
  if (existing.origin !== 'USER_EMBED') {
    return NextResponse.json(
      { error: 'Solo se puede borrar USER_EMBED desde este endpoint.' },
      { status: 422 }
    );
  }

  await prisma.series.delete({ where: { id: seriesId } });

  return NextResponse.json({
    ok: true,
    deletedDependents: existing._count,
  });
}
