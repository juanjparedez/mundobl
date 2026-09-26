import type { ComponentType } from 'react';
import {
  AppstoreOutlined,
  BankOutlined,
  BarChartOutlined,
  BellOutlined,
  CalendarOutlined,
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

/**
 * Lo que se ve aca y lo que solo se sigue van separados: el catalogo es mucho
 * mas grande que lo que se puede mirar en el sitio, y la navegacion no puede
 * dar a entender lo contrario.
 */
export type NavSection = 'watch' | 'follow' | 'explore';

export const NAV_SECTIONS: { key: NavSection; labelKey: TranslationKey }[] = [
  { key: 'watch', labelKey: 'navSections.watch' },
  { key: 'follow', labelKey: 'navSections.follow' },
  { key: 'explore', labelKey: 'navSections.explore' },
];

export interface NavItemDef {
  key: string;
  path: string;
  icon: ComponentType;
  labelKey: TranslationKey;
  /** Rotulo corto para la barra inferior (12px, sin espacio). */
  shortLabelKey?: TranslationKey;
  access: NavAccess;
  section: NavSection;
  /** Va en la barra inferior de movil (maximo 4 + "Mas"). */
  primary?: boolean;
  /** Punto/contador sobre el icono. */
  badge?: 'novedades' | 'notifications';
  /** Solo en movil (en escritorio ya vive en la barra superior). */
  mobileOnly?: boolean;
}

export const NAV_ITEMS: NavItemDef[] = [
  {
    key: 'ver',
    path: ROUTES.VER,
    icon: VideoCameraOutlined,
    labelKey: 'sidebar.ver',
    shortLabelKey: 'bottomNav.watch',
    access: 'public',
    section: 'watch',
    primary: true,
  },
  {
    key: 'catalogo',
    path: ROUTES.CATALOGO,
    icon: AppstoreOutlined,
    labelKey: 'sidebar.catalog',
    shortLabelKey: 'bottomNav.catalog',
    access: 'public',
    section: 'follow',
    primary: true,
  },
  {
    key: 'watching',
    path: ROUTES.WATCHING,
    icon: PlayCircleOutlined,
    labelKey: 'sidebar.watching',
    shortLabelKey: 'bottomNav.watching',
    access: 'public',
    section: 'follow',
    primary: true,
  },
  {
    key: 'perfil',
    path: ROUTES.PERFIL,
    icon: UserOutlined,
    labelKey: 'sidebar.profile',
    shortLabelKey: 'bottomNav.profile',
    access: 'session',
    section: 'follow',
    primary: true,
    badge: 'notifications',
  },
  {
    key: 'notificaciones',
    path: '/notificaciones',
    icon: BellOutlined,
    labelKey: 'notifications.label',
    access: 'session',
    section: 'follow',
    badge: 'notifications',
    mobileOnly: true,
  },
  {
    key: 'novedades',
    path: ROUTES.NOVEDADES,
    icon: NotificationOutlined,
    labelKey: 'sidebar.novedades',
    access: 'public',
    section: 'explore',
    badge: 'novedades',
  },
  {
    key: 'estrenos',
    path: ROUTES.ESTRENOS,
    icon: CalendarOutlined,
    labelKey: 'estrenos.title',
    access: 'public',
    section: 'explore',
  },
  {
    key: 'actores',
    path: '/actores',
    icon: TeamOutlined,
    labelKey: 'peopleIndex.actorsTitle',
    access: 'public',
    section: 'explore',
  },
  {
    key: 'directores',
    path: '/directores',
    icon: VideoCameraAddOutlined,
    labelKey: 'peopleIndex.directorsTitle',
    access: 'public',
    section: 'explore',
  },
  {
    key: 'productoras',
    path: '/productoras',
    icon: BankOutlined,
    labelKey: 'peopleIndex.companiesTitle',
    access: 'public',
    section: 'explore',
  },
  {
    key: 'feedback',
    path: ROUTES.FEEDBACK,
    icon: CommentOutlined,
    labelKey: 'sidebar.feedback',
    access: 'public',
    section: 'explore',
  },
  {
    key: 'sitios',
    path: '/sitios',
    icon: LinkOutlined,
    labelKey: 'sidebar.sites',
    access: 'public',
    section: 'explore',
  },
  {
    key: 'plataformas',
    path: '/plataformas',
    icon: SafetyCertificateOutlined,
    labelKey: 'sidebar.platforms',
    access: 'public',
    section: 'explore',
  },
  {
    key: 'glosario',
    path: '/glosario',
    icon: TranslationOutlined,
    labelKey: 'sidebar.glossary',
    access: 'public',
    section: 'explore',
  },
  {
    key: 'contenido',
    path: '/contenido',
    icon: PlaySquareOutlined,
    labelKey: 'sidebar.content',
    access: 'public',
    section: 'explore',
  },
  {
    key: 'estadisticas',
    path: ROUTES.ESTADISTICAS,
    icon: BarChartOutlined,
    labelKey: 'sidebar.stats',
    access: 'public',
    section: 'explore',
  },
  {
    key: 'acerca',
    path: '/acerca',
    icon: InfoCircleOutlined,
    labelKey: 'sidebar.about',
    access: 'public',
    section: 'explore',
  },
  {
    key: 'admin',
    path: ROUTES.ADMIN,
    icon: SettingOutlined,
    labelKey: 'sidebar.administration',
    access: 'admin',
    section: 'explore',
  },
  {
    key: 'colaborador',
    path: ROUTES.ADMIN_COLABORADOR,
    icon: SettingOutlined,
    labelKey: 'sidebar.collaboratorPanel',
    access: 'collaborator',
    section: 'explore',
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
