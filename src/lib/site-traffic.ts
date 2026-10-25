// ============================================
// Trafico global agregado (SiteTrafficDaily)
// ============================================
//
// Medición operativa de primera parte para dimensionamiento de infraestructura
// y entendimiento de flujos. Totalmente agregada: cero IPs, cero identificadores
// personales, agrupada por día UTC, sección y país del edge.

export const TRAFFIC_SECTIONS = [
  'home',
  'catalogo',
  'ver',
  'ver_player',
  'series_detail',
  'estrenos',
  'comunidad',
  'estadisticas',
  'perfil',
  'otros',
] as const;
export type TrafficSection = (typeof TRAFFIC_SECTIONS)[number];

export const TRAFFIC_FLOWS = [
  'direct',
  'internal',
  'referral',
  'share',
] as const;
export type TrafficFlow = (typeof TRAFFIC_FLOWS)[number];

export function isTrafficSection(value: unknown): value is TrafficSection {
  return TRAFFIC_SECTIONS.some((s) => s === value);
}

export function isTrafficFlow(value: unknown): value is TrafficFlow {
  return TRAFFIC_FLOWS.some((f) => f === value);
}

/** Determina la sección del sitio a partir del pathname de la URL. */
export function sectionFromPath(pathname: string): TrafficSection {
  if (pathname === '/') return 'home';
  if (pathname === '/catalogo' || pathname.startsWith('/catalogo/'))
    return 'catalogo';
  if (pathname.startsWith('/ver/')) return 'ver_player';
  if (pathname === '/ver') return 'ver';
  if (pathname.startsWith('/series/')) return 'series_detail';
  if (pathname === '/estrenos' || pathname.startsWith('/estrenos/'))
    return 'estrenos';
  if (pathname === '/comunidad' || pathname.startsWith('/comunidad/'))
    return 'comunidad';
  if (pathname === '/estadisticas') return 'estadisticas';
  if (pathname.startsWith('/perfil')) return 'perfil';
  return 'otros';
}
