'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface FloatButtonPortalProps {
  children: React.ReactNode;
}

/** Portala su contenido a `document.body`.
 *
 *  Necesario para FABs (`position: fixed`): el contenedor `.app-content`
 *  de AppLayout usa `backdrop-filter: blur()`, lo que crea un *containing
 *  block* para descendientes `fixed`. Sin portal, un FloatButton queda
 *  posicionado relativo a `.app-content` (pegado al fondo del panel y
 *  scrolleando con el contenido) en vez de flotar sobre el viewport.
 *  Montando en body escapa ese containing block. */
export function FloatButtonPortal({ children }: FloatButtonPortalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount guard SSR
    setMounted(true);
  }, []);

  if (!mounted) return null;
  return createPortal(children, document.body);
}
