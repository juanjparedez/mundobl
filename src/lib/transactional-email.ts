import { prisma } from './database';
import { isEmailConfigured, sendEmail } from './email';
import type { EmailRender } from './email-templates';

/**
 * Manda un correo TRANSACCIONAL (ver email-templates.ts) a un usuario por
 * su id. Responde a algo que la persona hizo, asi que no se condiciona a
 * `NotificationPrefs.emailEnabled`, que gobierna solo los envios masivos.
 *
 * Se hace `await` desde la route para que la lambda no se congele antes de
 * mandar, pero nunca tira: un fallo de Resend no puede tumbar la operacion
 * que lo disparo, que ya quedo guardada y avisada in-app.
 */
export async function sendTransactionalEmailToUser(
  userId: string,
  rendered: EmailRender
): Promise<void> {
  if (!isEmailConfigured()) return;
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, banned: true },
    });
    if (!user?.email || user.banned) return;
    await sendEmail({
      to: user.email,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
    });
  } catch (error) {
    console.error('[transactional-email] No se pudo enviar:', error);
  }
}
