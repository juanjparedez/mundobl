'use client';

import { useEffect, useState, useCallback } from 'react';
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
import './SeriesInfoBlocksManager.css';

interface InfoBlock {
  id: number;
  label: string;
  body: string;
  sortOrder: number;
}

interface Props {
  seriesId: number;
}

// Sugerencias de labels comunes — solo guia, el admin puede escribir cualquier cosa.
const LABEL_SUGGESTIONS = [
  'Basado en',
  'Curiosidades',
  'Premios',
  'Polemica',
  'Datos de produccion',
  'Banda sonora',
  'Citas / Frases',
];

export function SeriesInfoBlocksManager({ seriesId }: Props) {
  const message = useMessage();
  const [blocks, setBlocks] = useState<InfoBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | 'new' | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editBody, setEditBody] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/series/${seriesId}/info-blocks`);
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data: InfoBlock[] = await res.json();
      setBlocks(data);
    } catch (e) {
      message.error(
        e instanceof Error ? e.message : 'Error al cargar bloques'
      );
    } finally {
      setLoading(false);
    }
  }, [seriesId, message]);

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
      message.warning('Faltan campos: label y contenido son requeridos');
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
      message.success(editingId === 'new' ? 'Bloque creado' : 'Bloque actualizado');
      cancelEdit();
      await load();
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      const res = await fetch(`/api/series/info-blocks/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      message.success('Bloque eliminado');
      await load();
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Error al eliminar');
    }
  }

  async function handleMove(id: number, direction: 'up' | 'down') {
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
      message.error(e instanceof Error ? e.message : 'Error al reordenar');
      await load(); // rollback
    }
  }

  const isEditing = editingId !== null;

  return (
    <div className="series-info-blocks">
      <div className="series-info-blocks__header">
        <div>
          <h3 className="series-info-blocks__title">
            <AppstoreOutlined /> Bloques de informacion adicional
          </h3>
          <Typography.Text type="secondary" style={{ fontSize: 13 }}>
            Cards libres que aparecen en la pagina publica de la serie. Solo
            se muestran las que tienen contenido. Sirve para "Basado en",
            "Curiosidades", "Premios", o lo que se te ocurra.
          </Typography.Text>
        </div>
        {!isEditing && (
          <Button type="primary" icon={<PlusOutlined />} onClick={startCreate}>
            Agregar bloque
          </Button>
        )}
      </div>

      {editingId === 'new' && (
        <Card className="series-info-blocks__editor" size="small">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Input
              placeholder="Label (ej. Basado en, Curiosidades, Premios)"
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
              placeholder="Contenido del bloque (saltos de linea preservados)"
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
                Guardar
              </Button>
              <Button icon={<CloseOutlined />} onClick={cancelEdit}>
                Cancelar
              </Button>
            </Space>
          </Space>
        </Card>
      )}

      {loading ? (
        <Alert message="Cargando..." type="info" />
      ) : blocks.length === 0 && editingId !== 'new' ? (
        <Empty
          description="Aún no hay bloques. Agregá uno con el boton arriba."
          style={{ padding: '32px 0' }}
        />
      ) : (
        <div className="series-info-blocks__list">
          {blocks.map((block, idx) => {
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
                        Guardar
                      </Button>
                      <Button icon={<CloseOutlined />} onClick={cancelEdit}>
                        Cancelar
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
                          disabled={idx === blocks.length - 1 || isEditing}
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
                          title="¿Eliminar este bloque?"
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
