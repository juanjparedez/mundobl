/**
 * Design system primitives — usados por cualquier pagina/feature.
 *
 * Convencion:
 * - Componentes 100% genericos. NO contienen texto hardcodeado: cualquier
 *   string visible llega via props/children desde la pagina, ya pasado por
 *   useLocale().t(). Asi mantenemos i18n a 10 locales sin tocar estos.
 * - Estilos via CSS vars (--bg-*, --text-*, --primary-color, --border-*,
 *   --radius-*, --shadow-*). Cada componente lleva overrides bajo
 *   html[data-skin='premium'][data-theme='dark'] cuando hace falta.
 * - El accent (--primary-color) es configurable por el usuario; nunca
 *   hardcodear hex de marca dentro de estos componentes.
 */

export { PanelCard } from './PanelCard/PanelCard';
export type { PanelCardProps } from './PanelCard/PanelCard';

export { SectionHeader } from './SectionHeader/SectionHeader';
export type { SectionHeaderProps } from './SectionHeader/SectionHeader';

export { EmptyState } from './EmptyState/EmptyState';
export type { EmptyStateProps } from './EmptyState/EmptyState';

export { Chip } from './Chip/Chip';
export type { ChipProps, ChipTone } from './Chip/Chip';

export { StatCard } from './StatCard/StatCard';
export type { StatCardProps } from './StatCard/StatCard';

export { ActionCard } from './ActionCard/ActionCard';
export type { ActionCardProps } from './ActionCard/ActionCard';

export { MediaCard } from './MediaCard/MediaCard';
export type { MediaCardProps } from './MediaCard/MediaCard';
