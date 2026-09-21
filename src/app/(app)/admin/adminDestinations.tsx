import type { ReactNode } from 'react';
import {
  AppstoreOutlined,
  BankOutlined,
  BarChartOutlined,
  BookOutlined,
  BugOutlined,
  BulbOutlined,
  CustomerServiceOutlined,
  FileTextOutlined,
  GlobalOutlined,
  ImportOutlined,
  InfoCircleOutlined,
  LinkOutlined,
  MessageOutlined,
  NotificationOutlined,
  PlayCircleOutlined,
  RadarChartOutlined,
  ReadOutlined,
  SoundOutlined,
  TagsOutlined,
  ThunderboltOutlined,
  TranslationOutlined,
  UnorderedListOutlined,
  UserAddOutlined,
  UserOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';
import type { TranslationKey } from '@/i18n/messages';

/**
 * Registro UNICO de destinos del admin.
 *
 * Antes esto vivia duplicado: `AdminNav` tenia su propio array de 23
 * links (i18n, con iconos) y `page.tsx` armaba otro array de tool cards
 * con titulos en español hardcodeados y emojis. Dos listas del mismo
 * mapa de sitio, que se desincronizaban: 8 destinos existian solo en la
 * nav y 3 solo en las tool cards.
 */

/** id del grupo. Es la clave ESTABLE: la usa el CSS (`data-group`) y la
 *  persistencia del orden. Nunca se deriva del titulo visible — si se
 *  derivara, traducir el titulo romperia los acentos por seccion. */
export type AdminGroupId =
  | 'catalogo'
  | 'moderacion'
  | 'taxonomias'
  | 'publicacion'
  | 'sistema';

export interface AdminGroup {
  id: AdminGroupId;
  titleKey: TranslationKey;
}

export interface AdminDestination {
  /** id estable — clave de orden persistido. Independiente del href. */
  id: string;
  href: string;
  groupId: AdminGroupId;
  icon: ReactNode;
  labelKey: TranslationKey;
  shortKey: TranslationKey;
  /** Si es false, existe en la nav pero no como tarjeta de atajo. */
  inShortcuts?: boolean;
}

/**
 * Orden de grupos, por frecuencia de uso real:
 * 1. catalogo    — el trabajo diario de cargar y curar titulos.
 * 2. moderacion  — todo lo que tiene una cola de pendientes esperando.
 * 3. taxonomias  — mantenimiento por lote, no diario.
 * 4. publicacion — lo que sale hacia el usuario final.
 * 5. sistema     — operacion.
 *
 * Antes eran 3 grupos y "Comunidad" mezclaba moderacion (comentarios,
 * resenas, sitios) con gestion de usuarios, mientras "Catalogo" cargaba
 * 10 items de los cuales 6 eran taxonomia pura.
 */
export const ADMIN_GROUPS: readonly AdminGroup[] = [
  { id: 'catalogo', titleKey: 'adminNav.groupCatalog' },
  { id: 'moderacion', titleKey: 'adminNav.groupModeration' },
  { id: 'taxonomias', titleKey: 'adminNav.groupTaxonomies' },
  { id: 'publicacion', titleKey: 'adminNav.groupPublishing' },
  { id: 'sistema', titleKey: 'adminNav.groupSystem' },
];

export const ADMIN_DESTINATIONS: readonly AdminDestination[] = [
  // --- Catalogo -----------------------------------------------------
  {
    id: 'series',
    href: '/admin/series',
    groupId: 'catalogo',
    icon: <AppstoreOutlined />,
    labelKey: 'adminNav.series',
    shortKey: 'adminNav.seriesShort',
  },
  {
    id: 'import',
    href: '/admin/series/importar',
    groupId: 'catalogo',
    icon: <ImportOutlined />,
    labelKey: 'adminNav.import',
    shortKey: 'adminNav.importShort',
  },
  {
    id: 'channel-sweep',
    href: '/admin/series/barrido',
    groupId: 'catalogo',
    icon: <RadarChartOutlined />,
    labelKey: 'adminNav.channelSweep',
    shortKey: 'adminNav.channelSweepShort',
  },
  {
    id: 'watch-hub',
    href: '/admin/ver',
    groupId: 'catalogo',
    icon: <PlayCircleOutlined />,
    labelKey: 'adminNav.watchHub',
    shortKey: 'adminNav.watchHubShort',
  },
  {
    id: 'user-submitted',
    href: '/admin/series/user-submitted',
    groupId: 'catalogo',
    icon: <UserAddOutlined />,
    labelKey: 'adminNav.userEmbed',
    shortKey: 'adminNav.userEmbedShort',
  },
  {
    // Contenido embebible es metadata de serie (204 series sin contenido),
    // no moderacion: por eso vive en catalogo y no en comunidad como antes.
    id: 'content',
    href: '/admin/contenido',
    groupId: 'catalogo',
    icon: <PlayCircleOutlined />,
    labelKey: 'adminNav.content',
    shortKey: 'adminNav.contentShort',
  },

  // --- Moderacion ---------------------------------------------------
  {
    id: 'comments',
    href: '/admin/comentarios',
    groupId: 'moderacion',
    icon: <MessageOutlined />,
    labelKey: 'adminNav.comments',
    shortKey: 'adminNav.commentsShort',
  },
  {
    id: 'reviews',
    href: '/admin/resenas',
    groupId: 'moderacion',
    icon: <ReadOutlined />,
    labelKey: 'adminNav.reviews',
    shortKey: 'adminNav.reviewsShort',
  },
  {
    id: 'sites',
    href: '/admin/sitios',
    groupId: 'moderacion',
    icon: <LinkOutlined />,
    labelKey: 'adminNav.sites',
    shortKey: 'adminNav.sitesShort',
  },
  {
    id: 'suggestions',
    href: '/admin/sugerencias',
    groupId: 'moderacion',
    icon: <BulbOutlined />,
    labelKey: 'adminNav.suggestions',
    shortKey: 'adminNav.suggestionsShort',
  },
  {
    id: 'feedback',
    href: '/admin/feedback',
    groupId: 'moderacion',
    icon: <BugOutlined />,
    labelKey: 'adminNav.feedback',
    shortKey: 'adminNav.feedbackShort',
  },
  {
    id: 'support',
    href: '/admin/soporte',
    groupId: 'moderacion',
    icon: <CustomerServiceOutlined />,
    labelKey: 'adminNav.support',
    shortKey: 'adminNav.supportShort',
  },

  // --- Taxonomias ---------------------------------------------------
  {
    id: 'tags',
    href: '/admin/tags',
    groupId: 'taxonomias',
    icon: <TagsOutlined />,
    labelKey: 'adminNav.tags',
    shortKey: 'adminNav.tagsShort',
  },
  {
    id: 'universes',
    href: '/admin/universos',
    groupId: 'taxonomias',
    icon: <GlobalOutlined />,
    labelKey: 'adminNav.universes',
    shortKey: 'adminNav.universesShort',
  },
  {
    id: 'actors',
    href: '/admin/actores',
    groupId: 'taxonomias',
    icon: <UserOutlined />,
    labelKey: 'adminNav.actors',
    shortKey: 'adminNav.actorsShort',
  },
  {
    id: 'directors',
    href: '/admin/directores',
    groupId: 'taxonomias',
    icon: <VideoCameraOutlined />,
    labelKey: 'adminNav.directors',
    shortKey: 'adminNav.directorsShort',
  },
  {
    id: 'production-companies',
    href: '/admin/productoras',
    groupId: 'taxonomias',
    icon: <BankOutlined />,
    labelKey: 'adminNav.productionCompanies',
    shortKey: 'adminNav.productionCompaniesShort',
  },
  {
    id: 'languages',
    href: '/admin/idiomas',
    groupId: 'taxonomias',
    icon: <TranslationOutlined />,
    labelKey: 'adminNav.languages',
    shortKey: 'adminNav.languagesShort',
  },
  {
    id: 'glossary',
    href: '/admin/glosario',
    groupId: 'taxonomias',
    icon: <BookOutlined />,
    labelKey: 'adminNav.glossary',
    shortKey: 'adminNav.glossaryShort',
  },

  // --- Publicacion --------------------------------------------------
  {
    id: 'news',
    href: '/admin/noticias',
    groupId: 'publicacion',
    icon: <NotificationOutlined />,
    labelKey: 'adminNav.news',
    shortKey: 'adminNav.newsShort',
  },
  {
    id: 'announcements',
    href: '/admin/anuncios',
    groupId: 'publicacion',
    icon: <SoundOutlined />,
    labelKey: 'adminNav.announcements',
    shortKey: 'adminNav.announcementsShort',
  },
  {
    id: 'changelog',
    href: '/admin/changelog',
    groupId: 'publicacion',
    icon: <UnorderedListOutlined />,
    labelKey: 'adminNav.changelog',
    shortKey: 'adminNav.changelogShort',
  },

  // --- Sistema ------------------------------------------------------
  {
    id: 'users',
    href: '/admin/usuarios',
    groupId: 'sistema',
    icon: <UserOutlined />,
    labelKey: 'adminNav.users',
    shortKey: 'adminNav.usersShort',
  },
  {
    id: 'logs',
    href: '/admin/logs',
    groupId: 'sistema',
    icon: <FileTextOutlined />,
    labelKey: 'adminNav.logs',
    shortKey: 'adminNav.logsShort',
  },
  {
    id: 'stats',
    href: '/admin/stats',
    groupId: 'sistema',
    icon: <BarChartOutlined />,
    labelKey: 'adminNav.stats',
    shortKey: 'adminNav.statsShort',
  },
  {
    id: 'info',
    href: '/admin/info',
    groupId: 'sistema',
    icon: <InfoCircleOutlined />,
    labelKey: 'adminNav.info',
    shortKey: 'adminNav.infoShort',
  },
  {
    id: 'runtime',
    href: '/admin/runtime',
    groupId: 'sistema',
    icon: <ThunderboltOutlined />,
    labelKey: 'adminNav.runtime',
    shortKey: 'adminNav.runtimeShort',
  },
];

/** Destinos de un grupo, en el orden declarado arriba. */
export function destinationsOf(groupId: AdminGroupId): AdminDestination[] {
  return ADMIN_DESTINATIONS.filter((d) => d.groupId === groupId);
}
