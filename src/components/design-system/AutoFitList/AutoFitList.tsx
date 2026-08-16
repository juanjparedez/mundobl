'use client';

import {
  Children,
  isValidElement,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import './AutoFitList.css';

export interface AutoFitListProps {
  /** Un elemento (tipicamente `<li>`) ya armado por item — AutoFitList
   *  no conoce la forma del dato, solo mide y decide cuantos entran. */
  children: ReactNode;
  as?: 'ul' | 'ol';
  listClassName?: string;
  wrapClassName?: string;
  /** Minimo de items a mostrar siempre, aunque no entren del todo por
   *  poco (evita colapsar a 0 por un redondeo de borde). */
  minVisible?: number;
  viewLessLabel: ReactNode;
  /** Recibe la cantidad TOTAL de items (no la oculta) — mismo contrato
   *  que ya usaban los widgets con "ver todos ({count})". */
  viewMoreLabel: (totalCount: number) => ReactNode;
}

/**
 * Lista que muestra tantos items como realmente entran en el espacio
 * vertical disponible (medido en vivo con ResizeObserver), en vez de
 * asumir un conteo fijo calculado a mano contra la altura de grid que le
 * toque al widget contenedor — la causa raiz de los widgets "cortados"
 * que se repitio varias veces: cada widget hardcodeaba su propio
 * COLLAPSED_COUNT + su propio toggle, y ese numero quedaba desincronizado
 * apenas cambiaba el contenido, la densidad de UI o el layout.
 *
 * El resto de los items queda detras de un toggle "ver mas". Al expandir,
 * el contenido puede exceder la caja del widget — en vez de clipearse
 * invisible (el bug original), la lista habilita scroll interno acotado a
 * la altura disponible, asi nunca hay contenido inalcanzable.
 *
 * Requiere que el ancestro directo tenga altura acotada (el `.mb-widget__
 * body` del dashboard ya la da via flex + rowHeight de grid).
 */
export function AutoFitList({
  children,
  as = 'ul',
  listClassName,
  wrapClassName,
  minVisible = 1,
  viewLessLabel,
  viewMoreLabel,
}: AutoFitListProps) {
  const items = Children.toArray(children).filter(isValidElement);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement | HTMLOListElement>(null);
  const [visibleCount, setVisibleCount] = useState(items.length);
  const [measuring, setMeasuring] = useState(true);
  const [showAll, setShowAll] = useState(false);

  // Cada vez que cambia la cantidad de items (nueva data, filtro, etc.)
  // forzamos una remedicion completa desde cero. Patron oficial de React
  // para "resetear estado cuando cambia un input" — ajustar durante el
  // render (no en un efecto) evita un paint intermedio de mas.
  const [prevLength, setPrevLength] = useState(items.length);
  if (items.length !== prevLength) {
    setPrevLength(items.length);
    setMeasuring(true);
  }

  // Fase de medicion: en este render se pintaron TODOS los items (ver
  // `shown` mas abajo) — measuring corre antes del paint del browser, asi
  // que este estado intermedio nunca llega a verse. Requiere el DOM ya
  // commiteado (offsetHeight real), por eso va en un efecto y no se puede
  // resolver ajustando estado durante el render.
  useLayoutEffect(() => {
    if (!measuring) return;
    const wrap = wrapRef.current;
    const list = listRef.current;
    if (!wrap || !list) return;
    const available = wrap.clientHeight;
    const nodes = Array.from(list.children) as HTMLElement[];

    // Agrupar por fila (mismo offsetTop redondeado) en vez de sumar
    // offsetHeight item por item — soporta tanto listas de una columna
    // (cada item es su propia fila) como grids de N columnas (ej. el
    // grid de covers de FavoritesWidget) sin necesitar un modo aparte.
    const rows: HTMLElement[][] = [];
    for (const node of nodes) {
      const top = Math.round(node.offsetTop);
      const lastRow = rows[rows.length - 1];
      if (lastRow && Math.round(lastRow[0].offsetTop) === top) {
        lastRow.push(node);
      } else {
        rows.push([node]);
      }
    }

    let used = 0;
    let count = 0;
    for (const row of rows) {
      const rowHeight = Math.max(...row.map((n) => n.offsetHeight));
      if (used + rowHeight > available && count >= minVisible) break;
      used += rowHeight;
      count += row.length;
    }
    setVisibleCount(Math.min(Math.max(count, minVisible), nodes.length));
    setMeasuring(false);
  }, [measuring, minVisible]);

  // Re-mide cuando el widget cambia de tamano real (resize/drag del
  // dashboard, cambio de breakpoint, cambio de density) — no solo cuando
  // cambian los datos.
  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const ro = new ResizeObserver(() => setMeasuring(true));
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  const hasMore = items.length > visibleCount;
  const shown = measuring || showAll ? items : items.slice(0, visibleCount);
  const wrapClass = [
    'mb-autofit-list__wrap',
    showAll && 'mb-autofit-list__wrap--expanded',
    wrapClassName,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div ref={wrapRef} className={wrapClass}>
      {as === 'ol' ? (
        <ol ref={listRef as never} className={listClassName}>
          {shown}
        </ol>
      ) : (
        <ul ref={listRef as never} className={listClassName}>
          {shown}
        </ul>
      )}
      {hasMore && !measuring && (
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
