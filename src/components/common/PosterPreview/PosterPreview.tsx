'use client';
import {
  cloneElement,
  useRef,
  useState,
  type ImgHTMLAttributes,
  type ReactElement,
  type ReactNode,
} from 'react';
import { Alert, Button, Image } from 'antd';
import './PosterPreview.css';
interface PosterPreviewProps {
  src: string;
  alt: string;
  openLabel: string;
  errorLabel: string;
  controls: { zoomIn: string; zoomOut: string; close: string };
  children: ReactNode;
}
export function PosterPreview({
  src,
  alt,
  openLabel,
  errorLabel,
  controls,
  children,
}: PosterPreviewProps) {
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  return (
    <>
      <button
        ref={trigger}
        type="button"
        className="poster-preview__trigger"
        aria-label={openLabel}
        onClick={() => {
          setFailed(false);
          setOpen(true);
        }}
      >
        {children}
      </button>
      {open && (
        <Image
          src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="
          alt=""
          classNames={{ root: 'poster-preview__source' }}
          preview={{
            src,
            alt,
            open,
            movable: true,
            closeIcon: (
              <span aria-label={controls.close}>{controls.close}</span>
            ),
            actionsRender: (_, { actions, transform }) => (
              <div className="poster-preview__controls">
                <Button
                  disabled={failed || transform.scale <= 1}
                  onClick={actions.onZoomOut}
                >
                  {controls.zoomOut}
                </Button>
                <Button
                  disabled={failed || transform.scale >= 50}
                  onClick={actions.onZoomIn}
                >
                  {controls.zoomIn}
                </Button>
                <Button onClick={actions.onClose}>{controls.close}</Button>
              </div>
            ),
            onOpenChange: (next) => {
              setOpen(next);
              if (!next) requestAnimationFrame(() => trigger.current?.focus());
            },
            imageRender: (node) =>
              failed ? (
                <Alert type="error" title={errorLabel} />
              ) : (
                cloneElement(
                  node as ReactElement<ImgHTMLAttributes<HTMLImageElement>>,
                  { onError: () => setFailed(true) }
                )
              ),
          }}
        />
      )}
    </>
  );
}
