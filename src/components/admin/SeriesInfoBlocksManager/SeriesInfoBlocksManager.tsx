'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Button,
  Input,
  Empty,
  Popconfirm,
  Space,
  Tag,
  Card,
  Typography,
  Alert,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SaveOutlined,
  CloseOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import { useMessage } from '@/hooks/useMessage';
import { useLocale } from '@/lib/providers/LocaleProvider';
import './SeriesInfoBlocksManager.css';

interface InfoBlock {
  id: number;
  label: string;
  body: string;
  sortOrder: number;
}

/**
 * Bloque pendiente (modo creación de serie, sin `seriesId` todavía). Se mantiene
 * en memoria en el form padre y se adjunta al payload de creación.
 */
export interface PendingInfoBlock {
  _tempId: number;
  label: string;
  body: string;
}

interface Props {
  /** En modo edición: id de la serie (persiste vía API en vivo). */
  seriesId?: number;
  /** En modo creación (sin seriesId): bloques en memoria del form padre. */
  pendingBlocks?: PendingInfoBlock[];
  onPendingBlocksChange?: (blocks: PendingInfoBlock[]) => void;
}

export function SeriesInfoBlocksManager({
  seriesId,
  pendingBlocks,
  onPendingBlocksChange,
}: Props) {
  const { t } = useLocale();
  const message = useMessage();
  const isLocalMode = !seriesId;
  const [blocks, setBlocks] = useState<InfoBlock[]>([]);
  const [loading, setLoading] = useState(!isLocalMode);
  const [editingId, setEditingId] = useState<number | 'new' | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editBody, setEditBody] = useState('');
  const [saving, setSaving] = useState(false);
  const tempIdCounter = useRef(0);

  // Vista unificada: en modo local se deriva de pendingBlocks (usando _tempId
  // como id de fila); en modo server son los bloques cargados de la API.
  const displayBlocks: InfoBlock[] = isLocalMode
    ? (pendingBlocks ?? []).map((b, i) => ({
        id: b._tempId,
        label: b.label,
        body: b.body,
        sortOrder: i,
      }))
    : blocks;

  // Sugerencias de labels comunes — solo guia, el admin puede escribir cualquier cosa.
  const LABEL_SUGGESTIONS = [
    t('seriesInfoBlocksManager.labelSuggestionBasedOn'),
    t('seriesInfoBlocksManager.labelSuggestionCuriosities'),
    t('seriesInfoBlocksManager.labelSuggestionAwards'),
    t('seriesInfoBlocksManager.labelSuggestionControversy'),
    t('seriesInfoBlocksManager.labelSuggestionProductionData'),
    t('seriesInfoBlocksManager.labelSuggestionSoundtrack'),
    t('seriesInfoBlocksManager.labelSuggestionQuotes'),
  ];

  const load = useCallback(async () => {
    if (isLocalMode) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/series/${seriesId}/info-blocks`);
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data: InfoBlock[] = await res.json();
      setBlocks(data);
    } catch (e) {
      message.error(
        e instanceof Error
          ? e.message
          : t('seriesInfoBlocksManager.errorLoadingBlocks')
      );
    } finally {
      setLoading(false);
    }
  }, [seriesId, isLocalMode, message, t]);

  useEffect(() => {
    void load();
  }, [load]);

  function startEdit(block: InfoBlock) {
    setEditingId(block.id);
    setEditLabel(block.label);
    setEditBody(block.body);
  }

  function startCreate() {
    setEditingId('new');
    setEditLabel('');
    setEditBody('');
  }

  function cancelEdit() {
    setEditingId(null);
    setEditLabel('');
    setEditBody('');
  }

  async function handleSave() {
    if (!editLabel.trim() || !editBody.trim()) {
      message.warning(t('seriesInfoBlocksManager.missingFieldsWarning'));
      return;
    }
    if (isLocalMode) {
      const label = editLabel.trim();
      const body = editBody.trim();
      const current = pendingBlocks ?? [];
      if (editingId === 'new') {
        onPendingBlocksChange?.([
          ...current,
          { _tempId: ++tempIdCounter.current, label, body },
        ]);
      } else {
        onPendingBlocksChange?.(
          current.map((b) =>
            b._tempId === editingId ? { ...b, label, body } : b
          )
        );
      }
      message.success(
        editingId === 'new'
          ? t('seriesInfoBlocksManager.blockCreatedSuccess')
          : t('seriesInfoBlocksManager.blockUpdatedSuccess')
      );
      cancelEdit();
      return;
    }
    setSaving(true);
    try {
      let res: Response;
      if (editingId === 'new') {
        res = await fetch(`/api/series/${seriesId}/info-blocks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            label: editLabel.trim(),
            body: editBody.trim(),
          }),
        });
      } else {
        res = await fetch(`/api/series/info-blocks/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            label: editLabel.trim(),
            body: editBody.trim(),
          }),
        });
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Error ${res.status}`);
      }
      message.success(
        editingId === 'new'
          ? t('seriesInfoBlocksManager.blockCreatedSuccess')
          : t('seriesInfoBlocksManager.blockUpdatedSuccess')
      );
      cancelEdit();
      await load();
    } catch (e) {
      message.error(
        e instanceof Error
          ? e.message
          : t('seriesInfoBlocksManager.errorSavingBlock')
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (isLocalMode) {
      onPendingBlocksChange?.(
        (pendingBlocks ?? []).filter((b) => b._tempId !== id)
      );
      message.success(t('seriesInfoBlocksManager.blockDeletedSuccess'));
      return;
    }
    try {
      const res = await fetch(`/api/series/info-blocks/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      message.success(t('seriesInfoBlocksManager.blockDeletedSuccess'));
      await load();
    } catch (e) {
      message.error(
        e instanceof Error
          ? e.message
          : t('seriesInfoBlocksManager.errorDeletingBlock')
      );
    }
  }

  async function handleMove(id: number, direction: 'up' | 'down') {
    if (isLocalMode) {
      const current = pendingBlocks ?? [];
      const idx = current.findIndex((b) => b._tempId === id);
      if (idx === -1) return;
      const swapWith = direction === 'up' ? idx - 1 : idx + 1;
      if (swapWith < 0 || swapWith >= current.length) return;
      const next = [...current];
      [next[idx], next[swapWith]] = [next[swapWith], next[idx]];
      onPendingBlocksChange?.(next);
      return;
    }
    const idx = blocks.findIndex((b) => b.id === id);
    if (idx === -1) return;
    const swapWith = direction === 'up' ? idx - 1 : idx + 1;
    if (swapWith < 0 || swapWith >= blocks.length) return;

    const next = [...blocks];
    [next[idx], next[swapWith]] = [next[swapWith], next[idx]];
    setBlocks(next); // optimistic

    try {
      const res = await fetch(`/api/series/${seriesId}/info-blocks/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds: next.map((b) => b.id) }),
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
    } catch (e) {
      message.error(
        e instanceof Error
          ? e.message
          : t('seriesInfoBlocksManager.errorReorderingBlocks')
      );
      await load(); // rollback
    }
  }

  const isEditing = editingId !== null;

  return (
    <div className="series-info-blocks">
      <div className="series-info-blocks__header">
        <div>
          <h3 className="series-info-blocks__title">
            <AppstoreOutlined /> {t('seriesInfoBlocksManager.title')}
          </h3>
          <Typography.Text type="secondary" style={{ fontSize: 13 }}>
            {t('seriesInfoBlocksManager.description')}
          </Typography.Text>
        </div>
        {!isEditing && (
          <Button type="primary" icon={<PlusOutlined />} onClick={startCreate}>
            {t('seriesInfoBlocksManager.addButton')}
          </Button>
        )}
      </div>

      {editingId === 'new' && (
        <Card className="series-info-blocks__editor" size="small">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Input
              placeholder={t('seriesInfoBlocksManager.labelPlaceholder')}
              value={editLabel}
              maxLength={60}
              onChange={(e) => setEditLabel(e.target.value)}
              showCount
            />
            <div className="series-info-blocks__suggestions">
              {LABEL_SUGGESTIONS.map((s) => (
                <Tag
                  key={s}
                  className="series-info-blocks__suggestion"
                  onClick={() => setEditLabel(s)}
                >
                  {s}
                </Tag>
              ))}
            </div>
            <Input.TextArea
              placeholder={t('seriesInfoBlocksManager.bodyPlaceholder')}
              value={editBody}
              rows={5}
              onChange={(e) => setEditBody(e.target.value)}
            />
            <Space>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                loading={saving}
                onClick={handleSave}
              >
                {t('seriesInfoBlocksManager.saveButton')}
              </Button>
              <Button icon={<CloseOutlined />} onClick={cancelEdit}>
                {t('seriesInfoBlocksManager.cancelButton')}
              </Button>
            </Space>
          </Space>
        </Card>
      )}

      {loading ? (
        <Alert
          message={t('seriesInfoBlocksManager.loadingMessage')}
          type="info"
        />
      ) : displayBlocks.length === 0 && editingId !== 'new' ? (
        <Empty
          description={t('seriesInfoBlocksManager.emptyDescription')}
          style={{ padding: '32px 0' }}
        />
      ) : (
        <div className="series-info-blocks__list">
          {displayBlocks.map((block, idx) => {
            const isThisEditing = editingId === block.id;
            return (
              <Card
                key={block.id}
                size="small"
                className="series-info-blocks__card"
              >
                {isThisEditing ? (
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Input
                      value={editLabel}
                      maxLength={60}
                      onChange={(e) => setEditLabel(e.target.value)}
                      showCount
                    />
                    <Input.TextArea
                      value={editBody}
                      rows={5}
                      onChange={(e) => setEditBody(e.target.value)}
                    />
                    <Space>
                      <Button
                        type="primary"
                        icon={<SaveOutlined />}
                        loading={saving}
                        onClick={handleSave}
                      >
                        {t('seriesInfoBlocksManager.saveButton')}
                      </Button>
                      <Button icon={<CloseOutlined />} onClick={cancelEdit}>
                        {t('seriesInfoBlocksManager.cancelButton')}
                      </Button>
                    </Space>
                  </Space>
                ) : (
                  <>
                    <div className="series-info-blocks__card-header">
                      <strong className="series-info-blocks__card-label">
                        {block.label}
                      </strong>
                      <Space size={4}>
                        <Button
                          size="small"
                          type="text"
                          icon={<ArrowUpOutlined />}
                          disabled={idx === 0 || isEditing}
                          onClick={() => handleMove(block.id, 'up')}
                        />
                        <Button
                          size="small"
                          type="text"
                          icon={<ArrowDownOutlined />}
                          disabled={
                            idx === displayBlocks.length - 1 || isEditing
                          }
                          onClick={() => handleMove(block.id, 'down')}
                        />
                        <Button
                          size="small"
                          type="text"
                          icon={<EditOutlined />}
                          disabled={isEditing}
                          onClick={() => startEdit(block)}
                        />
                        <Popconfirm
                          title={t(
                            'seriesInfoBlocksManager.deleteConfirmTitle'
                          )}
                          onConfirm={() => handleDelete(block.id)}
                          disabled={isEditing}
                        >
                          <Button
                            size="small"
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            disabled={isEditing}
                          />
                        </Popconfirm>
                      </Space>
                    </div>
                    <div className="series-info-blocks__card-body">
                      {block.body}
                    </div>
                  </>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
