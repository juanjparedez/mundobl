'use client';

import type { CSSProperties, KeyboardEvent, ReactNode } from 'react';
import Image from 'next/image';
import './MediaCard.css';

export interface MediaCardProps {
  /** URL de la imagen de portada. Si es null, se renderiza un placeholder. */
  imageUrl?: string | null;
  /** Texto alt para la imagen (provisto traducido cuando aplica). */
  imageAlt: string;
  /** Si la imagen viene de Supabase Storage o equivalente, evita Next/Image
   *  optimizado (que requiere remotePatterns configurados). */
  unoptimizedImage?: boolean;
  /** Titulo principal — lo provee la pagina ya traducido cuando corresponda. */
  title: ReactNode;
  /** Linea de meta debajo del titulo (year · country, etc). */
  subtitle?: ReactNode;
  /** Texto mas largo debajo del subtitulo (ej. sinopsis corta). */
  description?: ReactNode;
  /** Tags/chips a mostrar como overlay sobre la imagen (rating, etc). */
  overlayTags?: ReactNode;
  /**
   * Acciones en hover (favoritos, quick view, borrar). Se renderizan FUERA
   * del link/boton principal (no anidadas) para no violar HTML de contenido
   * interactivo anidado — funcionan aunque la card entera sea clickeable.
   */
  actions?: ReactNode;
  /** Slot opcional debajo del body (ej. boton de CTA a lo ancho). Mismo
   *  motivo que `actions`: vive fuera del link/boton principal. */
  footer?: ReactNode;
  /** href si la card debe ser un link. */
  href?: string;
  /** onClick alternativo. */
  onClick?: () => void;
  /** Aspect ratio del cover. Default 2:3 (poster). */
  aspectRatio?: '2:3' | '16:9' | '1:1';
  className?: string;
  style?: CSSProperties;
}

const ASPECT_RATIOS: Record<
  NonNullable<MediaCardProps['aspectRatio']>,
  string
> = {
  '2:3': '2/3',
  '16:9': '16/9',
  '1:1': '1/1',
};

export function MediaCard({
  imageUrl,
  imageAlt,
  unoptimizedImage,
  title,
  subtitle,
  description,
  overlayTags,
  actions,
  footer,
  href,
  onClick,
  aspectRatio = '2:3',
  className,
  style,
}: MediaCardProps) {
  const classes = [
    'mb-media-card',
    href || onClick ? 'mb-media-card--interactive' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');
  const innerStyle: CSSProperties = {
    ...style,
    ['--mb-media-aspect' as string]: ASPECT_RATIOS[aspectRatio],
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!onClick) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick();
    }
  };

  const coverAndBody = (
    <>
      <div className="mb-media-card__cover">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={imageAlt}
            fill
            sizes="(max-width: 480px) 50vw, (max-width: 1200px) 31vw, 24vw"
            unoptimized={unoptimizedImage}
            style={{ objectFit: 'cover' }}
          />
        ) : (
          <div className="mb-media-card__cover-placeholder" />
        )}
      </div>
      <div className="mb-media-card__body">
        <span className="mb-media-card__title">{title}</span>
        {subtitle && (
          <span className="mb-media-card__subtitle">{subtitle}</span>
        )}
        {description && (
          <p className="mb-media-card__description">{description}</p>
        )}
      </div>
    </>
  );

  return (
    <div className={classes} style={innerStyle}>
      {href ? (
        <a href={href} className="mb-media-card__link">
          {coverAndBody}
        </a>
      ) : onClick ? (
        <div
          className="mb-media-card__link"
          role="button"
          tabIndex={0}
          onClick={onClick}
          onKeyDown={handleKeyDown}
        >
          {coverAndBody}
        </div>
      ) : (
        <div className="mb-media-card__link">{coverAndBody}</div>
      )}
      {overlayTags && (
        <div className="mb-media-card__overlay-tags">{overlayTags}</div>
      )}
      {actions && <div className="mb-media-card__actions">{actions}</div>}
      {footer && <div className="mb-media-card__footer">{footer}</div>}
    </div>
  );
}
