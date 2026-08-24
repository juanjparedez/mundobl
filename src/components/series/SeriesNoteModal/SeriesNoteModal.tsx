'use client';

import { useEffect, useState } from 'react';
import { Modal, Input, Button, Popconfirm, Tag } from 'antd';
import { LockOutlined, DeleteOutlined } from '@ant-design/icons';
import { useMessage } from '@/hooks/useMessage';
import { useLocale } from '@/lib/providers/LocaleProvider';
import './SeriesNoteModal.css';

const { TextArea } = Input;

interface SeriesNoteModalProps {
  seriesId: number | null;
  seriesLabel?: string;
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

export function SeriesNoteModal({
  seriesId,
  seriesLabel,
  open,
  onClose,
  onNoteChange,
}: SeriesNoteModalProps) {
  const { t, locale } = useLocale();
  const message = useMessage();
  const [body, setBody] = useState('');
  const [original, setOriginal] = useState<NoteData | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !seriesId) {
      setBody('');
      setOriginal(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/series/${seriesId}/note`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: NoteData | null) => {
        if (cancelled) return;
        setOriginal(data);
        setBody(data?.body ?? '');
      })
      .catch(() => {
        if (!cancelled) message.error(t('seriesNote.loadError'));
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [open, seriesId, message, t]);

  const handleSave = async () => {
    if (!seriesId) return;
    const trimmed = body.trim();
    if (!trimmed) {
      message.warning(t('seriesNote.empty'));
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/series/${seriesId}/note`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: trimmed }),
      });
      const data = (await res.json()) as { error?: string } & NoteData;
      if (!res.ok) throw new Error(data.error || 'Error');
      setOriginal(data);
      onNoteChange?.(true);
      message.success(t('seriesNote.saved'));
      onClose();
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : t('seriesNote.saveError')
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!seriesId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/series/${seriesId}/note`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error();
      onNoteChange?.(false);
      message.success(t('seriesNote.deleted'));
      onClose();
    } catch {
      message.error(t('seriesNote.deleteError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={
        <span className="series-note-modal__title">
          <LockOutlined /> {t('seriesNote.title')}
          {seriesLabel && (
            <span className="series-note-modal__label">— {seriesLabel}</span>
          )}
        </span>
      }
      open={open}
      onCancel={onClose}
      maskClosable={false}
      destroyOnClose
      width={560}
      footer={[
        original && (
          <Popconfirm
            key="delete"
            title={t('seriesNote.deleteConfirm')}
            onConfirm={handleDelete}
            okText={t('seriesNote.delete')}
            cancelText={t('seriesNote.cancel')}
            okButtonProps={{ danger: true }}
          >
            <Button danger icon={<DeleteOutlined />} loading={saving}>
              {t('seriesNote.delete')}
            </Button>
          </Popconfirm>
        ),
        <Button key="cancel" onClick={onClose} disabled={saving}>
          {t('seriesNote.cancel')}
        </Button>,
        <Button key="save" type="primary" onClick={handleSave} loading={saving}>
          {t('seriesNote.save')}
        </Button>,
      ]}
    >
      <p className="series-note-modal__hint">
        <Tag color="default" icon={<LockOutlined />}>
          {t('seriesNote.privateTag')}
        </Tag>{' '}
        {t('seriesNote.hint')}
      </p>
      <TextArea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={t('seriesNote.placeholder')}
        rows={8}
        maxLength={5000}
        showCount
        disabled={loading || saving}
      />
      {original && (
        <p className="series-note-modal__meta">
          {t('seriesNote.lastUpdated')}{' '}
          {new Date(original.updatedAt).toLocaleString(locale)}
        </p>
      )}
    </Modal>
  );
}
