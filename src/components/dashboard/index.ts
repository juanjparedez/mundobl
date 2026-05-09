/**
 * Sistema de dashboards modulares con widgets draggable/resizable.
 *
 * Arquitectura:
 *   - WidgetRegistry: registro central de widgets disponibles. Cada
 *     pagina dashboard registra los suyos antes de renderizar.
 *   - DashboardGrid: wrapper de react-grid-layout responsive. Recibe
 *     `layouts` (por breakpoint) y opcionalmente `widgetProps` por id.
 *     Maneja drag/resize + onLayoutsChange + onRemoveWidget.
 *   - Widget: panel con header (icono + titulo + acciones), drag handle
 *     y remove btn. Visualmente premium, integrado con la skin.
 *   - DashboardItemContext: cada item del grid lee su meta (editing,
 *     breakpoint, dragHandleClassName, onRemove) via useDashboardItem().
 *     Asi los widgets no necesitan recibir esa info por props.
 *
 * Convencion i18n:
 *   - Cero strings hardcodeados en el kernel. La unica i18n key del
 *     sistema es `dashboard.dragHandleAria` y `dashboard.removeWidgetAria`,
 *     ya provistas en los 10 locales.
 *   - Cada widget recibe textos por props (title, descripcion) ya
 *     traducidos por la pagina que lo renderiza.
 */

export { DashboardGrid } from './DashboardGrid/DashboardGrid';
export type { DashboardGridProps } from './DashboardGrid/DashboardGrid';

export { Widget } from './Widget/Widget';

export { WidgetRegistry } from './WidgetRegistry/WidgetRegistry';

export {
  DashboardItemProvider,
  useDashboardItem,
} from './DashboardItemContext';
export type { DashboardItemContextValue } from './DashboardItemContext';

export {
  DASHBOARD_BREAKPOINTS,
  DASHBOARD_COLS,
  type DashboardBreakpoint,
  type DashboardItem,
  type DashboardLayouts,
  type DashboardPreset,
  type WidgetCategory,
  type WidgetDefinition,
  type WidgetMode,
  type WidgetSlotProps,
} from './types';
