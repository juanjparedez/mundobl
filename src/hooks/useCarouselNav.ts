'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from 'react';

interface UseCarouselNavOptions {
  /** Fraccion del ancho visible que avanza cada click de flecha. */
  pageRatio?: number;
  /** Arrastrar con el mouse para scrollear. Default true. En touch el
   *  scroll nativo ya funciona, asi que solo se activa para punteros mouse. */
  enableDrag?: boolean;
}

export interface CarouselNav {
  /** Va sobre el elemento con `overflow-x: auto`. */
  trackRef: RefObject<HTMLDivElement | null>;
  /** false cuando el track ya esta pegado al borde izquierdo (o no
   *  desborda) — el caller deshabilita la flecha en vez de dejarla
   *  clickeable sin efecto. */
  canScrollPrev: boolean;
  canScrollNext: boolean;
  scrollPrev: () => void;
  scrollNext: () => void;
}

/** Mecanica compartida de los carruseles horizontales (catalogo, /ver,
 *  watchables). Antes cada uno repetia el mismo `scrollBy(clientWidth *
 *  0.75)` con flechas siempre activas: no habia forma de saber que ya
 *  estabas en el extremo, ni de arrastrar con el mouse en desktop.
 *
 *  Aporta:
 *  - estado real de los extremos (`canScrollPrev`/`canScrollNext`),
 *    recalculado en scroll, resize y cambios de contenido;
 *  - drag con mouse, suprimiendo el click posterior para no abrir una
 *    card cuando el usuario solo queria desplazar la fila;
 *  - respeta `prefers-reduced-motion` (salta en vez de animar). */
export function useCarouselNav({
  pageRatio = 0.75,
  enableDrag = true,
}: UseCarouselNavOptions = {}): CarouselNav {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const syncEdges = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    // 1px de tolerancia: los navegadores redondean scrollLeft con zoom
    // o anchos fraccionarios y el extremo nunca da exacto.
    setCanScrollPrev(el.scrollLeft > 1);
    setCanScrollNext(el.scrollLeft < max - 1);
  }, []);

  // Sin array de deps a proposito: los items del carrusel cambian sin que
  // el track se redimensione (mismo alto, distinto scrollWidth), y un
  // ResizeObserver no lo detecta. setState con el mismo valor no
  // re-renderiza, asi que esto no cicla.
  useEffect(syncEdges);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    el.addEventListener('scroll', syncEdges, { passive: true });
    const observer = new ResizeObserver(syncEdges);
    observer.observe(el);

    return () => {
      el.removeEventListener('scroll', syncEdges);
      observer.disconnect();
    };
  }, [syncEdges]);

  const scrollByPage = useCallback(
    (direction: 1 | -1) => {
      const el = trackRef.current;
      if (!el) return;
      const reduced = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches;
      el.scrollBy({
        left: direction * el.clientWidth * pageRatio,
        behavior: reduced ? 'auto' : 'smooth',
      });
    },
    [pageRatio]
  );

  const scrollPrev = useCallback(() => scrollByPage(-1), [scrollByPage]);
  const scrollNext = useCallback(() => scrollByPage(1), [scrollByPage]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el || !enableDrag) return;

    let dragging = false;
    let startX = 0;
    let startScrollLeft = 0;
    // Se arrastro lo suficiente como para que el gesto sea "scroll" y no
    // "click en la card" — se lee en el listener de click en captura.
    let dragged = false;

    const onPointerMove = (event: PointerEvent) => {
      if (!dragging) return;
      const delta = event.clientX - startX;
      if (Math.abs(delta) > 5) dragged = true;
      el.scrollLeft = startScrollLeft - delta;
    };

    const endDrag = () => {
      if (!dragging) return;
      dragging = false;
      el.classList.remove('mb-carousel-track--dragging');
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', endDrag);
      window.removeEventListener('pointercancel', endDrag);
    };

    const onPointerDown = (event: PointerEvent) => {
      // Solo mouse: en touch/pen el scroll nativo ya es mejor que
      // cualquier emulacion. Y solo boton principal.
      if (event.pointerType !== 'mouse' || event.button !== 0) return;
      dragging = true;
      dragged = false;
      startX = event.clientX;
      startScrollLeft = el.scrollLeft;
      // Corta el `scroll-behavior: smooth` del CSS mientras se arrastra:
      // si no, cada asignacion de scrollLeft se anima y el track "flota".
      el.classList.add('mb-carousel-track--dragging');
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', endDrag);
      window.addEventListener('pointercancel', endDrag);
    };

    // En captura y antes que el handler de la card: si el gesto fue un
    // arrastre, el click que el navegador dispara al soltar no debe
    // navegar. `dragged` se limpia en el proximo pointerdown.
    const onClickCapture = (event: MouseEvent) => {
      if (!dragged) return;
      dragged = false;
      event.preventDefault();
      event.stopPropagation();
    };

    // Evita el "ghost drag" de la imagen del poster al arrastrar.
    const onDragStart = (event: DragEvent) => {
      if (dragging) event.preventDefault();
    };

    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('click', onClickCapture, { capture: true });
    el.addEventListener('dragstart', onDragStart);

    return () => {
      endDrag();
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('click', onClickCapture, { capture: true });
      el.removeEventListener('dragstart', onDragStart);
    };
  }, [enableDrag]);

  return { trackRef, canScrollPrev, canScrollNext, scrollPrev, scrollNext };
}
