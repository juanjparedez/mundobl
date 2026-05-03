/**
 * Helpers para web push notifications.
 *
 * Política firme: NUNCA llamar a Notification.requestPermission()
 * automáticamente. Solo desde una acción explícita del usuario
 * (botón "Activar"). Los browsers penalizan los pedidos no solicitados
 * y el usuario los rechaza casi siempre, lo que cierra la puerta para
 * siempre.
 */

const PREF_KEY = 'web-push-enabled';

export type PushPermission = 'unsupported' | 'denied' | 'default' | 'granted';

export function getPushPermission(): PushPermission {
  if (typeof window === 'undefined') return 'unsupported';
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission as PushPermission;
}

export function isPushEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.localStorage.getItem(PREF_KEY) === 'true' &&
    getPushPermission() === 'granted'
  );
}

export async function enablePush(): Promise<{
  ok: boolean;
  permission: PushPermission;
}> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return { ok: false, permission: 'unsupported' };
  }
  let perm = Notification.permission as PushPermission;
  if (perm === 'default') {
    perm = (await Notification.requestPermission()) as PushPermission;
  }
  if (perm !== 'granted') {
    window.localStorage.setItem(PREF_KEY, 'false');
    return { ok: false, permission: perm };
  }
  window.localStorage.setItem(PREF_KEY, 'true');
  return { ok: true, permission: perm };
}

export function disablePush(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(PREF_KEY, 'false');
}
