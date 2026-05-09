'use client';

import { useEffect, useState } from 'react';
import { Modal, Input, Button, Popconfirm, Tag } from 'antd';
import { LockOutlined, DeleteOutlined } from '@ant-design/icons';
import { useMessage } from '@/hooks/useMessage';
import { useLocale } from '@/lib/providers/LocaleProvider';
import './EpisodeNoteModal.css';

const { TextArea } = Input;

interface EpisodeNoteModalProps {
  episodeId: number | null;
  episodeLabel?: string;
  open: boolean;
  onClose: () => void;
  // Se llama cuando la nota se crea/actualiza/borra para que el padre
  // pueda actualizar el indicador de "tiene nota".
  onNoteChange?: (hasNote: boolean) => void;
}

interface NoteData {
  id: number;
  body: string;
  updatedAt: string;
}

export function EpisodeNoteModal({
  episodeId,
  episodeLabel,
  open,
  onClose,
  onNoteChange,
}: EpisodeNoteModalProps) {
  const { t, locale } = useLocale();
  const message = useMessage();
  const [body, setBody] = useState('');
  const [original, setOriginal] = useState<NoteData | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !episodeId) {
      setBody('');
      setOriginal(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/episodes/${episodeId}/note`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: NoteData | null) => {
        if (cancelled) return;
        setOriginal(data);
        setBody(data?.body ?? '');
      })
      .catch(() => {
        if (!cancelled) message.error(t('episodeNote.loadError'));
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [open, episodeId, message, t]);

  const handleSave = async () => {
    if (!episodeId) return;
    const trimmed = body.trim();
    if (!trimmed) {
      message.warning(t('episodeNote.empty'));
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/episodes/${episodeId}/note`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: trimmed }),
      });
      const data = (await res.json()) as { error?: string } & NoteData;
      if (!res.ok) throw new Error(data.error || 'Error');
      setOriginal(data);
      onNoteChange?.(true);
      message.success(t('episodeNote.saved'));
      onClose();
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : t('episodeNote.saveError')
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!episodeId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/episodes/${episodeId}/note`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error();
      onNoteChange?.(false);
      message.success(t('episodeNote.deleted'));
      onClose();
    } catch {
      message.error(t('episodeNote.deleteError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={
        <span className="episode-note-modal__title">
          <LockOutlined /> {t('episodeNote.title')}
          {episodeLabel && (
            <span className="episode-note-modal__label">— {episodeLabel}</span>
          )}
        </span>
      }
      open={open}
      onCancel={onClose}
      mask={{ closable: !saving }}
      destroyOnClose
      width={560}
      footer={[
        original && (
          <Popconfirm
            key="delete"
            title={t('episodeNote.deleteConfirm')}
            onConfirm={handleDelete}
            okText={t('episodeNote.delete')}
            cancelText={t('episodeNote.cancel')}
            okButtonProps={{ danger: true }}
          >
            <Button danger icon={<DeleteOutlined />} loading={saving}>
              {t('episodeNote.delete')}
            </Button>
          </Popconfirm>
        ),
        <Button key="cancel" onClick={onClose} disabled={saving}>
          {t('episodeNote.cancel')}
        </Button>,
        <Button key="save" type="primary" onClick={handleSave} loading={saving}>
          {t('episodeNote.save')}
        </Button>,
      ]}
    >
      <p className="episode-note-modal__hint">
        <Tag color="default" icon={<LockOutlined />}>
          {t('episodeNote.privateTag')}
        </Tag>{' '}
        {t('episodeNote.hint')}
      </p>
      <TextArea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={t('episodeNote.placeholder')}
        rows={8}
        maxLength={5000}
        showCount
        disabled={loading || saving}
      />
      {original && (
        <p className="episode-note-modal__meta">
          {t('episodeNote.lastUpdated')}{' '}
          {new Date(original.updatedAt).toLocaleString(locale)}
        </p>
      )}
    </Modal>
  );
}
