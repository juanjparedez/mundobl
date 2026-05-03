/**
 * Helpers de "rescate" para usuarios que se quedan en estado roto:
 *  - SW viejo sirviendo HTML/JS desactualizado.
 *  - Cache local con assets corruptos.
 *  - Sesión inconsistente.
 *
 * Todos son client-only y silenciosos: cualquier error se ignora
 * porque su único propósito es desatascar al usuario, no fallar más.
 */

export async function clearAllCaches(): Promise<void> {
  if (typeof window === 'undefined' || !('caches' in window)) return;
  try {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
  } catch {
    /* ignore */
  }
}

export async function unregisterAllServiceWorkers(): Promise<void> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator))
    return;
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map((r) => r.unregister()));
  } catch {
    /* ignore */
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
export async function resetServiceWorker(reload = true): Promise<void> {
  await unregisterAllServiceWorkers();
  await clearAllCaches();
  if (reload && typeof window !== 'undefined') {
    window.location.reload();
  }
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
