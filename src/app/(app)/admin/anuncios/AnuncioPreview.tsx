'use client';

import { AnnouncementContent } from '@/components/common/AnnouncementDisplay/AnnouncementContent';
import { BannerSurface } from '@/components/common/AnnouncementDisplay/surfaces/BannerSurface';
import type { ActiveAnnouncement } from '@/hooks/useActiveAnnouncements';
import './anuncio-preview.css';

interface AnuncioPreviewProps {
  surface: ActiveAnnouncement['surface'];
  tone: ActiveAnnouncement['tone'];
  template: ActiveAnnouncement['template'];
  title: string;
  body: string;
  linkUrl?: string | null;
  linkLabel?: string | null;
  dismissible: boolean;
  frameLabel: string;
}

const noop = () => undefined;

/**
 * Vista previa en vivo del form de /admin/anuncios. Usa los componentes
 * reales (AnnouncementContent, BannerSurface) para que lo que Flor ve aca
 * sea exactamente lo que se renderiza en produccion — nada de una
 * aproximacion aparte que se pueda desincronizar. Para MODAL/TOAST se
 * envuelve en un frame estatico (no un antd Modal real ni fixed
 * positioning) porque montar esas superficies "de verdad" dentro del drawer
 * de edicion se superpondria con la UI del propio form.
 */
export function AnuncioPreview({
  surface,
  tone,
  template,
  title,
  body,
  linkUrl,
  linkLabel,
  dismissible,
  frameLabel,
}: AnuncioPreviewProps) {
  const mock: ActiveAnnouncement = {
    id: 0,
    title: title || '—',
    body: body || '_(sin contenido todavía)_',
    tone,
    surface,
    template,
    dismissible,
    linkUrl: linkUrl || null,
    linkLabel: linkLabel || null,
  };

  if (surface === 'BANNER') {
    return (
      <div className="anuncio-preview anuncio-preview--banner">
        <span className="anuncio-preview__frame-label">{frameLabel}</span>
        <div className="anuncio-preview__banner-frame">
          <BannerSurface
            announcement={mock}
            onDismiss={noop}
            dismissLabel="Cerrar"
          />
        </div>
      </div>
    );
  }

  if (surface === 'MODAL') {
    return (
      <div className="anuncio-preview">
        <span className="anuncio-preview__frame-label">{frameLabel}</span>
        <div className="anuncio-preview__modal-frame">
          <div className="anuncio-preview__modal-card">
            <AnnouncementContent
              tone={mock.tone}
              template={mock.template}
              title={mock.title}
              body={mock.body}
              linkUrl={mock.linkUrl}
              linkLabel={mock.linkLabel}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="anuncio-preview">
      <span className="anuncio-preview__frame-label">{frameLabel}</span>
      <div className="anuncio-preview__toast-frame">
        <div
          className={`anuncio-preview__toast-card anuncio-preview__toast-card--${tone.toLowerCase()}`}
        >
          <AnnouncementContent
            tone={mock.tone}
            template={mock.template}
            title={mock.title}
            body={mock.body}
            linkUrl={mock.linkUrl}
            linkLabel={mock.linkLabel}
          />
        </div>
      </div>
    </div>
  );
}
