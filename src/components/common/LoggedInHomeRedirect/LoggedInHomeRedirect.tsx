'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  getStartPagePreference,
  resolveStartPageRoute,
} from '@/lib/start-page-preference';
import { getUserSummary } from '@/lib/user-summary-client';

/**
 * Solo si el documento se abrio en la home (link, marcador, URL tipeada).
 * Llegar con "atras", recargar o volver desde otra pagina del sitio es una
 * decision de estar en la landing: redirigir ahi te sacaba de donde ibas.
 */
function isFreshEntryToHome(): boolean {
  const [nav] = performance.getEntriesByType(
    'navigation'
  ) as PerformanceNavigationTiming[];
  if (!nav || nav.type !== 'navigate') return false;
  return new URL(nav.name).pathname === window.location.pathname;
}

// Una vez por documento: volver a `/` con navegacion interna no redirige.
let redirectChecked = false;

/**
 * Redireccion opt-in al abrir `/` para usuarios registrados.
 *
 * Por defecto el usuario ve la portada (`landing`) para que nunca se cierre
 * sola sin haberlo pedido. Si en Ajustes o en la propia portada elige abrir
 * directo en `/watching`, `/catalogo`, `/ver` o `/estrenos`, se respeta esa
 * preferencia en entradas frescas a `/` (salvo `?stay=1`).
 *
 * Igual dispara `getUserSummary()` en segundo plano para registrar el dia
 * activo (`UserActiveDay`).
 */
export function LoggedInHomeRedirect() {
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status !== 'authenticated' || redirectChecked) return;
    redirectChecked = true;

    // Registra el dia activo aunque el usuario elija quedarse en la portada.
    void getUserSummary();

    if (!isFreshEntryToHome()) return;

    // `?stay=1` se lee de window y no con useSearchParams(): en una pagina
    // prerenderizada ese hook obliga a un Suspense boundary y, sin el, saca
    // a la home del render estatico. Aca ya estamos en el cliente, post
    // mount, asi que location alcanza.
    if (new URLSearchParams(window.location.search).get('stay') === '1') return;

    const targetRoute = resolveStartPageRoute(getStartPagePreference());
    if (targetRoute) {
      router.replace(targetRoute);
    }
  }, [status, router]);

  return null;
}
