// Page keys que Flor puede elegir en el checklist de /admin/anuncios para
// targetear un anuncio. 'global' es especial: matchea cualquier pagina
// instrumentada, ademas de las especificas que se hayan tildado.
//
// Agregar una pagina nueva a este registro es la unica accion necesaria
// para que quede disponible en el picker del admin (no hace falta tocar el
// componente ni el backend).
export const ANNOUNCEMENT_PAGE_OPTIONS = [
  { value: 'global', label: 'Toda la app' },
  { value: 'home', label: 'Inicio' },
  { value: 'catalogo', label: 'Catálogo' },
  { value: 'ver', label: 'Ver' },
  { value: 'noticias', label: 'Noticias' },
  { value: 'novedades', label: 'Novedades' },
  { value: 'perfil', label: 'Perfil' },
  { value: 'series', label: 'Ficha de serie' },
  { value: 'watching', label: 'Watching' },
  { value: 'estadisticas', label: 'Estadísticas' },
  { value: 'sitios', label: 'Sitios recomendados' },
] as const;

export type AnnouncementPageKey =
  (typeof ANNOUNCEMENT_PAGE_OPTIONS)[number]['value'];

/**
 * Deriva la page key a partir del pathname actual (primer segmento de la
 * ruta). '/' -> 'home'. No valida contra ANNOUNCEMENT_PAGE_OPTIONS a
 * proposito: paginas no listadas ahi simplemente nunca van a matchear un
 * anuncio especifico (solo 'global'), sin necesidad de mantener sincronizado
 * un set de rutas validas.
 */
export function resolvePageKey(pathname: string): string {
  if (pathname === '/') return 'home';
  return pathname.split('/').filter(Boolean)[0] ?? 'home';
}

export const ANNOUNCEMENT_TONE_COLORS: Record<string, string> = {
  INFO: 'blue',
  SUCCESS: 'green',
  WARNING: 'gold',
  PROMO: 'purple',
};

export const ANNOUNCEMENT_AUDIENCE_COLORS: Record<string, string> = {
  EVERYONE: 'default',
  MEMBERS: 'cyan',
  NOTIFICATIONS_ENABLED: 'purple',
};
