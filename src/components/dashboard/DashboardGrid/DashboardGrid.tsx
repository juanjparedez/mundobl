'use client';

import { useMemo, useState } from 'react';
import {
  Responsive,
  type LayoutItem,
  type ResponsiveLayouts,
} from 'react-grid-layout';
import { useContainerWidth } from 'react-grid-layout/react';
import { Widget } from '../Widget/Widget';
import { WidgetRegistry } from '../WidgetRegistry/WidgetRegistry';
import { DashboardItemProvider } from '../DashboardItemContext';
import {
  DASHBOARD_BREAKPOINTS,
  DASHBOARD_COLS,
  type DashboardBreakpoint,
  type DashboardItem,
  type DashboardLayouts,
} from '../types';
import 'react-grid-layout/css/styles.css';
import './DashboardGrid.css';

const DRAG_HANDLE_CLASS = 'mb-widget__drag-handle';

export interface DashboardGridProps {
  /** Layouts iniciales por breakpoint. */
  layouts: DashboardLayouts;
  /** Props que se pasan a cada widget — el caller las inyecta por id. */
  widgetProps?: Record<string, Record<string, unknown>>;
  /** Modo edicion: muestra drag handles + remove btns + reordena. */
  editing?: boolean;
  /** Llamado cuando cambia el layout (drag/resize). */
  onLayoutsChange?: (layouts: DashboardLayouts) => void;
  /** Llamado cuando se quita un widget (modo edicion). */
  onRemoveWidget?: (id: string) => void;
  /** Altura por celda, en px. Default 60. */
  rowHeight?: number;
  /** Margin horizontal/vertical entre items, en px. Default 16. */
  gap?: number;
  /** className adicional. */
  className?: string;
}

function toRglLayouts(
  layouts: DashboardLayouts
): ResponsiveLayouts<DashboardBreakpoint> {
  const out: Partial<Record<DashboardBreakpoint, LayoutItem[]>> = {};
  (Object.keys(layouts) as DashboardBreakpoint[]).forEach((bp) => {
    const items = layouts[bp];
    if (!items) return;
    out[bp] = items.map((it) => ({ ...it }));
  });
  return out as ResponsiveLayouts<DashboardBreakpoint>;
}

function fromRglLayouts(
  rgl: ResponsiveLayouts<DashboardBreakpoint>
): DashboardLayouts {
  const out: DashboardLayouts = {};
  (Object.keys(rgl) as DashboardBreakpoint[]).forEach((bp) => {
    const items = rgl[bp];
    if (!items) return;
    out[bp] = items.map((it: LayoutItem) => ({
      i: it.i,
      x: it.x,
      y: it.y,
      w: it.w,
      h: it.h,
      minW: it.minW,
      minH: it.minH,
      maxW: it.maxW,
      maxH: it.maxH,
      static: it.static,
    }));
  });
  return out;
}

export function DashboardGrid({
  layouts,
  widgetProps,
  editing = false,
  onLayoutsChange,
  onRemoveWidget,
  rowHeight = 60,
  gap = 16,
  className,
}: DashboardGridProps) {
  const [currentBp, setCurrentBp] = useState<DashboardBreakpoint>('lg');
  const { width, containerRef, mounted } = useContainerWidth({
    initialWidth: 1200,
  });

  const items: DashboardItem[] = useMemo(() => {
    return layouts.lg ?? layouts.md ?? layouts.sm ?? layouts.xs ?? [];
  }, [layouts]);

  return (
    <div
      ref={containerRef}
      className={`mb-dashboard-grid${editing ? ' mb-dashboard-grid--editing' : ''}${
        className ? ` ${className}` : ''
      }`}
    >
      {mounted && (
        <Responsive<DashboardBreakpoint>
          className="layout"
          width={width}
          layouts={toRglLayouts(layouts)}
          breakpoints={DASHBOARD_BREAKPOINTS}
          cols={DASHBOARD_COLS}
          rowHeight={rowHeight}
          margin={[gap, gap]}
          containerPadding={[0, 0]}
          dragConfig={{
            enabled: editing,
            handle: `.${DRAG_HANDLE_CLASS}`,
          }}
          resizeConfig={{ enabled: editing }}
          onBreakpointChange={(bp) => setCurrentBp(bp)}
          onLayoutChange={(_layout, allLayouts) => {
            if (onLayoutsChange) onLayoutsChange(fromRglLayouts(allLayouts));
          }}
        >
          {items.map((item) => {
            const def = WidgetRegistry.get(item.i);
            const ctxValue = {
              editing,
              breakpoint: currentBp,
              dragHandleClassName: DRAG_HANDLE_CLASS,
              onRemove: onRemoveWidget
                ? () => onRemoveWidget(item.i)
                : undefined,
            };
            if (!def) {
              return (
                <div key={item.i}>
                  <DashboardItemProvider value={ctxValue}>
                    <Widget>
                      <div className="mb-dashboard-grid__missing">
                        Missing widget: {item.i}
                      </div>
                    </Widget>
                  </DashboardItemProvider>
                </div>
              );
            }
            const Component = def.Component;
            const propsForWidget = widgetProps?.[item.i] ?? {};
            return (
              <div key={item.i}>
                <DashboardItemProvider value={ctxValue}>
                  <Component {...propsForWidget} />
                </DashboardItemProvider>
              </div>
            );
          })}
        </Responsive>
      )}
    </div>
  );
}
