/**
 * Wrapper sobre la View Transitions API.
 * Si el browser no la soporta, ejecuta el callback directamente.
 */
type StartViewTransition = (cb: () => void | Promise<void>) => unknown;

export function withViewTransition(cb: () => void | Promise<void>): void {
  if (typeof document === 'undefined') {
    void cb();
    return;
  }
  const start = (
    document as Document & {
      startViewTransition?: StartViewTransition;
    }
  ).startViewTransition;

  if (typeof start !== 'function') {
    void cb();
    return;
  }

  // Respeta la preferencia "reducir movimiento": si el usuario forzó motion=reduce
  // (data-motion en <html>) o si la media query lo pide, no animamos.
  const root = document.documentElement;
  const reduceFromAttr = root.getAttribute('data-motion') === 'reduce';
  const reduceFromMedia =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
  if (reduceFromAttr || reduceFromMedia) {
    void cb();
    return;
  }

  start.call(document, cb);
}
