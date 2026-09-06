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
 */

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

const DEFAULT_FROM =
  process.env.EMAIL_FROM || 'MundoBL <notificaciones@mundobl.com.ar>';

export async function sendEmail({
  to,
  subject,
  html,
  text,
  from = DEFAULT_FROM,
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
