'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { DashboardBreakpoint, DashboardItemHeightMode } from './types';

/** Metadatos que el grid expone a cada widget hijo. */
export interface DashboardItemContextValue {
  editing: boolean;
  breakpoint: DashboardBreakpoint;
  dragHandleClassName: string;
  onRemove?: () => void;
  /** rowHeight/gap (px) de ESTE grid — necesarios para que Widget
   *  convierta su alto de contenido medido a unidades `h` de grid. */
  rowHeight: number;
  gap: number;
  /** Piso minimo de `h` para este item (de su definicion en el layout).
   *  Evita que un widget con contenido minimo colapse a una caja
   *  absurdamente chica (ej. solo el header, sin margen). */
  minH?: number;
  /** El widget reporta cuantas unidades `h` necesita para mostrar su
   *  contenido real sin cortar — DashboardGrid ajusta el layout solo.
   *  En modo 'manual' el widget NO reporta (la altura la fijo el usuario). */
  onAutoHeight?: (h: number) => void;
  /** Ver DashboardItemHeightMode. Ausente ≡ 'auto'. */
  hMode?: DashboardItemHeightMode;
  /** Devuelve el item a modo 'auto' (altura mandada por el contenido).
   *  Solo se ofrece en modo edicion y solo si hMode === 'manual'. */
  onResetHeight?: () => void;
}

const Context = createContext<DashboardItemContextValue | null>(null);

export function DashboardItemProvider({
  value,
  children,
}: {
  value: DashboardItemContextValue;
  children: ReactNode;
}) {
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

/** Devuelve el meta del item del dashboard, o null si no esta en uno. */
export function useDashboardItem(): DashboardItemContextValue | null {
  return useContext(Context);
}
