'use client';

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  type DashboardItemHeightMode,
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
  hMode?: DashboardItemHeightMode;
  onResetHeight?: () => void;
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
  hMode,
  onResetHeight,
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
      hMode,
      onResetHeight,
    }),
    [
      editing,
      breakpoint,
      onRemove,
      rowHeight,
      gap,
      minH,
      onAutoHeight,
      hMode,
      onResetHeight,
    ]
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
 *
 * Los items en hMode 'manual' quedan afuera del override: su `h` es una
 * preferencia explicita del usuario y se respeta aunque el contenido no
 * entre (en ese caso el body del Widget scrollea).
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
      if (bp !== activeBp || it.hMode === 'manual') return { ...it };
      const auto = autoHeights.get(it.i);
      return auto ? { ...it, h: auto } : { ...it };
    });
  });
  return out as ResponsiveLayouts<DashboardBreakpoint>;
}

/** Compara dos sets de layouts por los campos que realmente persistimos.
 *  Sirve para cortar el ciclo medicion → onLayoutChange → setLayouts →
 *  write, que sin este corte dispara una escritura a localStorage y un
 *  PUT al server en cada carga de pagina sin que el usuario toque nada. */
function layoutsEqual(a: DashboardLayouts, b: DashboardLayouts): boolean {
  const bps = new Set<DashboardBreakpoint>([
    ...(Object.keys(a) as DashboardBreakpoint[]),
    ...(Object.keys(b) as DashboardBreakpoint[]),
  ]);
  for (const bp of bps) {
    const ia = a[bp] ?? [];
    const ib = b[bp] ?? [];
    if (ia.length !== ib.length) return false;
    for (let idx = 0; idx < ia.length; idx += 1) {
      const x = ia[idx];
      const y = ib[idx];
      if (
        x.i !== y.i ||
        x.x !== y.x ||
        x.y !== y.y ||
        x.w !== y.w ||
        x.h !== y.h ||
        x.hMode !== y.hMode
      ) {
        return false;
      }
    }
  }
  return true;
}

function fromRglLayouts(
  rgl: ResponsiveLayouts<DashboardBreakpoint>
): DashboardLayouts {
  const out: DashboardLayouts = {};
  (Object.keys(rgl) as DashboardBreakpoint[]).forEach((bp) => {
    const items = rgl[bp];
    if (!items) return;
    out[bp] = items.map((it: LayoutItem) => {
      // `hMode` es nuestro, no de RGL: la libreria lo arrastra intacto en
      // el objeto del item, pero no esta en su tipo — de ahi el cast
      // acotado a este campo (sin `any`).
      const { hMode } = it as LayoutItem & { hMode?: DashboardItemHeightMode };
      return {
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
        ...(hMode ? { hMode } : {}),
      };
    });
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

  // Espejo de la prop `layouts` leible desde callbacks sin recrearlos en
  // cada render.
  const layoutsRef = useRef(layouts);
  useEffect(() => {
    layoutsRef.current = layouts;
  }, [layouts]);

  // Ids cuyo resize handle solto el usuario en este gesto. RGL dispara
  // onResizeStop sincronicamente justo antes de onLayoutChange, por eso
  // alcanza un ref (un state no estaria actualizado a tiempo).
  const justResizedRef = useRef<Set<string>>(new Set());

  const handleResizeStop = useCallback(
    (
      _layout: Layout,
      _oldItem: LayoutItem | null,
      newItem: LayoutItem | null
    ) => {
      if (newItem) justResizedRef.current.add(newItem.i);
    },
    []
  );

  const handleLayoutChange = useCallback(
    (_layout: Layout, allLayouts: ResponsiveLayouts<DashboardBreakpoint>) => {
      if (!onLayoutsChange) return;
      const prev = layoutsRef.current;
      const next = fromRglLayouts(allLayouts);
      const resized = justResizedRef.current;

      (Object.keys(next) as DashboardBreakpoint[]).forEach((bp) => {
        const before = new Map((prev[bp] ?? []).map((it) => [it.i, it]));
        next[bp] = (next[bp] ?? []).map((it) => {
          if (resized.has(it.i)) {
            // El usuario acaba de fijar esta altura a mano: recien ahora
            // `h` es una preferencia y merece persistirse.
            return { ...it, hMode: 'manual' as const };
          }
          const was = before.get(it.i);
          if (!was || was.hMode === 'manual') return it;
          // Item en modo auto: el `h` que devuelve RGL es la altura MEDIDA
          // del contenido (override de render), no algo que el usuario
          // haya pedido — se descarta y se conserva el `h` guardado. x/y/w
          // si son cambios reales (drag/resize horizontal) y se respetan.
          return { ...it, h: was.h };
        });
      });
      justResizedRef.current = new Set();

      // Sin este corte, la primera medicion de cada carga persiste sola.
      if (layoutsEqual(next, prev)) return;
      onLayoutsChange(next);
    },
    [onLayoutsChange]
  );

  // Devuelve un item a modo auto: borra hMode para que la medicion del
  // contenido vuelva a mandar. Lee la prop `layouts` (no el ref) porque
  // se invoca desde un onClick, donde el valor del render vigente ya es
  // el correcto.
  const handleResetHeight = useCallback(
    (id: string) => {
      if (!onLayoutsChange) return;
      const next: DashboardLayouts = {};
      (Object.keys(layouts) as DashboardBreakpoint[]).forEach((bp) => {
        next[bp] = (layouts[bp] ?? []).map((it) => {
          if (it.i !== id) return it;
          // Se reconstruye sin hMode en vez de setearlo en undefined para
          // no dejar la clave suelta en el JSON persistido.
          const { hMode: _dropped, ...rest } = it;
          return rest;
        });
      });
      onLayoutsChange(next);
    },
    [layouts, onLayoutsChange]
  );

  const resetHeightHandlers = useMemo(() => {
    const map = new Map<string, () => void>();
    for (const item of items) {
      map.set(item.i, () => handleResetHeight(item.i));
    }
    return map;
  }, [items, handleResetHeight]);

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
          onResizeStop={handleResizeStop}
          onLayoutChange={handleLayoutChange}
        >
          {items.map((item) => {
            // El hMode vive por breakpoint: el que vale es el del activo.
            const activeItem =
              (layouts[currentBp] ?? items).find((it) => it.i === item.i) ??
              item;
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
                  hMode={activeItem.hMode}
                  onResetHeight={resetHeightHandlers.get(item.i)}
                />
              </div>
            );
          })}
        </Responsive>
      )}
    </div>
  );
}
