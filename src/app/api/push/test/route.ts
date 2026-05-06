import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { sendPushToUser } from '@/lib/web-push';

/**
 * POST /api/push/test
 * Envia una notificacion de prueba al usuario actual. Bypassa
 * preferencias (ignorando "push deshabilitado" y quiet hours) para
 * que el usuario pueda confirmar que llega aunque tenga el push
 * apagado por preferencia: el solo hecho de pedir test es accion
 * explicita y consentida.
 */
export async function POST() {
  const auth = await requireAuth();
  if (!auth.authorized) return auth.response;

  const delivered = await sendPushToUser(
    auth.userId,
    {
      title: 'MundoBL — Notificaciones activas',
      body: 'Si lees esto, los avisos llegan correctamente. Lo recibiras cuando haya novedades de tus series suscritas.',
      type: 'test',
      url: '/notificaciones',
      tag: 'mundobl-test',
    },
    { bypassPrefs: true }
  );

  return NextResponse.json({ ok: true, delivered });
}
