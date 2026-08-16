'use client';

import { Children, isValidElement, useState, type ReactNode } from 'react';
import './AutoFitList.css';

export interface AutoFitListProps {
  /** Un elemento (tipicamente `<li>`) ya armado por item — AutoFitList
   *  no conoce la forma del dato, solo decide cuantos mostrar. */
  children: ReactNode;
  as?: 'ul' | 'ol';
  listClassName?: string;
  wrapClassName?: string;
  /** Cantidad de items visibles antes de colapsar detras de "ver mas". */
  collapsedCount: number;
  viewLessLabel: ReactNode;
  /** Recibe la cantidad TOTAL de items (no la oculta) — mismo contrato
   *  que ya usaban los widgets con "ver todos ({count})". */
  viewMoreLabel: (totalCount: number) => ReactNode;
}

/**
 * Lista colapsable reusable: muestra `collapsedCount` items y el resto
 * queda detras de un toggle "ver mas". Reemplaza la version anterior
 * (que media en vivo con ResizeObserver cuantos items entraban en el
 * alto disponible del widget) porque esa medicion competia con el auto-
 * height del widget contenedor (ver useAutoHeight/DashboardGrid): el
 * widget mide su contenido para decidir su alto, y esta lista media el
 * alto del widget para decidir su contenido — un ciclo que convergia en
 * "mostrar lo minimo posible" en vez de mostrar lo que el usuario espera.
 *
 * Con el widget auto-sizeado al contenido, un conteo fijo y determinista
 * es lo correcto: el widget simplemente crece o encoge para mostrar
 * exactamente `collapsedCount` items (o todos, si se expande) — sin
 * medicion, sin ciclos, sin sorpresas.
 */
export function AutoFitList({
  children,
  as = 'ul',
  listClassName,
  wrapClassName,
  collapsedCount,
  viewLessLabel,
  viewMoreLabel,
}: AutoFitListProps) {
  const items = Children.toArray(children).filter(isValidElement);
  const [showAll, setShowAll] = useState(false);

  const hasMore = items.length > collapsedCount;
  const shown = showAll ? items : items.slice(0, collapsedCount);
  const wrapClass = ['mb-autofit-list__wrap', wrapClassName]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={wrapClass}>
      {as === 'ol' ? (
        <ol className={listClassName}>{shown}</ol>
      ) : (
        <ul className={listClassName}>{shown}</ul>
      )}
      {hasMore && (
        <button
          type="button"
          className="mb-autofit-list__toggle"
          onClick={() => setShowAll((v) => !v)}
        >
          {showAll ? viewLessLabel : viewMoreLabel(items.length)}
        </button>
      )}
    </div>
  );
}
