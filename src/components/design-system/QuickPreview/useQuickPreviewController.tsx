'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { trackEvent } from '@/lib/analytics';
import { HoverPreviewCard } from './HoverPreviewCard';
import { QuickPreviewModal } from './QuickPreviewModal';
import type {
  PreviewFactory,
  QuickPreviewApi,
  QuickPreviewLabels,
} from './quickPreviewTypes';

export interface QuickPreviewController extends QuickPreviewApi {
  /** Modal + hover-card. El caller lo rendea una vez, al final de su JSX. */
  overlays: ReactNode;
}

/** Delay antes de abrir el hover-preview. Largo la primera vez (pasar el
 *  mouse por encima camino a otro lado no debe abrir nada) y corto cuando
 *  ya hay uno abierto y el usuario esta recorriendo la fila. */
const OPEN_DELAY_COLD = 520;
const OPEN_DELAY_WARM = 180;
const CLOSE_DELAY = 160;

export interface QuickPreviewOptions {
  labels: QuickPreviewLabels;
  /** Permite apagar el hover-preview (ej. vista lista) sin perder el modal. */
  hoverEnabled?: boolean;
  /** Que pagina monta el preview ('catalogo', 'ver', ...). Solo se usa
   *  para medir si la vista rapida se usa y donde. */
  surface?: string;
}

/** Motor de la vista rapida. Se usa directo cuando las cards se rendean en
 *  el mismo componente (catalogo), o a traves de `QuickPreviewProvider`
 *  cuando viven en componentes hijos (/ver). */
export function useQuickPreviewController({
  labels,
  hoverEnabled = true,
  surface,
}: QuickPreviewOptions): QuickPreviewController {
  // Desktop con mouse. En SSR y en touch da false, asi que el
  // hover-preview simplemente no existe ahi (el modal si).
  const hoverCapable = useMediaQuery('(hover: hover) and (pointer: fine)');
  // Se guarda la FACTORY, no el objeto ya armado, y se la invoca en cada
  // render: asi el preview abierto refleja los cambios de estado del
  // caller (marcar favorito adentro del modal tiene que dar vuelta la
  // estrella). Un snapshot quedaria congelado en el momento del hover.
  const [modalFactory, setModalFactory] = useState<PreviewFactory | null>(null);
  const [hover, setHover] = useState<{
    getData: PreviewFactory;
    anchor: DOMRect;
  } | null>(null);

  const modalData = modalFactory ? modalFactory() : null;
  const hoverData = hover ? hover.getData() : null;

  const openTimer = useRef<number | null>(null);
  const closeTimer = useRef<number | null>(null);
  const hoverOpenRef = useRef(false);

  const clearTimers = useCallback(() => {
    if (openTimer.current !== null) window.clearTimeout(openTimer.current);
    if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
    openTimer.current = null;
    closeTimer.current = null;
  }, []);

  const closeHover = useCallback(() => {
    clearTimers();
    hoverOpenRef.current = false;
    setHover(null);
  }, [clearTimers]);

  useEffect(() => clearTimers, [clearTimers]);

  // El hover-preview esta anclado con `position: fixed` a un rect medido
  // una sola vez: si la pagina scrollea o cambia de tamaño ese rect deja
  // de ser valido, asi que se cierra en vez de quedar flotando desalineado.
  useEffect(() => {
    if (!hover) return;

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeHover();
    };

    window.addEventListener('scroll', closeHover, {
      passive: true,
      capture: true,
    });
    window.addEventListener('resize', closeHover);
    window.addEventListener('keydown', onEscape);

    return () => {
      window.removeEventListener('scroll', closeHover, { capture: true });
      window.removeEventListener('resize', closeHover);
      window.removeEventListener('keydown', onEscape);
    };
  }, [hover, closeHover]);

  const openPreview = useCallback(
    (getData: PreviewFactory) => {
      closeHover();
      // setState confunde una funcion con un updater — de ahi el wrapper.
      setModalFactory(() => getData);

      // Se mide la apertura del modal (accion deliberada), NO el
      // hover-preview: el hover dispararia un evento por cada card que el
      // mouse roza y comeria la cuota gratuita sin decir nada nuevo.
      if (surface) trackEvent('quick_preview_open', { surface });
    },
    [closeHover, surface]
  );

  const previewTriggerProps = useCallback(
    (getData: PreviewFactory) => {
      if (!hoverCapable || !hoverEnabled) return {};

      return {
        onPointerEnter: (event: ReactPointerEvent<HTMLElement>) => {
          // Nada de previews con el boton apretado: ese gesto es un drag
          // del carrusel, no una intencion de ver mas informacion.
          if (event.pointerType !== 'mouse' || event.buttons !== 0) return;

          const target = event.currentTarget;
          clearTimers();
          openTimer.current = window.setTimeout(
            () => {
              hoverOpenRef.current = true;
              setHover({
                getData,
                anchor: target.getBoundingClientRect(),
              });
            },
            hoverOpenRef.current ? OPEN_DELAY_WARM : OPEN_DELAY_COLD
          );
        },
        onPointerLeave: () => {
          if (openTimer.current !== null) {
            window.clearTimeout(openTimer.current);
            openTimer.current = null;
          }
          // Margen para que el mouse cruce el hueco entre la card y el
          // preview sin que este se cierre en el camino.
          closeTimer.current = window.setTimeout(closeHover, CLOSE_DELAY);
        },
      };
    },
    [hoverCapable, hoverEnabled, clearTimers, closeHover]
  );

  const overlays = (
    <>
      {hover &&
        hoverData &&
        createPortal(
          <HoverPreviewCard
            key={hoverData.id}
            data={hoverData}
            anchor={hover.anchor}
            labels={labels}
            onMoreInfo={() => {
              const { getData } = hover;
              closeHover();
              setModalFactory(() => getData);
            }}
            onPointerEnter={() => {
              if (closeTimer.current !== null) {
                window.clearTimeout(closeTimer.current);
                closeTimer.current = null;
              }
            }}
            onPointerLeave={closeHover}
          />,
          document.body
        )}
      <QuickPreviewModal
        data={modalData}
        open={modalData !== null}
        onClose={() => setModalFactory(null)}
        labels={labels}
      />
    </>
  );

  // Sin useMemo: `overlays` es JSX nuevo en cada render por diseño (refleja
  // el estado interno), asi que memoizar el objeto no evitaria un solo
  // re-render. Lo que si conviene memoizar es el valor de contexto, y eso
  // lo hace QuickPreviewProvider con las tres funciones estables.
  return { openPreview, previewTriggerProps, hoverCapable, overlays };
}
