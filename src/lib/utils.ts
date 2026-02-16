/**
 * Utilidades generales de la aplicación
 */

/**
 * Formatea una fecha a formato legible
 */
export function formatearFecha(fecha: Date): string {
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(fecha);
}

/**
 * Capitaliza la primera letra de un string
 */
export function capitalizarPrimeraLetra(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/**
 * Filtra un array de objetos por una búsqueda en múltiples campos
 */
export function filtrarPorBusqueda<T extends Record<string, unknown>>(
  items: T[],
  busqueda: string,
  campos: (keyof T)[]
): T[] {
  const busquedaLower = busqueda.toLowerCase();
  return items.filter((item) =>
    campos.some((campo) => {
      const valor = item[campo];
      if (typeof valor === 'string') {
        return valor.toLowerCase().includes(busquedaLower);
      }
      if (Array.isArray(valor)) {
        return valor.some((v) =>
          String(v).toLowerCase().includes(busquedaLower)
        );
      }
      return String(valor).toLowerCase().includes(busquedaLower);
    })
  );
}

/**
 * Genera un ID único simple (para desarrollo, usar UUID en producción)
 */
export function generarId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
