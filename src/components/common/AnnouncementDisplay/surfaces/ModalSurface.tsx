import { useState } from 'react';
import { Modal } from 'antd';
import type { ActiveAnnouncement } from '@/hooks/useActiveAnnouncements';
import { AnnouncementContent } from '../AnnouncementContent';
import './ModalSurface.css';

interface ModalSurfaceProps {
  announcement: ActiveAnnouncement;
  onDismiss: () => void;
}

/**
 * Se abre solo al montar (osea: apenas hay un anuncio con surface=MODAL sin
 * descartar para la pagina actual). Cerrar (X, click afuera, Escape) cuenta
 * como dismiss igual que cerrar el banner — mismo localStorage compartido.
 */
export function ModalSurface({ announcement, onDismiss }: ModalSurfaceProps) {
  const [open, setOpen] = useState(true);

  const handleClose = () => {
    setOpen(false);
    onDismiss();
  };

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      footer={null}
      centered
      className="announcement-modal"
      closable={announcement.dismissible}
      maskClosable={announcement.dismissible}
      keyboard={announcement.dismissible}
    >
      <AnnouncementContent
        tone={announcement.tone}
        template={announcement.template}
        title={announcement.title}
        body={announcement.body}
        linkUrl={announcement.linkUrl}
        linkLabel={announcement.linkLabel}
      />
    </Modal>
  );
}
