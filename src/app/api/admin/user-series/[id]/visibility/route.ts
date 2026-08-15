import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requireRole } from '@/lib/auth-helpers';

interface RouteContext {
  params: Promise<{ id: string }>;
}

const ALLOWED = new Set(['VISIBLE', 'HIDDEN', 'PENDING_REVIEW', 'REJECTED']);

/**
 * POST /api/admin/user-series/[id]/visibility
 * Body: { visibility: "VISIBLE" | "HIDDEN" | "PENDING_REVIEW" | "REJECTED", adminNotes?: string }
 */
export async function POST(request: NextRequest, context: RouteContext) {
  const auth = await requireRole(['ADMIN', 'MODERATOR']);
  if (!auth.authorized) return auth.response;

  const { id } = await context.params;
  const seriesId = parseInt(id, 10);
  if (isNaN(seriesId)) {
    return NextResponse.json({ error: 'ID invalido.' }, { status: 400 });
  }

  let body: { visibility?: string; adminNotes?: string };
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
    select: { id: true, title: true, origin: true, submittedById: true },
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

  const updated = await prisma.series.update({
    where: { id: seriesId },
    data: { visibility },
    select: { id: true, title: true, visibility: true, submittedById: true },
  });

  // Notificar al usuario que aportó la serie
  if (updated.submittedById) {
    if (visibility === 'VISIBLE') {
      await prisma.notification.create({
        data: {
          userId: updated.submittedById,
          type: 'series_approved',
          title: '¡Tu serie sugerida fue aprobada!',
          body: `Tu aporte "${updated.title}" fue aprobado y ya está disponible para ver en MundoBL.`,
          linkPath: `/ver/${updated.id}`,
          refType: 'series',
          refId: String(updated.id),
        },
      }).catch(() => {});
    } else if (visibility === 'REJECTED') {
      await prisma.notification.create({
        data: {
          userId: updated.submittedById,
          type: 'series_rejected',
          title: 'Aporte no aprobado',
          body: `Tu aporte "${updated.title}" no pudo ser publicado. ${body.adminNotes ? `Motivo: ${body.adminNotes}` : ''}`.trim(),
          refType: 'series',
          refId: String(updated.id),
        },
      }).catch(() => {});
    }
  }

  return NextResponse.json({ ok: true, series: updated });
}
