import { Button } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import type { ActiveAnnouncement } from '@/hooks/useActiveAnnouncements';
import { AnnouncementContent } from '../AnnouncementContent';
import './BannerSurface.css';

interface BannerSurfaceProps {
  announcement: ActiveAnnouncement;
  onDismiss: () => void;
  dismissLabel: string;
}

/**
 * Franja arriba del contenido de la pagina. Layout tipo card (no una row
 * centrada): el icono se alinea arriba del bloque de texto, el boton de
 * cerrar queda fijo en la esquina sin importar cuanto crezca el contenido
 * (titulos, tablas, listas, etc no lo empujan ni lo descentran).
 */
export function BannerSurface({
  announcement,
  onDismiss,
  dismissLabel,
}: BannerSurfaceProps) {
  return (
    <div
      className={`banner-surface banner-surface--${announcement.tone.toLowerCase()}`}
      role="region"
      aria-label={announcement.title}
    >
      <div className="banner-surface__body">
        <AnnouncementContent
          tone={announcement.tone}
          template={announcement.template}
          title={announcement.title}
          body={announcement.body}
          linkUrl={announcement.linkUrl}
          linkLabel={announcement.linkLabel}
        />
      </div>
      {announcement.dismissible && (
        <Button
          type="text"
          size="small"
          icon={<CloseOutlined />}
          className="banner-surface__close"
          onClick={onDismiss}
          aria-label={dismissLabel}
        />
      )}
    </div>
  );
}
