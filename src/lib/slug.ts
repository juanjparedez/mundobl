/**
 * Utilidades para generación y manejo de slugs amigables para SEO en URLs.
 */

/**
 * Convierte cualquier texto a un slug limpio para URL:
 * - Pasa a minúsculas
 * - Remueve tildes y diacríticos (ej: "canción" -> "cancion")
 * - Convierte espacios y caracteres especiales a guiones
 * - Colapsa guiones múltiples y remueve guiones al inicio/fin
 */
export function slugify(text: string): string {
  if (!text) return '';

  return text
    .normalize('NFD') // Descompone caracteres con tildes/acentos
    .replace(/[\u0300-\u036f]/g, '') // Elimina marcas diacríticas
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-') // Caracteres no alfanuméricos -> guión
    .replace(/^-+|-+$/g, '') // Quita guiones sobrantes al principio y final
    .slice(0, 80); // Limita longitud máxima razonable para URLs
}

/**
 * Genera la URL canónica SEO para una serie:
 * - Con título: `/series/15-a-dog-and-a-plane`
 * - Sin título o fallback: `/series/15`
 */
export function getSeriesUrl(
  id: number | string,
  title?: string | null
): string {
  if (!title) return `/series/${id}`;
  const slug = slugify(title);
  return slug ? `/series/${id}-${slug}` : `/series/${id}`;
}

/**
 * Genera la URL canónica SEO para una serie en /ver:
 * - Con título: `/ver/15-a-dog-and-a-plane`
 * - Sin título o fallback: `/ver/15`
 */
export function getVerUrl(id: number | string, title?: string | null): string {
  if (!title) return `/ver/${id}`;
  const slug = slugify(title);
  return slug ? `/ver/${id}-${slug}` : `/ver/${id}`;
}

/**
 * Extrae el ID numérico de un parámetro que puede ser "15" o "15-a-dog-and-a-plane".
 * `parseInt("15-slug", 10)` devuelve 15 de manera nativa y segura.
 */
export function parseIdFromSlug(param: string): number {
  return parseInt(param, 10);
}
