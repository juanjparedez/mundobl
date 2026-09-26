'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ROUTES } from '@/constants/navigation';
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
 * Para quien ya sigue series, la primera pantalla es su lista: la landing es
 * para anonimos (T10).
 *
 * Sin UI y montado dentro de la landing porque `src/app/page.tsx` es ISR y no
 * puede llamar `auth()` — la decision se toma necesariamente en cliente.
 * Anonimo no dispara ningun request.
 */
export function LoggedInHomeRedirect() {
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status !== 'authenticated' || redirectChecked) return;
    redirectChecked = true;
    if (!isFreshEntryToHome()) return;

    // `?stay=1` se lee de window y no con useSearchParams(): en una pagina
    // prerenderizada ese hook obliga a un Suspense boundary y, sin el, saca
    // a la home del render estatico. Aca ya estamos en el cliente, post
    // mount, asi que location alcanza.
    if (new URLSearchParams(window.location.search).get('stay') === '1') return;

    let cancelled = false;
    getUserSummary().then((summary) => {
      if (cancelled || !summary) return;
      // Sin series en curso no hay lista que mostrar: se queda en la landing,
      // que con T09 ya ofrece "Ir a mis series".
      if (summary.viendoCount > 0) router.replace(ROUTES.WATCHING);
    });

    return () => {
      cancelled = true;
    };
  }, [status, router]);

  return null;
}
