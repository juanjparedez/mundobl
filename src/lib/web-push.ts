import webpush from 'web-push';
import { prisma } from './database';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT =
  process.env.VAPID_SUBJECT ?? 'mailto:admin@mundobl.com.ar';

let configured = false;
function ensureConfigured(): boolean {
  if (configured) return true;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.warn(
      '[web-push] VAPID keys missing. Set NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY env vars.'
    );
    return false;
  }
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  configured = true;
  return true;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  // Tipo de evento: el SW lo usa para agrupar y para que el cliente
  // pueda decidir si reemplazar una notificacion previa similar.
  type?: string;
  // Cualquier metadata extra que el SW pueda necesitar (e.g. seriesId
  // para abrir una ruta especifica).
  data?: Record<string, unknown>;
}

interface SendPushOptions {
  // Si true, ignora preferencias del usuario (p.ej. test).
  bypassPrefs?: boolean;
}

/**
 * Envia una push notification a TODAS las suscripciones del usuario.
 * - Si el usuario tiene push deshabilitado, no envia.
 * - Si la preferencia del tipo de evento esta apagada, no envia.
 * - Si esta dentro de quiet hours, no envia push (pero el llamador
 *   puede seguir creando la notificacion in-app).
 * - Subscripciones con 410/404 se borran automaticamente.
 *
 * Devuelve cuantas fueron entregadas exitosamente.
 */
export async function sendPushToUser(
  userId: string,
  payload: PushPayload,
  opts: SendPushOptions = {}
): Promise<number> {
  if (!ensureConfigured()) return 0;

  if (!opts.bypassPrefs) {
    const allowed = await isUserAllowedToReceivePush(userId, payload.type);
    if (!allowed) return 0;
  }

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  });
  if (subscriptions.length === 0) return 0;

  const json = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url,
    tag: payload.tag,
    type: payload.type,
    data: payload.data ?? {},
  });

  const expiredEndpoints: string[] = [];
  let delivered = 0;

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.authKey },
          },
          json,
          { TTL: 60 * 60 * 24 } // 1 dia
        );
        delivered += 1;
        // No bloqueamos en el update — fire and forget.
        prisma.pushSubscription
          .update({
            where: { id: sub.id },
            data: { lastUsedAt: new Date() },
          })
          .catch(() => undefined);
      } catch (err: unknown) {
        const status =
          err && typeof err === 'object' && 'statusCode' in err
            ? (err as { statusCode: number }).statusCode
            : null;
        // 404 / 410 = subscripcion invalida o expirada → borrar.
        if (status === 404 || status === 410) {
          expiredEndpoints.push(sub.endpoint);
        } else {
          console.error('[web-push] send error:', status, err);
        }
      }
    })
  );

  if (expiredEndpoints.length > 0) {
    await prisma.pushSubscription
      .deleteMany({ where: { endpoint: { in: expiredEndpoints } } })
      .catch(() => undefined);
  }

  return delivered;
}

/**
 * Resuelve si un usuario puede recibir push de un evento dado segun
 * sus preferencias y quiet hours. Si no hay fila de prefs, defaults.
 */
export async function isUserAllowedToReceivePush(
  userId: string,
  type?: string
): Promise<boolean> {
  const prefs = await prisma.notificationPrefs.findUnique({
    where: { userId },
  });
  // Sin prefs = todo permitido (defaults).
  if (!prefs) return true;
  if (!prefs.pushEnabled) return false;

  // Mapeo type → flag.
  if (type === 'season_added' && !prefs.notifySeasonAdded) return false;
  if (type === 'content_added' && !prefs.notifyContentAdded) return false;
  if (type === 'review_published' && !prefs.notifyReviewPublished) return false;
  if (type === 'comment_thread' && !prefs.notifyCommentReply) return false;

  // Quiet hours: si esta en la ventana, omitimos push (pero el caller
  // puede seguir creando la notificacion in-app).
  if (prefs.quietStart && prefs.quietEnd) {
    if (isInQuietHours(prefs.quietStart, prefs.quietEnd)) return false;
  }

  return true;
}

/**
 * Resuelve si la notificacion in-app puede crearse (independiente de
 * push). Por ahora respetamos solo el toggle por tipo: el inbox debe
 * verse siempre.
 */
export async function isUserAllowedToReceiveInApp(
  userId: string,
  type?: string
): Promise<boolean> {
  const prefs = await prisma.notificationPrefs.findUnique({
    where: { userId },
  });
  if (!prefs) return true;
  if (type === 'season_added' && !prefs.notifySeasonAdded) return false;
  if (type === 'content_added' && !prefs.notifyContentAdded) return false;
  if (type === 'review_published' && !prefs.notifyReviewPublished) return false;
  if (type === 'comment_thread' && !prefs.notifyCommentReply) return false;
  return true;
}

function parseHHMM(value: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  if (isNaN(h) || isNaN(min) || h > 23 || min > 59) return null;
  return h * 60 + min;
}

function isInQuietHours(start: string, end: string): boolean {
  const s = parseHHMM(start);
  const e = parseHHMM(end);
  if (s === null || e === null) return false;
  const now = new Date();
  const nowMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  // Ventana puede cruzar medianoche (e.g., 22:00 → 07:00).
  if (s <= e) return nowMinutes >= s && nowMinutes < e;
  return nowMinutes >= s || nowMinutes < e;
}

export const VAPID_PUBLIC = VAPID_PUBLIC_KEY ?? null;
