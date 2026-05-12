import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requireAuth } from '@/lib/auth-helpers';

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function resolveSeriesId(context: RouteContext) {
  const { id } = await context.params;
  const seriesId = parseInt(id, 10);
  if (isNaN(seriesId)) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: 'ID de serie invalido' },
        { status: 400 }
      ),
    };
  }
  return { ok: true as const, seriesId };
}

export async function GET(_req: Request, context: RouteContext) {
  const auth = await requireAuth();
  if (!auth.authorized) return auth.response;

  const resolved = await resolveSeriesId(context);
  if (!resolved.ok) return resolved.response;

  const subscription = await prisma.seriesSubscription.findUnique({
    where: {
      userId_seriesId: { userId: auth.userId, seriesId: resolved.seriesId },
    },
    select: { id: true },
  });

  return NextResponse.json({ subscribed: subscription !== null });
}

export async function POST(_req: Request, context: RouteContext) {
  const auth = await requireAuth();
  if (!auth.authorized) return auth.response;

  const resolved = await resolveSeriesId(context);
  if (!resolved.ok) return resolved.response;

  const series = await prisma.series.findUnique({
    where: { id: resolved.seriesId },
    select: { id: true, origin: true },
  });
  if (!series) {
    return NextResponse.json({ error: 'Serie no encontrada' }, { status: 404 });
  }
  if (series.origin === 'USER_EMBED') {
    return NextResponse.json(
      {
        error:
          'No se puede suscribir a una serie aportada por un usuario. Se podra suscribir cuando un admin la linkee con una serie del catalogo.',
      },
      { status: 422 }
    );
  }

  await prisma.seriesSubscription.upsert({
    where: {
      userId_seriesId: { userId: auth.userId, seriesId: resolved.seriesId },
    },
    create: { userId: auth.userId, seriesId: resolved.seriesId },
    update: {},
  });

  return NextResponse.json({ subscribed: true });
}

export async function DELETE(_req: Request, context: RouteContext) {
  const auth = await requireAuth();
  if (!auth.authorized) return auth.response;

  const resolved = await resolveSeriesId(context);
  if (!resolved.ok) return resolved.response;

  await prisma.seriesSubscription.deleteMany({
    where: { userId: auth.userId, seriesId: resolved.seriesId },
  });

  return NextResponse.json({ subscribed: false });
}
