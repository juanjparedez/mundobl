/**
 * Estado en la query string para paginas prerenderizadas (ISR).
 *
 * Por que no `useSearchParams()`: en una ruta estatica ese hook exige un
 * Suspense boundary y, sin el, saca la pagina del render estatico. Lo mismo
 * con leer `searchParams` en el Server Component, que la vuelve 100%
 * dinamica. Leyendo de `window.location` y escribiendo con `history` el
 * estado viaja en la URL —compartible, sobrevive al F5— sin que Next tenga
 * que renderizar nada por request: el HTML es el mismo para todos los
 * valores y la seleccion ocurre despues de la hidratacion.
 *
 * Todas las funciones son no-op en el servidor.
 */

export function readUrlParam(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return new URLSearchParams(window.location.search).get(key);
  } catch {
    return null;
  }
}

/**
 * Escribe (o borra, con `null`) un parametro sin navegar.
 *
 * `replace` —el default— no agrega entrada al historial: sirve para estado
 * que acompaña a la pagina, como un filtro. `push` si la agrega, para que
 * el boton "atras" deshaga el cambio.
 */
export function writeUrlParam(
  key: string,
  value: string | null,
  mode: 'replace' | 'push' = 'replace'
): void {
  if (typeof window === 'undefined') return;
  try {
    const url = new URL(window.location.href);
    if (value === null) {
      url.searchParams.delete(key);
    } else {
      url.searchParams.set(key, value);
    }
    const next = `${url.pathname}${url.search}${url.hash}`;
    if (mode === 'push') {
      window.history.pushState(null, '', next);
    } else {
      window.history.replaceState(null, '', next);
    }
  } catch {
    // Un historial bloqueado no puede romper la navegacion de la pagina.
  }
}
