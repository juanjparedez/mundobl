'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import {
  useQuickPreviewController,
  type QuickPreviewOptions,
} from './useQuickPreviewController';
import type { QuickPreviewApi } from './quickPreviewTypes';

const QuickPreviewContext = createContext<QuickPreviewApi | null>(null);

interface QuickPreviewProviderProps extends QuickPreviewOptions {
  children: ReactNode;
}

/** Provee la vista rapida (modal + hover-preview) a las cards que cuelguen
 *  debajo. Una sola instancia por pagina: hay un unico preview abierto a
 *  la vez y el portal vive fuera de cualquier contenedor con overflow.
 *
 *  Cuando las cards se rendean en el MISMO componente que monta el
 *  preview (caso catalogo), usar `useQuickPreviewController` directo — un
 *  componente no puede consumir el contexto que el mismo provee. */
export function QuickPreviewProvider({
  labels,
  hoverEnabled,
  children,
}: QuickPreviewProviderProps) {
  const { openPreview, previewTriggerProps, hoverCapable, overlays } =
    useQuickPreviewController({ labels, hoverEnabled });

  const value = useMemo<QuickPreviewApi>(
    () => ({ openPreview, previewTriggerProps, hoverCapable }),
    [openPreview, previewTriggerProps, hoverCapable]
  );

  return (
    <QuickPreviewContext.Provider value={value}>
      {children}
      {overlays}
    </QuickPreviewContext.Provider>
  );
}

/** Para cards que viven bajo un `QuickPreviewProvider`. Fuera de el
 *  devuelve no-ops: asi una card se puede reusar en una pagina que
 *  todavia no adopto el preview sin romperse ni obligar a envolverla. */
export function useQuickPreview(): QuickPreviewApi {
  const context = useContext(QuickPreviewContext);
  return (
    context ?? {
      openPreview: () => {},
      previewTriggerProps: () => ({}),
      hoverCapable: false,
    }
  );
}
