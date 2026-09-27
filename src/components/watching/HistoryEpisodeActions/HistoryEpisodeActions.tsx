'use client';

import { useState } from 'react';
import { Button, Modal } from 'antd';
import { CommentOutlined, LockOutlined } from '@ant-design/icons';
import { CommentsList } from '@/components/common/CommentsList';
import { EpisodeNoteModal } from '@/components/series/EpisodeNoteModal/EpisodeNoteModal';
import './HistoryEpisodeActions.css';

interface Props {
  episodeId: number;
  chapterLabel: string;
  labels: { note: string; comments: string };
}

export function HistoryEpisodeActions({
  episodeId,
  chapterLabel,
  labels,
}: Props) {
  const [open, setOpen] = useState<'note' | 'comments' | null>(null);
  return (
    <>
      <div className="history-episode-actions">
        <Button
          aria-label={labels.note}
          icon={<LockOutlined />}
          onClick={() => setOpen('note')}
        >
          {labels.note}
        </Button>
        <Button
          aria-label={labels.comments}
          icon={<CommentOutlined />}
          onClick={() => setOpen('comments')}
        >
          {labels.comments}
        </Button>
      </div>
      <EpisodeNoteModal
        episodeId={open === 'note' ? episodeId : null}
        episodeLabel={chapterLabel}
        open={open === 'note'}
        onClose={() => setOpen(null)}
      />
      <Modal
        title={`${chapterLabel} · ${labels.comments}`}
        open={open === 'comments'}
        onCancel={() => setOpen(null)}
        footer={null}
        destroyOnHidden
      >
        {open === 'comments' && <CommentsList episodeId={episodeId} />}
      </Modal>
    </>
  );
}
