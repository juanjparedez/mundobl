import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/database';
import { notifyUser, notifyStaffOfSupportThread } from '@/lib/notifications';

const BODY_MAX = 4000;

const STAFF_ROLES = ['ADMIN', 'MODERATOR'] as const;

type StaffRole = (typeof STAFF_ROLES)[number];

function isStaff(role: string): role is StaffRole {
  return (STAFF_ROLES as readonly string[]).includes(role);
}

/** Responde en un hilo. Lo puede hacer su autor o cualquiera de curaduria. */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth();
    if (!authResult.authorized) return authResult.response;

    const id = Number.parseInt((await params).id, 10);
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const thread = await prisma.supportThread.findUnique({
      where: { id },
      select: { id: true, subject: true, userId: true },
    });
    if (!thread) {
      return NextResponse.json(
        { error: 'Consulta no encontrada' },
        { status: 404 }
      );
    }

    const staff = isStaff(authResult.role);
    const isAuthor = thread.userId === authResult.userId;
    if (!staff && !isAuthor) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body: unknown = await request.json();
    const data =
      body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
    const message = typeof data.message === 'string' ? data.message.trim() : '';

    if (!message) {
      return NextResponse.json(
        { error: 'El mensaje no puede estar vacío.' },
        { status: 400 }
      );
    }
    if (message.length > BODY_MAX) {
      return NextResponse.json(
        { error: 'El mensaje es demasiado largo.' },
        { status: 400 }
      );
    }

    const created = await prisma.$transaction(async (transaction) => {
      const created = await transaction.supportMessage.create({
        data: {
          threadId: id,
          body: message,
          userId: authResult.userId,
          fromStaff: staff,
        },
      });

      // El estado dice de quien es el turno. Responder tambien reabre un
      // hilo cerrado: si alguien tenia algo mas que decir, no hay que
      // obligarlo a abrir una consulta nueva por lo mismo.
      await transaction.supportThread.update({
        where: { id },
        data: { status: staff ? 'ANSWERED' : 'OPEN' },
      });

      return created;
    });

    if (staff) {
      // Al colaborador le avisamos siempre que curaduria contesta — es el
      // punto de todo el canal.
      await notifyUser({
        userId: thread.userId,
        type: 'support_reply',
        title: `Respondimos tu consulta: "${thread.subject}"`,
        body: message.slice(0, 160),
        linkPath: `/admin/colaborador/soporte/${thread.id}`,
        refType: 'support_thread',
        refId: thread.id,
      }).catch(() => {
        /* never block the main op */
      });
    } else {
      await notifyStaffOfSupportThread({
        threadId: thread.id,
        subject: thread.subject,
        excerpt: message.slice(0, 160),
        authorId: authResult.userId,
        isReply: true,
      });
    }

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('[soporte/[id] POST]', error);
    return NextResponse.json(
      { error: 'No se pudo enviar el mensaje.' },
      { status: 500 }
    );
  }
}

/** Cierra o reabre un hilo. Autor y curaduria pueden hacerlo. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth();
    if (!authResult.authorized) return authResult.response;

    const id = Number.parseInt((await params).id, 10);
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const body: unknown = await request.json();
    const data =
      body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
    const status = data.status;
    if (status !== 'OPEN' && status !== 'ANSWERED' && status !== 'CLOSED') {
      return NextResponse.json({ error: 'Estado no válido' }, { status: 400 });
    }

    const thread = await prisma.supportThread.findUnique({
      where: { id },
      select: { userId: true },
    });
    if (!thread) {
      return NextResponse.json(
        { error: 'Consulta no encontrada' },
        { status: 404 }
      );
    }

    if (!isStaff(authResult.role) && thread.userId !== authResult.userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const updated = await prisma.supportThread.update({
      where: { id },
      data: { status },
      select: { id: true, status: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[soporte/[id] PATCH]', error);
    return NextResponse.json(
      { error: 'No se pudo actualizar la consulta.' },
      { status: 500 }
    );
  }
}
