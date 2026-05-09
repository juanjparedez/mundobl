import type { ComponentType, ReactNode } from 'react';
import type { Role } from '@/generated/prisma';

/** Breakpoints estandar usados por DashboardGrid (matchea react-grid-layout). */
export const DASHBOARD_BREAKPOINTS = {
  lg: 1200,
  md: 996,
  sm: 768,
  xs: 480,
  xxs: 0,
} as const;

export type DashboardBreakpoint = keyof typeof DASHBOARD_BREAKPOINTS;

/** Numero de columnas por breakpoint. */
export const DASHBOARD_COLS: Record<DashboardBreakpoint, number> = {
  lg: 12,
  md: 10,
  sm: 6,
  xs: 4,
  xxs: 2,
};

/** Item del grid: identifica que widget renderizar en que celda. */
export interface DashboardItem {
  /** id estable del widget. Debe matchear con WidgetRegistry. */
  i: string;
  /** Posicion: x col, y row. */
  x: number;
  y: number;
  /** Tamaño en celdas. */
  w: number;
  h: number;
  /** Limites opcionales. */
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
  /** Bloquea drag/resize (incluso en modo edicion). */
  static?: boolean;
}

/** Layouts por breakpoint — react-grid-layout responsive shape. */
export type DashboardLayouts = Partial<
  Record<DashboardBreakpoint, DashboardItem[]>
>;

/** Definicion de un widget reutilizable. */
export interface WidgetDefinition<TProps = Record<string, unknown>> {
  /** id estable usado en layouts y persistencia. */
  id: string;
  /** Categoria — usada para agrupar en el picker del modo edicion. */
  category: WidgetCategory;
  /** Roles que pueden ver/agregar este widget. Default: todos. */
  roles?: Role[];
  /** Variantes de modo (consumer = vista normal, creator = enfocado en producir). */
  modes?: WidgetMode[];
  /** Etiqueta visible — clave i18n: la pagina la pasa por t() al renderizar. */
  labelKey: string;
  /** Descripcion corta — clave i18n. */
  descriptionKey?: string;
  /** Tamaño por defecto al agregar al grid. */
  defaultSize: {
    w: number;
    h: number;
    minW?: number;
    minH?: number;
  };
  /** Componente que renderiza el contenido. */
  Component: ComponentType<TProps>;
  /** Si true, no aparece en el picker (es solo programatico). */
  hidden?: boolean;
}

export type WidgetCategory =
  | 'overview'
  | 'activity'
  | 'media'
  | 'admin'
  | 'social'
  | 'settings'
  | 'custom';

export type WidgetMode = 'consumer' | 'creator' | 'admin';

/** Configuracion de un dashboard ya armado (preset). */
export interface DashboardPreset {
  /** id estable. */
  id: string;
  /** Clave i18n para el nombre visible. */
  labelKey: string;
  /** Layouts por breakpoint. */
  layouts: DashboardLayouts;
  /** Modo asociado (para filtrar widgets disponibles al editarlo). */
  mode?: WidgetMode;
}

/** Slot del widget: renderizado por la pagina con un title (i18n) y body.
 *
 * Cuando vive dentro de un DashboardGrid, el modo edicion + drag handle +
 * onRemove se inyectan via DashboardItemContext. Las mismas props quedan
 * disponibles para usar el Widget standalone (fuera de un grid).
 */
export interface WidgetSlotProps {
  /** Texto del header — provisto por la pagina ya pasado por t(). */
  title?: ReactNode;
  /** Icono opcional a la izquierda del title. */
  icon?: ReactNode;
  /** Acciones del header. */
  actions?: ReactNode;
  /** Contenido. */
  children: ReactNode;
  /** Sin padding en body. */
  noPadding?: boolean;
  /** Override del modo edicion. Si esta en un DashboardGrid, prefiere context. */
  editing?: boolean;
  /** Override del remove handler. Si esta en un DashboardGrid, prefiere context. */
  onRemove?: () => void;
  /** Override del drag handle classname. Si esta en un DashboardGrid, prefiere context. */
  dragHandleClassName?: string;
}
