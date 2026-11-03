'use client';

import { useRef } from 'react';
import { useServerInsertedHTML } from 'next/navigation';

/**
 * Hoja estatica de antd (public/antd.css, la genera
 * scripts/generate-antd-css.ts antes de `dev` y `build`).
 *
 * Reemplaza a AntdRegistry, que metia ~285 KB de CSS de antd inline en cada
 * pagina: las ~4.000 fichas ISR guardaban esa copia en cada regeneracion y
 * era mas de la mitad de los ISR writes y del CPU de render (cuotas de
 * Vercel, nov 2026). Como archivo aparte se baja una vez y queda cacheado.
 *
 * Tiene que quedar ANTES que nuestras hojas: a igual especificidad
 * (`:where(.css-x).ant-*`) gana la ultima, y nuestros overrides tienen que
 * pisar a antd. Ni el orden de los imports ni `precedence` lo garantizan
 * (Next agrupa el CSS compartido en chunks que salen primero), asi que el
 * script la mueve antes del primer <link> de Next. Va por
 * useServerInsertedHTML para quedar fuera del arbol que hidrata React.
 */
const ANTD_CSS_HREF = `/antd.css?v=${process.env.NEXT_PUBLIC_ANTD_CSS_VERSION ?? ''}`;

const MOVE_ANTD_CSS_FIRST = `(function(){var a=document.getElementById('antd-static-css');var l=document.querySelector('link[rel="stylesheet"][data-precedence]');if(a&&l&&(l.compareDocumentPosition(a)&4))l.parentNode.insertBefore(a,l)})()`;

export function AntdStaticStyles() {
  // El callback corre en cada flush del stream: la hoja va una sola vez.
  const inserted = useRef(false);
  useServerInsertedHTML(() => {
    if (inserted.current) return null;
    inserted.current = true;
    return (
      <>
        <link id="antd-static-css" rel="stylesheet" href={ANTD_CSS_HREF} />
        <script dangerouslySetInnerHTML={{ __html: MOVE_ANTD_CSS_FIRST }} />
      </>
    );
  });
  return null;
}
