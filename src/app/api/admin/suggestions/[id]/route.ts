import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helpers';
import { prisma } from '@/lib/database';
import { logAction } from '@/lib/access-log';

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

    const updated = await prisma.seriesSuggestion.update({
      where: { id: suggestionId },
      data: {
        ...(status ? { status } : {}),
        ...(adminNotes !== undefined ? { adminNotes } : {}),
      },
    });

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
