'use client';

import Link from 'next/link';
import { Button, Modal, Tag } from 'antd';
import type {
  QuickPreviewAction,
  QuickPreviewChip,
  QuickPreviewData,
  QuickPreviewLabels,
} from './quickPreviewTypes';
import './QuickPreviewModal.css';

interface QuickPreviewModalProps {
  data: QuickPreviewData | null;
  open: boolean;
  onClose: () => void;
  labels: QuickPreviewLabels;
}

/** Chip del preview. Se rendea como link, boton o etiqueta segun lo que
 *  el caller haya provisto — nunca como boton muerto. */
function PreviewChip({
  chip,
  onAfterSelect,
}: {
  chip: QuickPreviewChip;
  onAfterSelect: () => void;
}) {
  const content = (
    <>
      {chip.icon}
      {chip.label}
    </>
  );

  if (chip.href) {
    return (
      <Link
        href={chip.href}
        prefetch={false}
        className="mb-qp__chip mb-qp__chip--link"
        onClick={onAfterSelect}
      >
        {content}
      </Link>
    );
  }

  if (chip.onSelect) {
    return (
      <button
        type="button"
        className="mb-qp__chip mb-qp__chip--link"
        onClick={() => {
          chip.onSelect?.();
          onAfterSelect();
        }}
      >
        {content}
      </button>
    );
  }

  return <span className="mb-qp__chip">{content}</span>;
}

function PreviewAction({
  action,
  onAfterClick,
}: {
  action: QuickPreviewAction;
  onAfterClick: () => void;
}) {
  const button = (
    <Button
      type={action.variant === 'primary' ? 'primary' : 'default'}
      icon={action.icon}
      className={`mb-qp__action${action.active ? ' mb-qp__action--active' : ''}`}
      onClick={
        action.href
          ? onAfterClick
          : () => {
              action.onClick?.();
            }
      }
      aria-pressed={action.active === undefined ? undefined : action.active}
    >
      {action.label}
    </Button>
  );

  return action.href ? (
    <Link href={action.href} prefetch={false}>
      {button}
    </Link>
  ) : (
    button
  );
}

/** Vista rapida de una serie: portada, sinopsis completa, datos y chips
 *  clickeables (genero, tag, actor, plataforma...) sin salir de la pagina.
 *  Reemplaza al viejo boton de "ojo" del catalogo, que navegaba al detalle
 *  igual que un click en la card — es decir, no era un quick view. */
export function QuickPreviewModal({
  data,
  open,
  onClose,
  labels,
}: QuickPreviewModalProps) {
  if (!data) return null;

  const coverAspect = data.coverAspect ?? '16:9';

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      width={760}
      destroyOnHidden
      className="mb-qp"
      title={null}
      aria-label={data.title}
      closable={{ 'aria-label': labels.close }}
    >
      <div className="mb-qp__layout">
        <div
          className={`mb-qp__cover mb-qp__cover--${coverAspect === '2:3' ? 'poster' : 'wide'}`}
        >
          {data.imageUrl ? (
            // <img> plano a proposito: las portadas pueden venir de
            // cualquier CDN externo no whitelisteado en remotePatterns, y
            // next/image falla en silencio con esas.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.imageUrl}
              alt=""
              loading="lazy"
              style={{ objectPosition: data.imagePosition ?? 'center' }}
            />
          ) : (
            <div className="mb-qp__cover-placeholder" aria-hidden="true" />
          )}
        </div>

        <div className="mb-qp__body">
          <h2 className="mb-qp__title">{data.title}</h2>

          {data.badges && data.badges.length > 0 && (
            <div className="mb-qp__badges">
              {data.badges.map((badge) =>
                badge.color ? (
                  <Tag key={badge.key} color={badge.color}>
                    {badge.icon}
                    {badge.label}
                  </Tag>
                ) : (
                  <PreviewChip
                    key={badge.key}
                    chip={badge}
                    onAfterSelect={onClose}
                  />
                )
              )}
            </div>
          )}

          {data.meta && <div className="mb-qp__meta">{data.meta}</div>}

          {data.actions && data.actions.length > 0 && (
            <div className="mb-qp__actions">
              {data.actions.map((action) => (
                <PreviewAction
                  key={action.key}
                  action={action}
                  onAfterClick={onClose}
                />
              ))}
            </div>
          )}

          <div className="mb-qp__synopsis">
            <h3 className="mb-qp__section-label">{labels.synopsis}</h3>
            <p className="mb-qp__synopsis-text">
              {data.synopsis?.trim() ? data.synopsis : labels.noSynopsis}
            </p>
          </div>

          {data.facts && data.facts.length > 0 && (
            <dl className="mb-qp__facts">
              {data.facts.map((fact) => (
                <div key={fact.key} className="mb-qp__fact">
                  <dt>{fact.label}</dt>
                  <dd>{fact.value}</dd>
                </div>
              ))}
            </dl>
          )}

          {data.chipGroups
            ?.filter((group) => group.chips.length > 0)
            .map((group) => (
              <div key={group.key} className="mb-qp__chip-group">
                <h3 className="mb-qp__section-label">{group.label}</h3>
                <div className="mb-qp__chips">
                  {group.chips.map((chip) => (
                    <PreviewChip
                      key={chip.key}
                      chip={chip}
                      onAfterSelect={onClose}
                    />
                  ))}
                </div>
              </div>
            ))}
        </div>
      </div>
    </Modal>
  );
}
