'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

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
const STORAGE_KEY = '__mb_first_nav_handled';

interface FallbackRule {
  match: (pathname: string) => boolean;
  fallback: string;
}

// Map ordenado: el primer match gana. Para rutas dinamicas usar regex
// sobre pathname. Si el match es de detalle, el fallback es la lista o
// el "padre logico" mas util — NO necesariamente el inmediato.
const FALLBACK_RULES: FallbackRule[] = [
  // Detalle publico — todos al catalogo (es el "home" del catalogo)
  { match: (p) => /^\/series\/\d+$/.test(p), fallback: '/catalogo' },
  { match: (p) => /^\/directores\/\d+$/.test(p), fallback: '/catalogo' },
  { match: (p) => /^\/actores\/\d+$/.test(p), fallback: '/catalogo' },
  { match: (p) => /^\/tags\/\d+$/.test(p), fallback: '/catalogo' },
  { match: (p) => /^\/catalogo\/\d+/.test(p), fallback: '/catalogo' },

  // Noticias detalle → lista de noticias
  { match: (p) => /^\/noticias\/[^/]+$/.test(p), fallback: '/noticias' },

  // /ver: agregar y detalle → lista /ver
  { match: (p) => /^\/ver\/.+/.test(p), fallback: '/ver' },

  // Admin detalle → lista admin
  { match: (p) => /^\/admin\/series\/\d+/.test(p), fallback: '/admin/series' },
  {
    match: (p) => /^\/admin\/directores\/\d+/.test(p),
    fallback: '/admin/directores',
  },
  {
    match: (p) => /^\/admin\/actores\/\d+/.test(p),
    fallback: '/admin/actores',
  },
  { match: (p) => /^\/admin\/tags\/\d+/.test(p), fallback: '/admin/tags' },
  {
    match: (p) => /^\/admin\/noticias\/.+/.test(p),
    fallback: '/admin/noticias',
  },
  // Resto de admin top-level → /admin
  {
    match: (p) => /^\/admin\/[^/]+/.test(p) && p !== '/admin',
    fallback: '/admin',
  },

  // Perfil y sub-rutas → /perfil home
  { match: (p) => /^\/perfil\/.+/.test(p), fallback: '/perfil' },

  // Top-level del sitio (entrada externa al home de seccion) → landing
  // Solo aplica si el user entra directo (referrer externo).
  { match: (p) => p === '/catalogo', fallback: '/' },
  { match: (p) => p === '/ver', fallback: '/' },
  { match: (p) => p === '/perfil', fallback: '/' },
  { match: (p) => p === '/noticias', fallback: '/' },
  { match: (p) => p === '/admin', fallback: '/' },
];

function getFallback(pathname: string): string | null {
  for (const rule of FALLBACK_RULES) {
    if (rule.match(pathname)) return rule.fallback;
  }
  return null;
}

export function NavigationGuard() {
  const pathname = usePathname();

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
    if (ref && ref.startsWith(window.location.origin)) return;

    // 4. Mapear pathname a fallback configurado. Sin match, no tocar.
    const fallback = getFallback(pathname);
    if (!fallback || fallback === pathname) return;

    // 5. Inyectar: replace current con fallback (URL bar momentanea pero
    //    sin re-render porque no usamos router), luego push de la URL
    //    actual de vuelta. Resultado en history:
    //      [external, fallback (sintetico), currentUrl]
    //    Back nativo → URL pasa a fallback → Next.js navega normal.
    const currentUrl = window.location.pathname + window.location.search;
    window.history.replaceState(null, '', fallback);
    window.history.pushState({ [HISTORY_INJECT_KEY]: true }, '', currentUrl);
  }, [pathname]);

  return null;
}
