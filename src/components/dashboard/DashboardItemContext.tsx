'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { DashboardBreakpoint } from './types';

/** Metadatos que el grid expone a cada widget hijo. */
export interface DashboardItemContextValue {
  editing: boolean;
  breakpoint: DashboardBreakpoint;
  dragHandleClassName: string;
  onRemove?: () => void;
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
