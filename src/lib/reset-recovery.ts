/**
 * Helpers de "rescate" para usuarios que se quedan en estado roto:
 *  - SW viejo sirviendo HTML/JS desactualizado.
 *  - Cache local con assets corruptos.
 *  - Sesión inconsistente.
 *
 * Client-only. Los helpers de caché/SW devuelven false si fallan para que
 * las interfaces de recuperación puedan informar un resultado incompleto.
 */

async function withRecoveryTimeout<T>(operation: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('Recovery timed out')), 5000);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

export interface PlaybackEnvironment {
  online: boolean;
  hasLocalData: boolean;
}

/** Solo inspecciona el estado local; no certifica disponibilidad del video. */
export async function inspectPlaybackEnvironment(): Promise<PlaybackEnvironment> {
  const [keys, registrations] = await withRecoveryTimeout(
    Promise.all([
      'caches' in window ? caches.keys() : Promise.resolve([]),
      'serviceWorker' in navigator
        ? navigator.serviceWorker.getRegistrations()
        : Promise.resolve([]),
    ])
  );
  return {
    online: navigator.onLine,
    hasLocalData: keys.length > 0 || registrations.length > 0,
  };
}

export async function clearAllCaches(): Promise<boolean> {
  if (typeof window === 'undefined' || !('caches' in window)) return true;
  try {
    await withRecoveryTimeout(
      caches
        .keys()
        .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
    );
    return true;
  } catch {
    return false;
  }
}

export async function unregisterAllServiceWorkers(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator))
    return true;
  try {
    await withRecoveryTimeout(
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => Promise.all(regs.map((r) => r.unregister())))
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * Limpia todo el storage del cliente (localStorage + sessionStorage).
 * No toca cookies — eso es responsabilidad de signOut o del banner.
 */
export function clearLocalStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.clear();
  } catch {
    /* ignore */
  }
  try {
    window.sessionStorage.clear();
  } catch {
    /* ignore */
  }
}

/**
 * Reset completo del Service Worker: desregistra workers y limpia caches.
 * Útil cuando el SW está sirviendo HTML/JS viejo y la app está rota.
 * Recarga la página si reload=true (por defecto).
 */
export async function resetServiceWorker(reload = true): Promise<boolean> {
  const unregistered = await unregisterAllServiceWorkers();
  const cleared = await clearAllCaches();
  if (reload && typeof window !== 'undefined') {
    window.location.reload();
  }
  return unregistered && cleared;
}

/**
 * "Borra todo el estado local" — última bala antes de pedir login.
 * Limpia caches, desregistra SW, vacía storage. NO cierra sesión:
 * eso requiere signOut() del provider de auth.
 */
export async function resetClientState(): Promise<void> {
  await unregisterAllServiceWorkers();
  await clearAllCaches();
  clearLocalStorage();
}
