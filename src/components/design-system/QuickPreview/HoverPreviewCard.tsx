'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Button, Tag, Tooltip } from 'antd';
import type {
  QuickPreviewAction,
  QuickPreviewData,
  QuickPreviewLabels,
} from './quickPreviewTypes';
import './HoverPreviewCard.css';

interface HoverPreviewCardProps {
  data: QuickPreviewData;
  /** Rect de la card que disparo el hover, en coordenadas de viewport. */
  anchor: DOMRect;
  labels: QuickPreviewLabels;
  onMoreInfo: () => void;
  onPointerEnter: () => void;
  onPointerLeave: () => void;
}

const MIN_WIDTH = 260;
const MAX_WIDTH = 380;
const VIEWPORT_MARGIN = 12;

function HoverAction({ action }: { action: QuickPreviewAction }) {
  const iconOnly = action.iconOnlyOnHoverCard && !!action.icon;
  const button = (
    <Button
      size="small"
      shape={iconOnly ? 'circle' : 'default'}
      type={action.variant === 'primary' ? 'primary' : 'default'}
      icon={action.icon}
      aria-label={iconOnly ? action.label : undefined}
      aria-pressed={action.active === undefined ? undefined : action.active}
      className={`mb-hp__action${action.active ? ' mb-hp__action--active' : ''}`}
      onClick={action.href ? undefined : action.onClick}
    >
      {iconOnly ? null : action.label}
    </Button>
  );

  const wrapped = action.href ? (
    <Link href={action.href} prefetch={false}>
      {button}
    </Link>
  ) : (
    button
  );

  return iconOnly ? <Tooltip title={action.label}>{wrapped}</Tooltip> : wrapped;
}

/** Tarjeta expandida que aparece al dejar el mouse sobre una card, al
 *  estilo de las grillas de streaming: muestra sinopsis corta, datos y
 *  acciones sin que el usuario tenga que entrar al detalle.
 *
 *  Se rendea en un portal con `position: fixed` a proposito: las cards
 *  viven dentro de carruseles con `overflow: hidden`, asi que cualquier
 *  expansion in-place quedaria recortada por la fila. */
export function HoverPreviewCard({
  data,
  anchor,
  labels,
  onMoreInfo,
  onPointerEnter,
  onPointerLeave,
}: HoverPreviewCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [placement, setPlacement] = useState<{
    top: number;
    left: number;
  } | null>(null);

  // El ancho sale del anchor, sin medir: si se midiera la altura con un
  // ancho provisional y despues se ensanchara la card, el alto real seria
  // otro y la posicion vertical quedaria corrida.
  const width = Math.min(
    MAX_WIDTH,
    Math.max(MIN_WIDTH, Math.round(anchor.width * 1.35))
  );

  useLayoutEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    const height = el.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Centrada sobre la card y desbordando parejo hacia arriba y abajo,
    // luego encajada dentro del viewport para que nunca quede cortada.
    const rawLeft = anchor.left + anchor.width / 2 - width / 2;
    const rawTop = anchor.top - (height - anchor.height) / 2;

    setPlacement({
      left: Math.min(
        Math.max(VIEWPORT_MARGIN, rawLeft),
        vw - width - VIEWPORT_MARGIN
      ),
      top: Math.min(
        Math.max(VIEWPORT_MARGIN, rawTop),
        Math.max(VIEWPORT_MARGIN, vh - height - VIEWPORT_MARGIN)
      ),
    });
  }, [anchor, width]);

  const coverAspect = data.coverAspect ?? '16:9';

  return (
    <div
      ref={cardRef}
      className={`mb-hp${placement ? ' mb-hp--placed' : ''}`}
      style={{
        // Antes de medir se rendea fuera de vista (no `display: none`, que
        // daria offsetHeight 0) para no mostrar un salto de posicion.
        top: placement?.top ?? -9999,
        left: placement?.left ?? -9999,
        width,
      }}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      role="dialog"
      aria-label={data.title}
    >
      <div
        className={`mb-hp__cover mb-hp__cover--${coverAspect === '2:3' ? 'poster' : 'wide'}`}
      >
        {data.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={data.imageUrl}
            alt=""
            style={{ objectPosition: data.imagePosition ?? 'center' }}
          />
        ) : (
          <div className="mb-hp__cover-placeholder" aria-hidden="true" />
        )}
        {data.badges && data.badges.length > 0 && (
          <div className="mb-hp__cover-badges">
            {data.badges.slice(0, 3).map((badge) => (
              <Tag key={badge.key} color={badge.color} bordered={false}>
                {badge.icon}
                {badge.label}
              </Tag>
            ))}
          </div>
        )}
      </div>

      <div className="mb-hp__body">
        <h3 className="mb-hp__title">{data.title}</h3>
        {data.meta && <div className="mb-hp__meta">{data.meta}</div>}

        <div className="mb-hp__actions">
          {data.actions?.map((action) => (
            <HoverAction key={action.key} action={action} />
          ))}
          <Button
            size="small"
            type="text"
            className="mb-hp__more"
            onClick={onMoreInfo}
          >
            {labels.moreInfo}
          </Button>
        </div>

        {data.synopsis?.trim() && (
          <p className="mb-hp__synopsis">{data.synopsis}</p>
        )}

        {data.chipGroups?.[0]?.chips.length ? (
          <div className="mb-hp__chips">
            {data.chipGroups[0].chips.slice(0, 4).map((chip) => (
              <span key={chip.key} className="mb-hp__chip">
                {chip.label}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
