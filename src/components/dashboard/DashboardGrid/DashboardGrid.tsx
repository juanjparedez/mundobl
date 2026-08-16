'use client';

import { memo, useCallback, useMemo, useState } from 'react';
import {
  Responsive,
  type Layout,
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

interface DashboardGridItemProps {
  itemId: string;
  editing: boolean;
  breakpoint: DashboardBreakpoint;
  onRemove?: () => void;
  widgetProps?: Record<string, unknown>;
  rowHeight: number;
  gap: number;
  minH?: number;
  onAutoHeight?: (h: number) => void;
}

/**
 * Un item del grid, memoizado (React.memo) para que arrastrar/redimensionar
 * OTRO widget (que dispara un re-render de DashboardGrid entero via
 * setLayouts) no fuerce el re-render de los widgets que no cambiaron —
 * antes `ctxValue` se recreaba inline en el .map() de mas abajo en cada
 * render, invalidando el context de TODOS los widgets a la vez.
 */
const DashboardGridItem = memo(function DashboardGridItem({
  itemId,
  editing,
  breakpoint,
  onRemove,
  widgetProps,
  rowHeight,
  gap,
  minH,
  onAutoHeight,
}: DashboardGridItemProps) {
  const def = WidgetRegistry.get(itemId);

  const ctxValue = useMemo(
    () => ({
      editing,
      breakpoint,
      dragHandleClassName: DRAG_HANDLE_CLASS,
      onRemove,
      rowHeight,
      gap,
      minH,
      onAutoHeight,
    }),
    [editing, breakpoint, onRemove, rowHeight, gap, minH, onAutoHeight]
  );

  if (!def) {
    return (
      <DashboardItemProvider value={ctxValue}>
        <Widget>
          <div className="mb-dashboard-grid__missing">
            Missing widget: {itemId}
          </div>
        </Widget>
      </DashboardItemProvider>
    );
  }

  const Component = def.Component;
  return (
    <DashboardItemProvider value={ctxValue}>
      <Component {...(widgetProps ?? {})} />
    </DashboardItemProvider>
  );
});

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

/**
 * Convierte DashboardLayouts (nuestro shape) al shape que espera RGL,
 * aplicando el override de auto-height SOLO al breakpoint activo (es el
 * unico que se esta midiendo/renderizando ahora mismo — los demas
 * conservan el `h` persistido/preset hasta que se activen y se midan).
 */
function toRglLayouts(
  layouts: DashboardLayouts,
  autoHeights: Map<string, number>,
  activeBp: DashboardBreakpoint
): ResponsiveLayouts<DashboardBreakpoint> {
  const out: Partial<Record<DashboardBreakpoint, LayoutItem[]>> = {};
  (Object.keys(layouts) as DashboardBreakpoint[]).forEach((bp) => {
    const items = layouts[bp];
    if (!items) return;
    out[bp] = items.map((it) => {
      const auto = bp === activeBp ? autoHeights.get(it.i) : undefined;
      return auto ? { ...it, h: auto } : { ...it };
    });
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

  // Un callback estable por widget (no uno nuevo en cada render) — solo se
  // recalcula si cambia la lista de items o el handler de remove en si.
  const removeHandlers = useMemo(() => {
    const map = new Map<string, () => void>();
    if (!onRemoveWidget) return map;
    for (const item of items) {
      map.set(item.i, () => onRemoveWidget(item.i));
    }
    return map;
  }, [items, onRemoveWidget]);

  // Alto real que cada widget reporto necesitar (medido con
  // ResizeObserver en Widget). Vive SOLO aca (no se persiste, no pasa
  // por onLayoutsChange) — es un override de render, no una preferencia
  // del usuario. Cada widget lo recalcula y actualiza solo.
  const [autoHeights, setAutoHeights] = useState<Map<string, number>>(
    new Map()
  );

  const autoHeightHandlers = useMemo(() => {
    const map = new Map<string, (h: number) => void>();
    for (const item of items) {
      map.set(item.i, (h: number) => {
        setAutoHeights((prev) => {
          if (prev.get(item.i) === h) return prev;
          const next = new Map(prev);
          next.set(item.i, h);
          return next;
        });
      });
    }
    return map;
  }, [items]);

  const handleLayoutChange = useCallback(
    (_layout: Layout, allLayouts: ResponsiveLayouts<DashboardBreakpoint>) => {
      if (onLayoutsChange) onLayoutsChange(fromRglLayouts(allLayouts));
    },
    [onLayoutsChange]
  );

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
          layouts={toRglLayouts(layouts, autoHeights, currentBp)}
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
          onLayoutChange={handleLayoutChange}
        >
          {items.map((item) => {
            return (
              <div key={item.i}>
                <DashboardGridItem
                  itemId={item.i}
                  editing={editing}
                  breakpoint={currentBp}
                  onRemove={removeHandlers.get(item.i)}
                  widgetProps={widgetProps?.[item.i]}
                  rowHeight={rowHeight}
                  gap={gap}
                  minH={
                    item.minH ?? WidgetRegistry.get(item.i)?.defaultSize.minH
                  }
                  onAutoHeight={autoHeightHandlers.get(item.i)}
                />
              </div>
            );
          })}
        </Responsive>
      )}
    </div>
  );
}
