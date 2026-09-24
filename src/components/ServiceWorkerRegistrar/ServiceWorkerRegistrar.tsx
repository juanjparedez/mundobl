'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    // Habia controller ANTES de registrar? Eso distingue los dos casos que
    // `controllerchange` mezcla:
    //
    //  - Visita con SW ya instalado y un deploy nuevo: el SW viejo controlaba
    //    la pagina, el nuevo hace skipWaiting + clients.claim y la reclama.
    //    Ahi el reload SI sirve: los assets que la pagina ya cargo pueden ser
    //    de la version anterior.
    //
    //  - Primera visita (o cache limpio): no habia controller, `sw.js` se
    //    instala, activa y reclama esta misma pagina. `controllerchange`
    //    dispara igual, pero no hay nada viejo que refrescar — el reload es
    //    puro costo: todo visitante nuevo comia una recarga completa ~1s
    //    despues del load (flash, scroll perdido, doble render).
    //    Ademas hacia flaky el smoke test de /catalogo: la recarga caia entre
    //    el `toBeVisible()` de la primera card y el `count()`, y contaba 0.
    const hadController = navigator.serviceWorker.controller !== null;

    let reloaded = false;
    const onControllerChange = () => {
      if (!hadController) return;
      if (reloaded) return;
      reloaded = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener(
      'controllerchange',
      onControllerChange
    );

    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => registration.update())
      .catch((error) => {
        console.error('SW registration failed:', error);
      });

    return () => {
      navigator.serviceWorker.removeEventListener(
        'controllerchange',
        onControllerChange
      );
    };
  }, []);

  return null;
}
