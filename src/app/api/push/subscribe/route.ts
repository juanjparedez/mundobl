import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requireAuth } from '@/lib/auth-helpers';

interface SubscribeBody {
  endpoint?: string;
  keys?: { p256dh?: string; auth?: string };
}

/**
 * POST /api/push/subscribe
 * Registra una suscripcion del navegador del usuario. Es idempotente:
 * si el endpoint ya esta registrado actualiza las keys y el lastUsedAt.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.authorized) return auth.response;

  const body = (await request.json().catch(() => null)) as SubscribeBody | null;
  if (!body?.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
    return NextResponse.json(
      { error: 'subscription invalida' },
      { status: 400 }
    );
  }

  const userAgent = request.headers.get('user-agent')?.slice(0, 500) ?? null;

  const sub = await prisma.pushSubscription.upsert({
    where: { endpoint: body.endpoint },
    create: {
      userId: auth.userId,
      endpoint: body.endpoint,
      p256dh: body.keys.p256dh,
      authKey: body.keys.auth,
      userAgent,
    },
    update: {
      userId: auth.userId,
      p256dh: body.keys.p256dh,
      authKey: body.keys.auth,
      userAgent,
      lastUsedAt: new Date(),
    },
    select: { id: true, createdAt: true, lastUsedAt: true, userAgent: true },
  });

  return NextResponse.json({ ok: true, subscription: sub });
}

/**
 * DELETE /api/push/subscribe?endpoint=...
 * Borra una suscripcion del usuario. Si no se pasa endpoint, borra
 * todas las del usuario (uso: el toggle global de "desactivar push").
 */
export async function DELETE(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.authorized) return auth.response;

  const endpoint = request.nextUrl.searchParams.get('endpoint');
  if (endpoint) {
    await prisma.pushSubscription.deleteMany({
      where: { userId: auth.userId, endpoint },
    });
  } else {
    await prisma.pushSubscription.deleteMany({
      where: { userId: auth.userId },
    });
  }
  return NextResponse.json({ ok: true });
}

/**
 * GET /api/push/subscribe
 * Devuelve metadata de las suscripciones del usuario para mostrar
 * en settings (cuantos dispositivos, cuando se conectaron por ultima vez).
 */
export async function GET() {
  const auth = await requireAuth();
  if (!auth.authorized) return auth.response;

  const subs = await prisma.pushSubscription.findMany({
    where: { userId: auth.userId },
    orderBy: { lastUsedAt: 'desc' },
    select: {
      id: true,
      endpoint: true,
      userAgent: true,
      createdAt: true,
      lastUsedAt: true,
    },
  });
  return NextResponse.json({ subscriptions: subs });
}
