import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requireRole } from '@/lib/auth-helpers';

interface RouteContext {
  params: Promise<{ id: string }>;
}

const ALLOWED = new Set(['VISIBLE', 'HIDDEN']);

/**
 * POST /api/admin/user-series/[id]/visibility
 * Body: { visibility: "VISIBLE" | "HIDDEN" }
 *
 * Solo aplica a series con origin='USER_EMBED'. Sirve para que Flor
 * oculte un aporte post-hoc sin borrarlo (el creador sigue viendolo
 * en /ver/[id]).
 */
export async function POST(request: NextRequest, context: RouteContext) {
  const auth = await requireRole(['ADMIN']);
  if (!auth.authorized) return auth.response;

  const { id } = await context.params;
  const seriesId = parseInt(id, 10);
  if (isNaN(seriesId)) {
    return NextResponse.json({ error: 'ID invalido.' }, { status: 400 });
  }

  let body: { visibility?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalido.' }, { status: 400 });
  }
  const visibility = (body?.visibility ?? '').toString();
  if (!ALLOWED.has(visibility)) {
    return NextResponse.json(
      { error: `visibility debe ser uno de: ${[...ALLOWED].join(', ')}` },
      { status: 400 }
    );
  }

  const existing = await prisma.series.findUnique({
    where: { id: seriesId },
    select: { id: true, origin: true },
  });
  if (!existing) {
    return NextResponse.json(
      { error: 'Serie no encontrada.' },
      { status: 404 }
    );
  }
  if (existing.origin !== 'USER_EMBED') {
    return NextResponse.json(
      {
        error:
          'Solo se puede cambiar la visibilidad de aportes USER_EMBED desde este endpoint.',
      },
      { status: 422 }
    );
  }

  await prisma.series.update({
    where: { id: seriesId },
    data: { visibility },
  });

  return NextResponse.json({ ok: true, visibility });
}
