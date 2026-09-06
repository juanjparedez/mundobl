import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react';

/** Chip clickeable del preview. Sin `href` ni `onSelect` queda como
 *  etiqueta de solo lectura (mismo look, sin affordance de click). */
export interface QuickPreviewChip {
  key: string;
  label: string;
  icon?: ReactNode;
  /** Color de antd Tag (`gold`, `purple`, ...). */
  color?: string;
  /** Navega a otra pagina. */
  href?: string;
  /** Accion en la pagina actual (ej. aplicar un filtro del catalogo).
   *  Cuando existe, el preview se cierra solo despues de ejecutarla. */
  onSelect?: () => void;
}

/** Dato puntual (Temporadas: 2). Se rendea en una grilla de dos columnas. */
export interface QuickPreviewFact {
  key: string;
  label: string;
  value: ReactNode;
}

export interface QuickPreviewAction {
  key: string;
  label: string;
  icon?: ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: 'primary' | 'default';
  /** Estado on/off (ej. favorito ya marcado). */
  active?: boolean;
  /** Solo icono en el hover-preview (donde no entra el texto). */
  iconOnlyOnHoverCard?: boolean;
}

export interface QuickPreviewChipGroup {
  key: string;
  label: string;
  chips: QuickPreviewChip[];
}

/** Forma normalizada que consumen el modal y el hover-preview. Cada
 *  superficie (catalogo, /ver, novedades...) traduce su propio shape a
 *  esta, asi el preview no conoce ni Prisma ni i18n. */
export interface QuickPreviewData {
  id: string;
  title: string;
  imageUrl?: string | null;
  imagePosition?: string | null;
  /** Relacion de aspecto de la portada. Default 16:9 (la del sitio). */
  coverAspect?: '2:3' | '16:9';
  /** Badges cortos sobre la portada / arriba del titulo. */
  badges?: QuickPreviewChip[];
  /** Linea de meta bajo el titulo, ya armada y traducida por el caller. */
  meta?: ReactNode;
  synopsis?: string | null;
  facts?: QuickPreviewFact[];
  chipGroups?: QuickPreviewChipGroup[];
  actions?: QuickPreviewAction[];
}

/** Textos del chrome del preview. Van por props porque los componentes del
 *  design-system no hablan i18n (regla del proyecto). */
export interface QuickPreviewLabels {
  close: string;
  synopsis: string;
  noSynopsis: string;
  moreInfo: string;
}

/** El caller pasa una funcion y no el objeto ya armado: construir los
 *  chips/acciones de cada card en cada render seria trabajo tirado para
 *  las 48 cards de una pagina del catalogo. Solo se arma la del item que
 *  el usuario efectivamente hoverea o abre. */
export type PreviewFactory = () => QuickPreviewData;

export interface QuickPreviewApi {
  /** Abre el modal de vista rapida. */
  openPreview: (getData: PreviewFactory) => void;
  /** Props para la card: dispara el hover-preview en desktop. En touch
   *  devuelve un objeto vacio (no hay hover que valga). */
  previewTriggerProps: (getData: PreviewFactory) => {
    onPointerEnter?: (event: ReactPointerEvent<HTMLElement>) => void;
    onPointerLeave?: () => void;
  };
  /** true si el dispositivo tiene hover real (desktop con mouse). */
  hoverCapable: boolean;
}

/** Lo que una card necesita para ofrecer vista rapida: la API del
 *  controller, como armar su data, y el texto del boton (ya traducido —
 *  los componentes del design-system no hablan i18n). */
export interface CardPreviewBinding {
  api: QuickPreviewApi;
  getData: PreviewFactory;
  openLabel: string;
}

/** Igual que `CardPreviewBinding` pero para una lista: el builder recibe
 *  el item, asi el contenedor no arma una closure por card de antemano. */
export interface ListPreviewBinding<T> {
  api: QuickPreviewApi;
  build: (item: T) => QuickPreviewData;
  openLabel: string;
}
