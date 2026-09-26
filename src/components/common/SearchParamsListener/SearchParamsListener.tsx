'use client';

import { Suspense, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';

interface SearchParamsListenerProps {
  /** Se llama al montar y cada vez que cambia la query. */
  onChange: (params: URLSearchParams) => void;
}

function Reader({ onChange }: SearchParamsListenerProps) {
  const params = useSearchParams();
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });
  useEffect(() => {
    onChangeRef.current(new URLSearchParams(params.toString()));
  }, [params]);
  return null;
}

/**
 * Lee la query sin sacar la pagina del render del servidor. useSearchParams
 * fuerza render en el cliente hasta el Suspense mas cercano: aca ese
 * Suspense envuelve solo a este componente, que no dibuja nada.
 */
export function SearchParamsListener({ onChange }: SearchParamsListenerProps) {
  return (
    <Suspense fallback={null}>
      <Reader onChange={onChange} />
    </Suspense>
  );
}
