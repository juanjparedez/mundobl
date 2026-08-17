import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helpers';
import { prisma } from '@/lib/database';
import { logAction } from '@/lib/access-log';
import type { Announcement, Prisma } from '@/generated/prisma';

interface AnnouncementInput {
  title?: string;
  body?: string;
  tone?: string;
  audience?: string;
  surface?: string;
  template?: string;
  pages?: string[];
  dismissible?: boolean;
  linkUrl?: string | null;
  linkLabel?: string | null;
  isActive?: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  recipientUserIds?: string[];
}

/**
 * Reemplaza el set de destinatarios (SPECIFIC_USERS) por el nuevo, en una
 * transaccion junto con el update del resto de los campos. Diff simple:
 * borra los que ya no estan, crea los nuevos (skipDuplicates cubre los que
 * no cambiaron).
 */
async function updateWithRecipients(
  announcementId: number,
  data: Prisma.AnnouncementUpdateInput,
  recipientUserIds: string[]
): Promise<Announcement> {
  const ops: Prisma.PrismaPromise<unknown>[] = [
    prisma.announcementRecipient.deleteMany({
      where: {
        announcementId,
        ...(recipientUserIds.length > 0 && {
          userId: { notIn: recipientUserIds },
        }),
      },
    }),
  ];
  if (recipientUserIds.length > 0) {
    // createMany rechaza `data: []` (pide al menos un elemento) — solo se
    // agrega este paso si realmente hay destinatarios nuevos.
    ops.push(
      prisma.announcementRecipient.createMany({
        data: recipientUserIds.map((userId) => ({ announcementId, userId })),
        skipDuplicates: true,
      })
    );
  }
  ops.push(prisma.announcement.update({ where: { id: announcementId }, data }));

  const results = await prisma.$transaction(ops);
  return results[results.length - 1] as Announcement;
}

// PATCH /api/admin/announcements/[id] — editar (incluye toggle isActive)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireRole(['ADMIN']);
  if (!authResult.authorized) return authResult.response;

  const { id } = await params;
  const announcementId = Number(id);
  if (!Number.isInteger(announcementId)) {
    return NextResponse.json({ error: 'id inválido' }, { status: 400 });
  }

  try {
    const body = (await request.json()) as AnnouncementInput;
    const data: Prisma.AnnouncementUpdateInput = {};

    if (body.title !== undefined) {
      if (!body.title.trim()) {
        return NextResponse.json(
          { error: 'title no puede estar vacío' },
          { status: 400 }
        );
      }
      data.title = body.title.trim();
    }
    if (body.body !== undefined) {
      if (!body.body.trim()) {
        return NextResponse.json(
          { error: 'body no puede estar vacío' },
          { status: 400 }
        );
      }
      data.body = body.body.trim();
    }
    if (body.tone !== undefined) {
      data.tone = body.tone as Prisma.AnnouncementUpdateInput['tone'];
    }
    if (body.audience !== undefined) {
      data.audience =
        body.audience as Prisma.AnnouncementUpdateInput['audience'];
    }
    if (body.surface !== undefined) {
      data.surface = body.surface as Prisma.AnnouncementUpdateInput['surface'];
    }
    if (body.template !== undefined) {
      data.template =
        body.template as Prisma.AnnouncementUpdateInput['template'];
    }
    if (body.pages !== undefined) {
      data.pages = Array.isArray(body.pages) ? body.pages : [];
    }
    if (body.dismissible !== undefined) data.dismissible = body.dismissible;
    if (body.linkUrl !== undefined) data.linkUrl = body.linkUrl?.trim() || null;
    if (body.linkLabel !== undefined) {
      data.linkLabel = body.linkLabel?.trim() || null;
    }
    if (body.isActive !== undefined) data.isActive = body.isActive;
    if (body.startsAt !== undefined) {
      data.startsAt = body.startsAt ? new Date(body.startsAt) : null;
    }
    if (body.endsAt !== undefined) {
      data.endsAt = body.endsAt ? new Date(body.endsAt) : null;
    }

    const updated =
      body.recipientUserIds !== undefined
        ? await updateWithRecipients(announcementId, data, [
            ...new Set(body.recipientUserIds),
          ])
        : await prisma.announcement.update({
            where: { id: announcementId },
            data,
          });

    logAction('UPDATE', request.nextUrl.pathname, 'PATCH', authResult.userId);
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating announcement:', error);
    return NextResponse.json(
      { error: 'Error al actualizar el anuncio' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/announcements/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireRole(['ADMIN']);
  if (!authResult.authorized) return authResult.response;

  const { id } = await params;
  const announcementId = Number(id);
  if (!Number.isInteger(announcementId)) {
    return NextResponse.json({ error: 'id inválido' }, { status: 400 });
  }

  try {
    await prisma.announcement.delete({ where: { id: announcementId } });
    logAction('DELETE', request.nextUrl.pathname, 'DELETE', authResult.userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    return NextResponse.json(
      { error: 'Error al eliminar el anuncio' },
      { status: 500 }
    );
  }
}
