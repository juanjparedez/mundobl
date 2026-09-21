'use client';

import { PictureOutlined } from '@ant-design/icons';
import { useLocale } from '@/lib/providers/LocaleProvider';
import './PosterPlaceholder.css';

export interface PosterPlaceholderProps {
  /** Título de la serie: es lo único que identifica la ficha sin imagen. */
  title: string;
  /** Etiqueta del tipo ya traducida (Serie / Corto / Película…). */
  typeLabel?: string;
  /** `card` sigue --poster-aspect-ratio (cards apaisadas); `poster` es 2:3. */
  variant?: 'poster' | 'card';
  className?: string;
}

/**
 * Reemplazo visual del póster cuando la ficha no tiene imagen cargada.
 * Mantiene el mismo tamaño que el póster real para que el layout del header
 * y de las cards sea idéntico con o sin imagen.
 */
export function PosterPlaceholder({
  title,
  typeLabel,
  variant = 'poster',
  className,
}: PosterPlaceholderProps) {
  const { t } = useLocale();
  const classes = [
    'poster-placeholder',
    `poster-placeholder--${variant}`,
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={classes}
      role="img"
      aria-label={`${title} · ${t('posterPlaceholder.noImage')}`}
    >
      <PictureOutlined className="poster-placeholder__icon" aria-hidden />
      <span className="poster-placeholder__title">{title}</span>
      {typeLabel && (
        <span className="poster-placeholder__type">{typeLabel}</span>
      )}
    </div>
  );
}
