/**
 * Persistencia cross-device de layouts de dashboard.
 *
 * GET /api/user/dashboards/[key] → devuelve { layouts } o 404
 * PUT /api/user/dashboards/[key] body: { layouts } → upsert
 * DELETE /api/user/dashboards/[key] → borra (vuelve al default del cliente)
 *
 * Toda la persistencia esta scoped por userId (extraido de session).
 * Si el usuario no esta autenticado, 401 — el hook useDashboardLayout
 * cae a localStorage y no llama a estos endpoints.
 */
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/database';

const MAX_KEY_LEN = 64;

function isValidKey(key: string): boolean {
  if (typeof key !== 'string' || key.length === 0 || key.length > MAX_KEY_LEN) {
    return false;
  }
  return /^[a-zA-Z0-9_-]+$/.test(key);
}

interface RouteContext {
  params: Promise<{ key: string }>;
}

export async function GET(_req: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const { key } = await context.params;
  if (!isValidKey(key)) {
    return NextResponse.json({ error: 'invalid_key' }, { status: 400 });
  }

  const row = await prisma.userDashboardLayout.findUnique({
    where: {
      userId_dashboardKey: { userId: session.user.id, dashboardKey: key },
    },
  });

  if (!row) {
    return NextResponse.json({ layouts: null }, { status: 200 });
  }
  return NextResponse.json({ layouts: row.layouts }, { status: 200 });
}

export async function PUT(req: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const { key } = await context.params;
  if (!isValidKey(key)) {
    return NextResponse.json({ error: 'invalid_key' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }
  if (
    !body ||
    typeof body !== 'object' ||
    !('layouts' in body) ||
    !body.layouts ||
    typeof body.layouts !== 'object'
  ) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const layouts = (body as { layouts: object }).layouts;

  await prisma.userDashboardLayout.upsert({
    where: {
      userId_dashboardKey: { userId: session.user.id, dashboardKey: key },
    },
    create: {
      userId: session.user.id,
      dashboardKey: key,
      layouts: layouts as never,
    },
    update: {
      layouts: layouts as never,
    },
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}

export async function DELETE(_req: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const { key } = await context.params;
  if (!isValidKey(key)) {
    return NextResponse.json({ error: 'invalid_key' }, { status: 400 });
  }

  await prisma.userDashboardLayout.deleteMany({
    where: { userId: session.user.id, dashboardKey: key },
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}
