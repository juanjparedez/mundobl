'use client';

import { useLayoutEffect, useRef } from 'react';
import { CloseOutlined, HolderOutlined } from '@ant-design/icons';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { useDashboardItem } from '../DashboardItemContext';
import type { WidgetSlotProps } from '../types';
import './Widget.css';

/**
 * Wrapper de cada widget dentro del DashboardGrid.
 *
 * Renderiza un panel con header opcional (icono + titulo + acciones), un
 * drag handle (visible solo en editing) y un boton de remove (solo en
 * editing). El body recibe el contenido del widget.
 *
 * Si esta dentro de un DashboardGrid, el modo edicion + drag handle +
 * onRemove vienen automaticamente via DashboardItemContext. Si se usa
 * standalone (fuera de un grid), se pueden pasar como props.
 *
 * Auto-height: mide su propio contenido (header + body sin recortar, via
 * `.mb-widget__measure`, que no tiene alto impuesto) y le reporta al
 * grid cuantas unidades `h` necesita para mostrarlo completo — el grid
 * ajusta el layout solo, en vez de que cada widget adivine a mano un `h`
 * fijo que se desincroniza apenas cambia el contenido. Solo corre dentro
 * de un DashboardGrid (requiere `ctx.onAutoHeight`); standalone no hace
 * nada distinto a como se comportaba antes.
 *
 * Cero strings hardcodeados — `title` viene traducido desde la pagina.
 * Solo el aria-label del drag/remove usa una clave i18n compartida.
 */
export function Widget({
  title,
  icon,
  actions,
  children,
  noPadding = false,
  fade = false,
  editing: editingProp,
  onRemove: onRemoveProp,
  dragHandleClassName: dragHandleClassNameProp,
}: WidgetSlotProps) {
  const { t } = useLocale();
  const ctx = useDashboardItem();

  // Context wins over props when present.
  const editing = ctx?.editing ?? editingProp ?? false;
  const onRemove = ctx?.onRemove ?? onRemoveProp;
  const dragHandleClassName =
    ctx?.dragHandleClassName ?? dragHandleClassNameProp;

  const headerRef = useRef<HTMLElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const lastReportedH = useRef<number | null>(null);

  const { onAutoHeight, rowHeight, gap, minH } = ctx ?? {};

  useLayoutEffect(() => {
    if (!onAutoHeight || !rowHeight || gap === undefined || !measureRef.current)
      return;

    const recompute = () => {
      const headerPx = headerRef.current?.offsetHeight ?? 0;
      const bodyPx = measureRef.current?.offsetHeight ?? 0;
      const totalPx = headerPx + bodyPx;
      // Inversa de boxHeight(h) = rowHeight*h + gap*(h-1): h necesario
      // para que la caja del grid alcance (o supere) el contenido real.
      const needed = Math.ceil((totalPx + gap) / (rowHeight + gap));
      const clamped = Math.max(minH ?? 1, needed);
      if (clamped !== lastReportedH.current) {
        lastReportedH.current = clamped;
        onAutoHeight(clamped);
      }
    };

    recompute();
    const ro = new ResizeObserver(recompute);
    ro.observe(measureRef.current);
    if (headerRef.current) ro.observe(headerRef.current);
    return () => ro.disconnect();
  }, [onAutoHeight, rowHeight, gap, minH]);

  return (
    <article
      className={`mb-widget${editing ? ' mb-widget--editing' : ''}${fade ? ' mb-widget--fade' : ''}`}
      role="region"
    >
      {(title || editing) && (
        <header ref={headerRef} className="mb-widget__header">
          {editing && dragHandleClassName && (
            <span
              className={`mb-widget__drag-handle ${dragHandleClassName}`}
              role="presentation"
              aria-label={t('dashboard.dragHandleAria')}
              title={t('dashboard.dragHandleAria')}
            >
              <HolderOutlined aria-hidden />
            </span>
          )}
          {icon && (
            <span className="mb-widget__icon" aria-hidden>
              {icon}
            </span>
          )}
          {title && <h3 className="mb-widget__title">{title}</h3>}
          {(actions || (editing && onRemove)) && (
            <div className="mb-widget__actions">
              {actions}
              {editing && onRemove && (
                <button
                  type="button"
                  className="mb-widget__remove"
                  onClick={onRemove}
                  aria-label={t('dashboard.removeWidgetAria')}
                  title={t('dashboard.removeWidgetAria')}
                >
                  <CloseOutlined aria-hidden />
                </button>
              )}
            </div>
          )}
        </header>
      )}
      <div className="mb-widget__body">
        <div
          ref={measureRef}
          className={`mb-widget__measure${noPadding ? ' mb-widget__measure--flush' : ''}`}
        >
          {children}
        </div>
      </div>
    </article>
  );
}
