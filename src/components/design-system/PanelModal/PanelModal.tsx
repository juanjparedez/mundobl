'use client';

import { Modal } from 'antd';
import type { ButtonProps } from 'antd';
import type { Breakpoint } from 'antd/es/_util/responsiveObserver';
import type { ReactNode } from 'react';
import './PanelModal.css';

export type PanelModalSize = 'sm' | 'md' | 'lg' | 'xl';

/**
 * Ancho por tamaño semantico. Es la UNICA excepcion a "estilos en .css"
 * del proyecto, y es deliberada: antd escribe `width` como style inline
 * en `.ant-modal`, asi que pisarlo desde CSS obligaria a `!important` en
 * cada tamaño. antd v6 acepta un mapa responsive nativo, que ademas nos
 * da el degradado a ancho completo en mobile sin media queries.
 * Todo lo demas (alto, scroll, padding, radios, footer) vive en el .css.
 */
const SIZE_WIDTH: Record<
  PanelModalSize,
  Partial<Record<Breakpoint, string | number>>
> = {
  sm: { xs: '100%', sm: 420 },
  md: { xs: '100%', sm: '92vw', md: 640 },
  lg: { xs: '100%', sm: '94vw', md: 760, lg: 880 },
  xl: { xs: '100%', sm: '96vw', md: 920, lg: 1120 },
};

export interface PanelModalProps {
  open: boolean;
  /** Cierra sin confirmar (X, Cancelar, Escape). */
  onClose: () => void;
  /** Titulo visible — ya traducido por la pagina. */
  title: ReactNode;
  children: ReactNode;
  /** Tamaño semantico en vez de un numero magico. Default 'md'. */
  size?: PanelModalSize;
  /** `null` = sin footer. `undefined` = footer Ok/Cancel estandar. */
  footer?: ReactNode | null;
  onOk?: () => void;
  okText?: ReactNode;
  cancelText?: ReactNode;
  confirmLoading?: boolean;
  okButtonProps?: ButtonProps;
  cancelButtonProps?: ButtonProps;
  /**
   * Cerrar al clickear la mascara. Default false.
   *
   * El default es false a proposito: es el contrato que ya usaban todos
   * los modales de edicion del admin, por un reporte real de Flor, que
   * perdia todo lo cargado al clickear afuera sin querer. Escape sigue
   * cerrando siempre (default de antd), que es la salida rapida esperada.
   */
  maskClosable?: boolean;
  /**
   * Desmonta el contenido al cerrar. Default false, igual que antd.
   *
   * No lo cambiamos a true: varios modales del admin combinan
   * `forceRender` con un Form de antd que se rellena en un efecto al
   * abrir. Desmontar al cerrar haria que en la segunda apertura el form
   * se remonte y pierda la conexion de la instancia. Quien quiera el
   * reseteo, lo pide explicito.
   */
  destroyOnHidden?: boolean;
  /** Monta el contenido antes de la primera apertura (formularios antd
   *  que necesitan la instancia conectada desde el arranque). */
  forceRender?: boolean;
  /** Desactiva el scroll interno del body, para contenido ya acotado
   *  que trae su propio scroller (evita scrollers anidados). */
  noScroll?: boolean;
  className?: string;
}

/**
 * Modal del design system: tamaño semantico + el contenido scrollea
 * ADENTRO del modal.
 *
 * Existe porque cada modal del admin era un `Modal` de antd copiado a
 * mano, con un ancho distinto sin criterio (520/640/680/700/720/800) y
 * sin ningun tope de altura. Sin tope, un formulario largo hace crecer
 * el modal mas que la pantalla y el que scrollea es la PAGINA: el titulo
 * y los botones Guardar/Cancelar quedan fuera de vista.
 *
 * Aca el header y el footer quedan fijos y el unico scroller es el body.
 * En mobile el modal pasa a hoja de pantalla completa (ver .css).
 */
export function PanelModal({
  open,
  onClose,
  title,
  children,
  size = 'md',
  footer,
  onOk,
  okText,
  cancelText,
  confirmLoading,
  okButtonProps,
  cancelButtonProps,
  maskClosable = false,
  destroyOnHidden = false,
  forceRender,
  noScroll = false,
  className,
}: PanelModalProps) {
  const rootClassName = [
    'mb-panel-modal',
    `mb-panel-modal--${size}`,
    noScroll ? 'mb-panel-modal--no-scroll' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Modal
      open={open}
      onCancel={onClose}
      onOk={onOk}
      title={title}
      width={SIZE_WIDTH[size]}
      centered
      rootClassName={rootClassName}
      footer={footer}
      okText={okText}
      cancelText={cancelText}
      confirmLoading={confirmLoading}
      okButtonProps={okButtonProps}
      cancelButtonProps={cancelButtonProps}
      // `mask.closable` y `destroyOnHidden` son la API de antd v6;
      // `maskClosable`/`destroyOnClose` estan deprecados. Traducirlos aca
      // es lo que permite migrar los modales del admin sin arrastrar la
      // deprecacion archivo por archivo.
      mask={{ closable: maskClosable }}
      destroyOnHidden={destroyOnHidden}
      forceRender={forceRender}
    >
      {children}
    </Modal>
  );
}
