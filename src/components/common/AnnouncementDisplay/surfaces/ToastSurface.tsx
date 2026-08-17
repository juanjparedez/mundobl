import { Button } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import type { ActiveAnnouncement } from '@/hooks/useActiveAnnouncements';
import { AnnouncementContent } from '../AnnouncementContent';
import './ToastSurface.css';

interface ToastSurfaceProps {
  announcement: ActiveAnnouncement;
  onDismiss: () => void;
  dismissLabel: string;
}

/**
 * Card chico fixed en la esquina inferior derecha. Sin auto-hide por timer
 * a proposito: el dismiss siempre es una accion explicita del usuario, igual
 * que el resto del sistema (banner, privacy banner, etc).
 */
export function ToastSurface({
  announcement,
  onDismiss,
  dismissLabel,
}: ToastSurfaceProps) {
  return (
    <div
      className={`toast-surface toast-surface--${announcement.tone.toLowerCase()}`}
      role="region"
      aria-label={announcement.title}
    >
      <AnnouncementContent
        tone={announcement.tone}
        template={announcement.template}
        title={announcement.title}
        body={announcement.body}
        linkUrl={announcement.linkUrl}
        linkLabel={announcement.linkLabel}
      />
      {announcement.dismissible && (
        <Button
          type="text"
          size="small"
          icon={<CloseOutlined />}
          className="toast-surface__close"
          onClick={onDismiss}
          aria-label={dismissLabel}
        />
      )}
    </div>
  );
}
