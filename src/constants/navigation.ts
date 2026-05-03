/**
 * Constantes de navegación de la aplicación
 */

export const ROUTES = {
  HOME: '/',
  CATALOGO: '/catalogo',
  WATCHING: '/watching',
  PERFIL: '/perfil',
  ADMIN: '/admin',
  ADMIN_USUARIOS: '/admin/usuarios',
  FEEDBACK: '/feedback',
} as const;

export const NAV_ITEMS = [
  {
    key: 'catalogo',
    label: 'Catálogo',
    path: ROUTES.CATALOGO,
  },
  {
    key: 'admin',
    label: 'Administración',
    path: ROUTES.ADMIN,
  },
] as const;
