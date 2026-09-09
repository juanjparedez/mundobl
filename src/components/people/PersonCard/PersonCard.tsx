import Link from 'next/link';
import Image from 'next/image';
import { UserOutlined, VideoCameraOutlined } from '@ant-design/icons';
import { Chip } from '@/components/design-system';
import { isDirectServedImageUrl } from '@/lib/image-helpers';
import './PersonCard.css';

export interface PersonCardProps {
  href: string;
  name: string;
  /** Nombre artistico o pais — la linea chica debajo del nombre. */
  subtitle?: string | null;
  imageUrl?: string | null;
  /** Texto ya interpolado y traducido, ej. "6 titulos". */
  creditsLabel: string;
  /** Marca de ficha sin datos propios. Texto ya traducido. */
  incompleteLabel?: string;
  /** Forma del avatar: los estudios tienen logo rectangular. */
  shape?: 'circle' | 'square';
}

/**
 * Tarjeta de persona/productora para los indices publicos.
 *
 * No usa `MediaCard` a proposito: esa card es un poster 2:3 pensado para
 * series con portada. Hoy el 100% de actores, directores y productoras NO
 * tiene imagen, asi que una grilla de posters vacios seria una pared de
 * placeholders. Esta card se apoya en el avatar y en el dato que SI tenemos
 * (la cantidad de creditos), y sigue quedando bien cuando las fotos lleguen.
 */
export function PersonCard({
  href,
  name,
  subtitle,
  imageUrl,
  creditsLabel,
  incompleteLabel,
  shape = 'circle',
}: PersonCardProps) {
  return (
    <Link href={href} prefetch={false} className="person-card">
      <span
        className={`person-card__avatar person-card__avatar--${shape}`}
        aria-hidden="true"
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt=""
            fill
            sizes="(max-width: 480px) 30vw, 120px"
            unoptimized={isDirectServedImageUrl(imageUrl)}
            style={{ objectFit: 'cover' }}
          />
        ) : shape === 'circle' ? (
          <UserOutlined />
        ) : (
          <VideoCameraOutlined />
        )}
      </span>

      <span className="person-card__body">
        <span className="person-card__name">{name}</span>
        {subtitle && <span className="person-card__subtitle">{subtitle}</span>}
        <span className="person-card__meta">
          <Chip size="sm" tone="neutral">
            {creditsLabel}
          </Chip>
          {incompleteLabel && (
            <Chip size="sm" tone="warning" outline>
              {incompleteLabel}
            </Chip>
          )}
        </span>
      </span>
    </Link>
  );
}
