import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helpers';
import { prisma } from '@/lib/database';
import { logAction } from '@/lib/access-log';
import { notifyUser } from '@/lib/notifications';
import { getSeriesUrl } from '@/lib/slug';
import {
  renderContributionReviewedEmail,
  SITE_URL,
} from '@/lib/email-templates';
import { sendTransactionalEmailToUser } from '@/lib/transactional-email';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole(['ADMIN', 'MODERATOR']);
    if (!auth.authorized) return auth.response;

    const resolvedParams = await params;
    const suggestionId = parseInt(resolvedParams.id, 10);
    if (isNaN(suggestionId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const { status, adminNotes } = body;

    const validStatuses = ['PENDING', 'APPROVED', 'DISCARDED'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Estado no válido' }, { status: 400 });
    }

    const previous = await prisma.seriesSuggestion.findUnique({
      where: { id: suggestionId },
      select: {
        status: true,
        userId: true,
        series: { select: { id: true, title: true } },
      },
    });
    if (!previous) {
      return NextResponse.json(
        { error: 'Sugerencia no encontrada' },
        { status: 404 }
      );
    }

    const updated = await prisma.seriesSuggestion.update({
      where: { id: suggestionId },
      data: {
        ...(status ? { status } : {}),
        ...(adminNotes !== undefined ? { adminNotes } : {}),
      },
    });

    // Igual que en el glosario: quien aporta se entera de como termino su
    // aporte, in-app y por mail. Solo cuando el estado cambio a uno final y
    // nunca al moderador que revisa lo suyo.
    if (
      previous.userId &&
      updated.status !== previous.status &&
      updated.status !== 'PENDING' &&
      previous.userId !== auth.userId
    ) {
      const approved = updated.status === 'APPROVED';
      const linkPath = getSeriesUrl(previous.series.id, previous.series.title);
      await notifyUser({
        userId: previous.userId,
        type: 'series_suggestion_status',
        title: approved
          ? `Sumamos tu aporte a "${previous.series.title}"`
          : `Revisamos tu aporte a "${previous.series.title}"`,
        body: approved
          ? 'Gracias: la ficha ya tiene tu correccion.'
          : updated.adminNotes ||
            'Por ahora no lo sumamos. Podes proponerlo de nuevo con mas contexto.',
        linkPath,
        refType: 'series_suggestion',
        refId: suggestionId,
      }).catch(() => {
        /* never block the main op */
      });
      await sendTransactionalEmailToUser(
        previous.userId,
        renderContributionReviewedEmail({
          itemName: previous.series.title,
          approved,
          note: updated.adminNotes,
          url: SITE_URL + linkPath,
        })
      );
    }

    logAction('UPDATE', request.nextUrl.pathname, 'PATCH', auth.userId);
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating suggestion:', error);
    return NextResponse.json(
      { error: 'Error al actualizar la sugerencia' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole(['ADMIN', 'MODERATOR']);
    if (!auth.authorized) return auth.response;

    const resolvedParams = await params;
    const suggestionId = parseInt(resolvedParams.id, 10);
    if (isNaN(suggestionId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    await prisma.seriesSuggestion.delete({
      where: { id: suggestionId },
    });

    logAction('DELETE', request.nextUrl.pathname, 'DELETE', auth.userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting suggestion:', error);
    return NextResponse.json(
      { error: 'Error al eliminar la sugerencia' },
      { status: 500 }
    );
  }
}
