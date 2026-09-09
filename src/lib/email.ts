/**
 * Email sender utility for MundoBL.
 *
 * Admite proveedores vía variables de entorno:
 * 1. RESEND (Recomendado para Vercel / Next.js):
 *    - RESEND_API_KEY: clave de API de Resend
 *    - EMAIL_FROM: remitente configurado (ej: MundoBL <notificaciones@mundobl.com.ar>)
 *
 * Si no hay proveedor configurado, loguea en consola en desarrollo
 * sin arrojar errores bloqueantes.
 *
 * Incluye ademas el token de baja (HMAC) que viaja en cada envio: vive aca
 * y no en su propio modulo porque solo tiene sentido junto al envio.
 */
import crypto from 'crypto';

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  /**
   * URL de baja. Si viene, se manda en List-Unsubscribe + One-Click
   * (RFC 8058): Gmail y Yahoo lo piden a remitentes de volumen y mejora la
   * entrega siempre. Sin esto, la unica salida del usuario es marcar spam
   * — y eso si castiga la reputacion del dominio.
   */
  unsubscribeUrl?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

const DEFAULT_FROM =
  process.env.EMAIL_FROM || 'MundoBL <notificaciones@mundobl.com.ar>';

/** True si hay proveedor configurado y se puede enviar de verdad. */
export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
  from = DEFAULT_FROM,
  unsubscribeUrl: unsubUrl,
}: SendEmailOptions): Promise<SendEmailResult> {
  const recipients = Array.isArray(to) ? to : [to];

  if (recipients.length === 0) {
    return { success: false, error: 'No recipients provided' };
  }

  // 1. Proveedor: Resend (vía API REST directa, sin dependencias pesadas)
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: recipients,
          subject,
          html,
          text: text || html.replace(/<[^>]+>/g, ''),
          ...(unsubUrl
            ? {
                headers: {
                  'List-Unsubscribe': `<${unsubUrl}>`,
                  'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
                },
              }
            : {}),
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        console.error('[Email] Resend error:', err);
        return {
          success: false,
          error: err.message || `Resend responded with ${response.status}`,
        };
      }

      const data = await response.json();
      return { success: true, messageId: data.id };
    } catch (error) {
      console.error('[Email] Failed to send via Resend:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // 2. Proveedor no configurado (fallback de desarrollo / logs)
  if (process.env.NODE_ENV !== 'production') {
    console.log('[Email Mock] Se enviaría correo:');
    console.log(`  Para: ${recipients.join(', ')}`);
    console.log(`  Asunto: ${subject}`);
    console.log(`  Remitente: ${from}`);
    return { success: true, messageId: `mock-${Date.now()}` };
  }

  console.warn(
    '[Email] No hay proveedor de correo configurado (definir RESEND_API_KEY en .env).'
  );
  return {
    success: false,
    error: 'Email provider not configured. Please set RESEND_API_KEY.',
  };
}

/**
 * Token de baja: HMAC del userId con AUTH_SECRET.
 *
 * Firmado y no guardado a proposito — no hay tabla de tokens que mantener,
 * el link no caduca (un mail viejo tiene que poder darte de baja igual) y
 * rotando AUTH_SECRET se invalidan todos de una. Como solo apaga una
 * preferencia, no da acceso a nada mas.
 */
export function unsubscribeToken(userId: string): string {
  const secret = process.env.AUTH_SECRET ?? '';
  return crypto
    .createHmac('sha256', secret)
    .update(`unsubscribe:${userId}`)
    .digest('hex')
    .slice(0, 32);
}

export function verifyUnsubscribeToken(userId: string, token: string): boolean {
  const expected = unsubscribeToken(userId);
  // timingSafeEqual explota si los largos difieren: hay que chequearlo antes.
  if (token.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}

export function unsubscribeUrl(userId: string, baseUrl: string): string {
  return `${baseUrl}/api/email/unsubscribe?u=${encodeURIComponent(userId)}&t=${unsubscribeToken(userId)}`;
}
