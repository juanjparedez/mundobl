import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helpers';
import { prisma } from '@/lib/database';
import { isEmailConfigured, sendEmail, unsubscribeUrl } from '@/lib/email';
import { renderAnnouncementEmail } from '@/lib/email-templates';

// 80 envios secuenciales a ~500ms cada uno se pasan del limite default de
// una lambda. Con concurrencia acotada entra sobrado, y el tope alto queda
// como red por si la lista crece.
export const maxDuration = 60;
const CONCURRENCY = 5;

const SITE_URL = 'https://mundobl.com.ar';

/**
 * Resuelve a quien le toca este anuncio por correo.
 *
 * La audiencia del anuncio acota, pero el filtro que manda siempre es
 * `emailEnabled`: sin opt-in explicito no se le escribe a nadie, sin
 * importar que diga la audiencia. EVERYONE incluye anonimos en el banner;
 * por correo, obviamente, solo alcanza a los que tienen cuenta.
 */
async function resolveRecipients(announcement: {
  id: number;
  audience: string;
}): Promise<{ id: string; email: string }[]> {
  const emailOptIn = {
    banned: false,
    notificationPrefs: { is: { emailEnabled: true } },
  } as const;

  if (announcement.audience === 'SPECIFIC_USERS') {
    const rows = await prisma.announcementRecipient.findMany({
      where: { announcementId: announcement.id, user: emailOptIn },
      select: { user: { select: { id: true, email: true } } },
    });
    return rows.map((row) => row.user);
  }

  const where =
    announcement.audience === 'NOTIFICATIONS_ENABLED'
      ? {
          banned: false,
          notificationPrefs: { is: { emailEnabled: true, pushEnabled: true } },
        }
      : emailOptIn;

  return prisma.user.findMany({ where, select: { id: true, email: true } });
}

/** Corre las tareas de a `limit` para no atropellar el rate limit de Resend. */
async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  task: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, () =>
    (async () => {
      while (cursor < items.length) {
        const index = cursor++;
        results[index] = await task(items[index]);
      }
    })()
  );
  await Promise.all(workers);
  return results;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireRole(['ADMIN']);
    if (!authResult.authorized) return authResult.response;

    const id = Number.parseInt((await params).id, 10);
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    if (!isEmailConfigured()) {
      return NextResponse.json(
        { error: 'Falta configurar RESEND_API_KEY antes de poder enviar.' },
        { status: 503 }
      );
    }

    const announcement = await prisma.announcement.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        body: true,
        audience: true,
        linkUrl: true,
        linkLabel: true,
        emailSentAt: true,
      },
    });
    if (!announcement) {
      return NextResponse.json(
        { error: 'Anuncio no encontrado' },
        { status: 404 }
      );
    }

    const body: unknown = await request.json().catch(() => null);
    const data =
      body && typeof body === 'object' ? (body as Record<string, unknown>) : {};

    // Reenviar tiene que ser deliberado. Mandarle dos veces el mismo mail a
    // toda la lista es el error mas caro de este canal: no se puede
    // deshacer y es exactamente lo que hace que la gente marque spam.
    if (announcement.emailSentAt && data.force !== true) {
      return NextResponse.json(
        {
          error: 'Este anuncio ya se envió por correo.',
          emailSentAt: announcement.emailSentAt,
        },
        { status: 409 }
      );
    }

    const recipients = await resolveRecipients(announcement);
    if (recipients.length === 0) {
      return NextResponse.json({
        sent: 0,
        failed: 0,
        recipients: 0,
        note: 'Nadie tiene los correos activados todavía.',
      });
    }

    const results = await mapWithConcurrency(
      recipients,
      CONCURRENCY,
      async (recipient) => {
        const unsubUrl = unsubscribeUrl(recipient.id, SITE_URL);
        const { subject, html, text } = renderAnnouncementEmail({
          title: announcement.title,
          body: announcement.body,
          linkUrl: announcement.linkUrl,
          linkLabel: announcement.linkLabel,
          unsubscribeUrl: unsubUrl,
          siteUrl: SITE_URL,
        });
        return sendEmail({
          to: recipient.email,
          // El asunto lo define la plantilla, no la ruta: asi vive junto al
          // resto del texto del correo y no se desincroniza.
          subject,
          html,
          text,
          unsubscribeUrl: unsubUrl,
        });
      }
    );

    const sent = results.filter((r) => r.success).length;
    const failed = results.length - sent;

    // Se marca como enviado aunque alguno falle: el anuncio ya salio, y un
    // reenvio a ciegas volveria a escribirle a los que si lo recibieron.
    await prisma.announcement.update({
      where: { id },
      data: { emailSentAt: new Date(), emailSentCount: sent },
    });

    return NextResponse.json({
      sent,
      failed,
      recipients: recipients.length,
      errors: results
        .filter((r) => !r.success)
        .slice(0, 5)
        .map((r) => r.error ?? 'error desconocido'),
    });
  } catch (error) {
    console.error('[admin/announcements/[id]/email POST]', error);
    return NextResponse.json(
      { error: 'No se pudo enviar el anuncio.' },
      { status: 500 }
    );
  }
}
