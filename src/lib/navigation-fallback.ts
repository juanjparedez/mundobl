interface FallbackRule {
  match: (pathname: string) => boolean;
  fallback: string;
}

// Map ordenado: el primer match gana. Para rutas dinamicas usar regex
// sobre pathname. Si el match es de detalle, el fallback es la lista o
// el "padre logico" mas util — NO necesariamente el inmediato.
const FALLBACK_RULES: FallbackRule[] = [
  // Detalle publico. Las URLs llevan slug (`/series/103-titulo`), por eso
  // el segmento es `[^/]+` y no `\d+`.
  { match: (p) => /^\/series\/[^/]+$/.test(p), fallback: '/catalogo' },
  { match: (p) => /^\/catalogo\/[^/]+/.test(p), fallback: '/catalogo' },
  { match: (p) => /^\/actores\/[^/]+$/.test(p), fallback: '/actores' },
  { match: (p) => /^\/directores\/[^/]+$/.test(p), fallback: '/directores' },
  {
    match: (p) => /^\/productoras\/[^/]+$/.test(p),
    fallback: '/productoras',
  },
  { match: (p) => /^\/tags\/[^/]+$/.test(p), fallback: '/catalogo' },

  // Noticias detalle → lista de noticias
  { match: (p) => /^\/noticias\/[^/]+$/.test(p), fallback: '/noticias' },

  // /ver: agregar y detalle → lista /ver
  { match: (p) => /^\/ver\/.+/.test(p), fallback: '/ver' },

  // Admin detalle → lista admin
  { match: (p) => /^\/admin\/series\/\d+/.test(p), fallback: '/admin/series' },
  {
    match: (p) => /^\/admin\/directores\/\d+/.test(p),
    fallback: '/admin/directores',
  },
  {
    match: (p) => /^\/admin\/actores\/\d+/.test(p),
    fallback: '/admin/actores',
  },
  { match: (p) => /^\/admin\/tags\/\d+/.test(p), fallback: '/admin/tags' },
  {
    match: (p) => /^\/admin\/noticias\/.+/.test(p),
    fallback: '/admin/noticias',
  },
  // Resto de admin top-level → /admin
  {
    match: (p) => /^\/admin\/[^/]+/.test(p) && p !== '/admin',
    fallback: '/admin',
  },

  // Perfil y sub-rutas → /perfil home
  { match: (p) => /^\/perfil\/.+/.test(p), fallback: '/perfil' },

  // Top-level del sitio (entrada externa al home de seccion) → landing
  // Solo aplica si el user entra directo (referrer externo).
  { match: (p) => p === '/catalogo', fallback: '/' },
  { match: (p) => p === '/ver', fallback: '/' },
  { match: (p) => p === '/perfil', fallback: '/' },
  { match: (p) => p === '/noticias', fallback: '/' },
  { match: (p) => p === '/admin', fallback: '/' },
];

export function getNavigationFallback(pathname: string): string | null {
  for (const rule of FALLBACK_RULES) {
    if (rule.match(pathname)) return rule.fallback;
  }
  return null;
}
