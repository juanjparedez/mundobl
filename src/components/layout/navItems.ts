import type { ComponentType } from 'react';
import {
  AppstoreOutlined,
  BankOutlined,
  BarChartOutlined,
  BellOutlined,
  CommentOutlined,
  InfoCircleOutlined,
  LinkOutlined,
  NotificationOutlined,
  PlayCircleOutlined,
  PlaySquareOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  TeamOutlined,
  TranslationOutlined,
  UserOutlined,
  VideoCameraAddOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';
import { ROUTES } from '@/constants/navigation';
import type { TranslationKey } from '@/i18n/messages';

/**
 * Unica fuente de la navegacion principal. La consumen el Sidebar de
 * escritorio y la barra inferior + cajon "Mas" de movil, para que en el
 * celular se llegue exactamente a las mismas secciones que en desktop.
 * Prohibido duplicar esta lista en un componente.
 *
 * Solo lo importan componentes cliente (los iconos de antd no se pueden
 * importar desde Server Components, ver context.md).
 */

export type NavAccess = 'public' | 'session' | 'admin' | 'collaborator';

export interface NavItemDef {
  key: string;
  path: string;
  icon: ComponentType;
  labelKey: TranslationKey;
  /** Rotulo corto para la barra inferior (12px, sin espacio). */
  shortLabelKey?: TranslationKey;
  access: NavAccess;
  /** Va en la barra inferior de movil (maximo 4 + "Mas"). */
  primary?: boolean;
  /** Punto/contador sobre el icono. */
  badge?: 'novedades' | 'notifications';
  /** Solo en movil (en escritorio ya vive en la barra superior). */
  mobileOnly?: boolean;
}

export const NAV_ITEMS: NavItemDef[] = [
  {
    key: 'catalogo',
    path: ROUTES.CATALOGO,
    icon: AppstoreOutlined,
    labelKey: 'sidebar.catalog',
    shortLabelKey: 'bottomNav.catalog',
    access: 'public',
    primary: true,
  },
  {
    key: 'ver',
    path: ROUTES.VER,
    icon: VideoCameraOutlined,
    labelKey: 'sidebar.ver',
    shortLabelKey: 'bottomNav.watch',
    access: 'public',
    primary: true,
  },
  {
    key: 'watching',
    path: ROUTES.WATCHING,
    icon: PlayCircleOutlined,
    labelKey: 'sidebar.watching',
    shortLabelKey: 'bottomNav.watching',
    access: 'public',
    primary: true,
  },
  {
    key: 'perfil',
    path: ROUTES.PERFIL,
    icon: UserOutlined,
    labelKey: 'sidebar.profile',
    shortLabelKey: 'bottomNav.profile',
    access: 'session',
    primary: true,
    badge: 'notifications',
  },
  {
    key: 'notificaciones',
    path: '/notificaciones',
    icon: BellOutlined,
    labelKey: 'notifications.label',
    access: 'session',
    badge: 'notifications',
    mobileOnly: true,
  },
  {
    key: 'novedades',
    path: ROUTES.NOVEDADES,
    icon: NotificationOutlined,
    labelKey: 'sidebar.novedades',
    access: 'public',
    badge: 'novedades',
  },
  {
    key: 'actores',
    path: '/actores',
    icon: TeamOutlined,
    labelKey: 'peopleIndex.actorsTitle',
    access: 'public',
  },
  {
    key: 'directores',
    path: '/directores',
    icon: VideoCameraAddOutlined,
    labelKey: 'peopleIndex.directorsTitle',
    access: 'public',
  },
  {
    key: 'productoras',
    path: '/productoras',
    icon: BankOutlined,
    labelKey: 'peopleIndex.companiesTitle',
    access: 'public',
  },
  {
    key: 'feedback',
    path: ROUTES.FEEDBACK,
    icon: CommentOutlined,
    labelKey: 'sidebar.feedback',
    access: 'public',
  },
  {
    key: 'sitios',
    path: '/sitios',
    icon: LinkOutlined,
    labelKey: 'sidebar.sites',
    access: 'public',
  },
  {
    key: 'plataformas',
    path: '/plataformas',
    icon: SafetyCertificateOutlined,
    labelKey: 'sidebar.platforms',
    access: 'public',
  },
  {
    key: 'glosario',
    path: '/glosario',
    icon: TranslationOutlined,
    labelKey: 'sidebar.glossary',
    access: 'public',
  },
  {
    key: 'contenido',
    path: '/contenido',
    icon: PlaySquareOutlined,
    labelKey: 'sidebar.content',
    access: 'public',
  },
  {
    key: 'estadisticas',
    path: ROUTES.ESTADISTICAS,
    icon: BarChartOutlined,
    labelKey: 'sidebar.stats',
    access: 'public',
  },
  {
    key: 'acerca',
    path: '/acerca',
    icon: InfoCircleOutlined,
    labelKey: 'sidebar.about',
    access: 'public',
  },
  {
    key: 'admin',
    path: ROUTES.ADMIN,
    icon: SettingOutlined,
    labelKey: 'sidebar.administration',
    access: 'admin',
  },
  {
    key: 'colaborador',
    path: ROUTES.ADMIN_COLABORADOR,
    icon: SettingOutlined,
    labelKey: 'sidebar.collaboratorPanel',
    access: 'collaborator',
  },
];

export interface NavContext {
  loggedIn: boolean;
  role: string | null | undefined;
}

export function canSeeNavItem(item: NavItemDef, ctx: NavContext): boolean {
  switch (item.access) {
    case 'public':
      return true;
    case 'session':
      return ctx.loggedIn;
    case 'admin':
      return ctx.role === 'ADMIN' || ctx.role === 'MODERATOR';
    case 'collaborator':
      return ctx.role === 'COLLABORATOR';
  }
}

/** Activo si la ruta actual es la del item o una sub-ruta. */
export function isNavItemActive(item: NavItemDef, pathname: string | null) {
  if (!pathname) return false;
  return pathname === item.path || pathname.startsWith(`${item.path}/`);
}
