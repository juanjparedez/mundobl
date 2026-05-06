/**
 * Helpers de cliente para Web Push notifications.
 *
 * Politica firme: NUNCA llamar a Notification.requestPermission()
 * automaticamente. Solo desde una accion explicita del usuario.
 *
 * Flujo completo:
 *  1. enablePush() pide permiso → suscribe via PushManager → POST al
 *     server con el endpoint+keys.
 *  2. disablePush() unsubscribe del PushManager → DELETE al server.
 *  3. isPushSubscribed() chequea si hay subscripcion activa en este
 *     dispositivo (no solo el flag).
 */

export type PushPermission = 'unsupported' | 'denied' | 'default' | 'granted';

export interface EnablePushResult {
  ok: boolean;
  permission: PushPermission;
  reason?: string;
}

export function getPushPermission(): PushPermission {
  if (typeof window === 'undefined') return 'unsupported';
  if (!('Notification' in window)) return 'unsupported';
  if (!('serviceWorker' in navigator)) return 'unsupported';
  if (!('PushManager' in window)) return 'unsupported';
  return Notification.permission as PushPermission;
}

/**
 * Devuelve si HAY una subscripcion activa en este browser para este
 * usuario. Esto es la fuente de verdad — no confiamos en localStorage.
 */
export async function isPushSubscribed(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (getPushPermission() !== 'granted') return false;
  try {
    const registration = await navigator.serviceWorker.ready;
    const sub = await registration.pushManager.getSubscription();
    return sub !== null;
  } catch {
    return false;
  }
}

async function fetchVapidPublicKey(): Promise<string | null> {
  try {
    const res = await fetch('/api/push/vapid-public-key');
    if (!res.ok) return null;
    const data: { key: string | null } = await res.json();
    return data.key;
  } catch {
    return null;
  }
}

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export async function enablePush(): Promise<EnablePushResult> {
  const initial = getPushPermission();
  if (initial === 'unsupported') {
    return { ok: false, permission: 'unsupported', reason: 'unsupported' };
  }

  let perm: PushPermission = initial;
  if (perm === 'default') {
    const requested = await Notification.requestPermission();
    perm = requested as PushPermission;
  }
  if (perm !== 'granted') {
    return { ok: false, permission: perm, reason: 'permission-denied' };
  }

  const vapid = await fetchVapidPublicKey();
  if (!vapid) {
    return { ok: false, permission: perm, reason: 'no-vapid-key' };
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    let sub = await registration.pushManager.getSubscription();
    if (!sub) {
      // El tipo de PushManager.subscribe exige un BufferSource respaldado
      // por ArrayBuffer. Construimos uno limpio para evitar problemas con
      // SharedArrayBuffer vs ArrayBuffer en TS estricto.
      const keyBytes = urlBase64ToUint8Array(vapid);
      const applicationServerKey = new ArrayBuffer(keyBytes.byteLength);
      new Uint8Array(applicationServerKey).set(keyBytes);
      sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });
    }

    const subJson = sub.toJSON();
    const p256dh = subJson.keys?.p256dh;
    const auth = subJson.keys?.auth;
    if (!p256dh || !auth) {
      return {
        ok: false,
        permission: perm,
        reason: 'subscription-keys-missing',
      };
    }

    const res = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint: sub.endpoint,
        keys: {
          p256dh: arrayBufferToBase64(sub.getKey('p256dh') as ArrayBuffer),
          auth: arrayBufferToBase64(sub.getKey('auth') as ArrayBuffer),
        },
      }),
    });
    if (!res.ok) {
      // Limpiamos la subscripcion local si el servidor la rechazo, asi
      // el proximo intento parte limpio.
      await sub.unsubscribe().catch(() => undefined);
      return { ok: false, permission: perm, reason: 'server-rejected' };
    }
    return { ok: true, permission: perm };
  } catch (err) {
    return {
      ok: false,
      permission: perm,
      reason: err instanceof Error ? err.message : 'unknown',
    };
  }
}

export async function disablePush(): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const registration = await navigator.serviceWorker.ready;
    const sub = await registration.pushManager.getSubscription();
    if (sub) {
      const endpoint = sub.endpoint;
      await sub.unsubscribe().catch(() => undefined);
      await fetch(
        `/api/push/subscribe?endpoint=${encodeURIComponent(endpoint)}`,
        { method: 'DELETE' }
      ).catch(() => undefined);
    } else {
      // No hay sub local: igualmente borramos del server cualquier
      // residuo asociado al usuario para que el switch quede coherente.
      await fetch('/api/push/subscribe', { method: 'DELETE' }).catch(
        () => undefined
      );
    }
  } catch {
    /* best-effort */
  }
}

export async function sendTestPush(): Promise<{
  ok: boolean;
  delivered: number;
}> {
  try {
    const res = await fetch('/api/push/test', { method: 'POST' });
    if (!res.ok) return { ok: false, delivered: 0 };
    const data: { ok: boolean; delivered: number } = await res.json();
    return data;
  } catch {
    return { ok: false, delivered: 0 };
  }
}
