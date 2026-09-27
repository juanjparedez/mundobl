'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getNavigationFallback } from '@/lib/navigation-fallback';

/**
 * NavigationGuard — garantiza que el boton "atras" del browser (o el
 * gesture de swipe-back en mobile) siempre tenga un destino interno
 * coherente, incluso cuando el usuario entra al sitio desde un link
 * externo (Google, redes, link compartido por whatsapp, deep link, refresh).
 *
 * Comportamiento:
 *  - Si el referrer es del mismo origen → no toca el history (la navegacion
 *    natural ya funciona; back va a la pagina anterior real).
 *  - Si el referrer es externo o vacio → inyecta una entrada sintetica
 *    "parent logico" ANTES de la pagina actual via window.history.
 *    Asi back llega a un destino del sitio (ej. /catalogo en vez de
 *    salir a Google).
 *
 * Idempotente a doble nivel:
 *  1. Marker en history.state.__mb_back_injected — la entrada actual no
 *     se re-inyecta si ya tiene la marca.
 *  2. Flag en sessionStorage __mb_first_nav_handled — la logica de
 *     "primera entrada del tab" corre una sola vez por tab (subsecuente
 *     navegacion interna preserva el historial real).
 *
 * Mount: en root layout (src/app/layout.tsx). Render: null.
 */

const HISTORY_INJECT_KEY = '__mb_back_injected';
const FALLBACK_ENTRY_KEY = '__mb_fallback_entry';
const STORAGE_KEY = '__mb_first_nav_handled';

export function NavigationGuard() {
  const pathname = usePathname();
  const router = useRouter();
  const previous = useRef<string | null>(null);

  useEffect(() => {
    const current = window.location.pathname;
    // A route transition in this mounted app provides stronger evidence than
    // document.referrer, which never changes during client-side navigation.
    if (previous.current && previous.current !== current) {
      window.history.replaceState(
        { ...window.history.state, __mb_internal_back: true },
        '',
        window.location.href
      );
    }
    previous.current = current;
  }, [pathname]);

  // Al volver a la entrada sintetica el browser solo cambia la URL: Next
  // restaura el arbol de la pagina que teniamos abierta y la pantalla no se
  // movia (URL en `/`, contenido del catalogo). Aca se navega de verdad.
  useEffect(() => {
    const onPopState = (event: PopStateEvent) => {
      previous.current = window.location.pathname;
      const state = event.state as Record<string, unknown> | null;
      if (!state?.[FALLBACK_ENTRY_KEY]) return;
      router.replace(window.location.pathname + window.location.search);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [router]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!pathname) return;

    // 1. Idempotente por entrada: si esta entrada ya fue inyectada, abortar.
    const state = window.history.state as Record<string, unknown> | null;
    if (state?.[HISTORY_INJECT_KEY]) return;

    // 2. Idempotente por tab: la inyeccion de "primera entrada" solo
    //    corre una vez por tab. Despues la navegacion interna real
    //    construye historial util por su cuenta.
    let alreadyHandled = false;
    try {
      alreadyHandled = window.sessionStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      // sessionStorage puede fallar en private browsing / quota; en ese
      // caso ejecutamos la logica igual (peor caso: idempotencia por
      // history.state via check 1).
    }
    if (alreadyHandled) return;

    try {
      window.sessionStorage.setItem(STORAGE_KEY, '1');
    } catch {
      /* ignore */
    }

    // 3. Solo inyectar si el referrer es externo o vacio. Si vino de
    //    otra pagina del sitio, el historial natural ya es util.
    const ref = document.referrer;
    if (ref && new URL(ref).origin === window.location.origin) return;

    // 4. Mapear pathname a fallback configurado. Sin match, no tocar.
    const fallback = getNavigationFallback(pathname);
    if (!fallback || fallback === pathname) return;

    // 5. Inyectar: replace current con fallback (URL bar momentanea pero
    //    sin re-render porque no usamos router), luego push de la URL
    //    actual de vuelta. Resultado en history:
    //      [external, fallback (sintetico), currentUrl]
    //    Back nativo → URL pasa a fallback → el listener de popstate de
    //    arriba navega con el router.
    const currentUrl = window.location.pathname + window.location.search;
    window.history.replaceState({ [FALLBACK_ENTRY_KEY]: true }, '', fallback);
    window.history.pushState({ [HISTORY_INJECT_KEY]: true }, '', currentUrl);
  }, [pathname]);

  return null;
}
