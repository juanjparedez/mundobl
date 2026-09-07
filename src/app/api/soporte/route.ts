import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helpers';
import { prisma } from '@/lib/database';
import { notifyStaffOfSupportThread } from '@/lib/notifications';

const SUBJECT_MAX = 140;
const BODY_MAX = 4000;

/**
 * Abre un hilo privado de soporte entre un colaborador y curaduria.
 * A diferencia de /feedback (FeatureRequest), nada de esto es publico.
 */
export async function POST(request: NextRequest) {
  try {
    // ADMIN entra tambien porque /admin/colaborador es su vista de prueba
    // del panel: si no, no puede reproducir lo que ve un colaborador.
    const authResult = await requireRole(['COLLABORATOR', 'ADMIN']);
    if (!authResult.authorized) return authResult.response;

    const body: unknown = await request.json();
    const data =
      body && typeof body === 'object' ? (body as Record<string, unknown>) : {};

    const subject = typeof data.subject === 'string' ? data.subject.trim() : '';
    const message = typeof data.message === 'string' ? data.message.trim() : '';

    if (!subject || !message) {
      return NextResponse.json(
        { error: 'Hace falta un asunto y un mensaje.' },
        { status: 400 }
      );
    }
    if (subject.length > SUBJECT_MAX || message.length > BODY_MAX) {
      return NextResponse.json(
        { error: 'El asunto o el mensaje son demasiado largos.' },
        { status: 400 }
      );
    }

    const thread = await prisma.supportThread.create({
      data: {
        subject,
        userId: authResult.userId,
        messages: {
          create: {
            body: message,
            userId: authResult.userId,
            fromStaff: false,
          },
        },
      },
      select: { id: true, subject: true },
    });

    await notifyStaffOfSupportThread({
      threadId: thread.id,
      subject: thread.subject,
      excerpt: message.slice(0, 160),
      authorId: authResult.userId,
    });

    return NextResponse.json(thread, { status: 201 });
  } catch (error) {
    console.error('[soporte POST]', error);
    return NextResponse.json(
      { error: 'No se pudo abrir la consulta.' },
      { status: 500 }
    );
  }
}
