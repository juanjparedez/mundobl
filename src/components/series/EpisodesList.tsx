'use client';

import { useState } from 'react';
import { Tag, Modal, Form, Input, InputNumber, Button, Checkbox } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
  CommentOutlined,
} from '@ant-design/icons';
import { CommentsList } from '@/components/common/CommentsList';
import './EpisodesList.css';
import { useMessage, useModal } from '@/hooks/useMessage';

const { TextArea } = Input;

interface Episode {
  id: number;
  episodeNumber: number;
  title?: string | null;
  duration?: number | null;
  synopsis?: string | null;
  viewStatus?: Array<{
    watched: boolean;
    watchedDate?: Date | null;
  }> | null;
  comments?: Array<{
    id: number;
    content: string;
    createdAt: Date;
    updatedAt: Date;
  }> | null;
}

interface EpisodesListProps {
  seasonId: number;
  initialEpisodes?: Episode[];
}

export function EpisodesList({
  seasonId,
  initialEpisodes = [],
}: EpisodesListProps) {
  const message = useMessage();
  const modal = useModal();
  const [episodes, setEpisodes] = useState<Episode[]>(initialEpisodes);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEpisode, setEditingEpisode] = useState<Episode | null>(null);
  const [expandedEpisode, setExpandedEpisode] = useState<number | null>(null);
  const [form] = Form.useForm();

  const handleOpenModal = (episode?: Episode) => {
    if (episode) {
      setEditingEpisode(episode);
      form.setFieldsValue(episode);
    } else {
      setEditingEpisode(null);
      form.resetFields();
      form.setFieldsValue({ episodeNumber: episodes.length + 1 });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingEpisode(null);
    form.resetFields();
  };

  const handleSubmit = async (values: Record<string, unknown>) => {
    try {
      const url = editingEpisode
        ? `/api/episodes/${editingEpisode.id}`
        : `/api/episodes`;
      const method = editingEpisode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, seasonId }),
      });

      if (!response.ok) throw new Error();

      const savedEpisode = await response.json();

      if (editingEpisode) {
        setEpisodes(
          episodes.map((ep) => (ep.id === savedEpisode.id ? savedEpisode : ep))
        );
        message.success('Episodio actualizado');
      } else {
        setEpisodes(
          [...episodes, savedEpisode].sort(
            (a, b) => a.episodeNumber - b.episodeNumber
          )
        );
        message.success('Episodio creado');
      }

      handleCloseModal();
    } catch {
      message.error('Error al guardar el episodio');
    }
  };

  const handleDelete = async (episodeId: number) => {
    try {
      const response = await fetch(`/api/episodes/${episodeId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error();

      setEpisodes(episodes.filter((ep) => ep.id !== episodeId));
      message.success('Episodio eliminado');
    } catch {
      message.error('Error al eliminar el episodio');
    }
  };

  const handleToggleWatched = async (
    episodeId: number,
    currentWatched: boolean
  ) => {
    try {
      const response = await fetch(`/api/episodes/${episodeId}/view-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ watched: !currentWatched }),
      });

      if (!response.ok) throw new Error();

      const viewStatus = await response.json();

      // Actualizar el estado local
      setEpisodes(
        episodes.map((ep) =>
          ep.id === episodeId
            ? {
                ...ep,
                viewStatus: [
                  {
                    watched: viewStatus.watched,
                    watchedDate: viewStatus.watchedDate,
                  },
                ],
              }
            : ep
        )
      );

      message.success(
        viewStatus.watched
          ? '✓ Episodio marcado como visto'
          : 'Episodio marcado como no visto'
      );
    } catch {
      message.error('Error al actualizar el estado');
    }
  };

  return (
    <div className="episodes-list">
      <div className="episodes-list__header">
        <h5 className="season-section-title">
          📺 Episodios ({episodes.length})
        </h5>
        <Button
          type="dashed"
          size="small"
          icon={<PlusOutlined />}
          onClick={() => handleOpenModal()}
        >
          Agregar Episodio
        </Button>
      </div>

      {episodes.length === 0 ? (
        <p
          style={{
            color: 'var(--text-secondary)',
            textAlign: 'center',
            padding: '16px',
          }}
        >
          No hay episodios registrados. Haz clic en &quot;Agregar Episodio&quot;
          para comenzar.
        </p>
      ) : (
        <div className="episodes-list__items">
          {episodes.map((episode) => (
            <div key={episode.id} className="episode-item">
              <div className="episode-item__row">
                <div className="episode-item__content">
                  <Checkbox
                    checked={episode.viewStatus?.[0]?.watched || false}
                    onChange={() =>
                      handleToggleWatched(
                        episode.id,
                        episode.viewStatus?.[0]?.watched || false
                      )
                    }
                  />
                  <div className="episode-item__meta">
                    <div
                      style={{
                        textDecoration: episode.viewStatus?.[0]?.watched
                          ? 'line-through'
                          : 'none',
                      }}
                    >
                      <strong>Episodio {episode.episodeNumber}</strong>
                      {episode.title && ` - ${episode.title}`}
                      {episode.viewStatus?.[0]?.watched && (
                        <Tag color="success" style={{ marginLeft: 8 }}>
                          ✓ Visto
                        </Tag>
                      )}
                    </div>
                    <div className="episode-item__description">
                      {episode.duration && (
                        <Tag
                          icon={<ClockCircleOutlined />}
                          color="blue"
                          style={{ marginBottom: 8 }}
                        >
                          {episode.duration} min
                        </Tag>
                      )}
                      {episode.synopsis && (
                        <div className="episode-synopsis">
                          <small>{episode.synopsis}</small>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="episode-item__actions">
                  <Button
                    type="link"
                    size="small"
                    icon={<CommentOutlined />}
                    onClick={() =>
                      setExpandedEpisode(
                        expandedEpisode === episode.id ? null : episode.id
                      )
                    }
                  >
                    Comentar ({episode.comments?.length || 0})
                  </Button>
                  <Button
                    type="link"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => handleOpenModal(episode)}
                  >
                    Editar
                  </Button>
                  <Button
                    type="link"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => {
                      modal.confirm({
                        title: '¿Eliminar episodio?',
                        content: `¿Estás seguro de eliminar el episodio ${episode.episodeNumber}?`,
                        okText: 'Sí, eliminar',
                        cancelText: 'Cancelar',
                        okButtonProps: { danger: true },
                        onOk: () => handleDelete(episode.id),
                      });
                    }}
                  >
                    Eliminar
                  </Button>
                </div>
              </div>

              {expandedEpisode === episode.id && (
                <div className="episode-comments-section">
                  <CommentsList
                    episodeId={episode.id}
                    initialComments={episode.comments || []}
                    compact={true}
                    placeholder="Escribe tus notas sobre este episodio, escenas interesantes, momentos clave..."
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal
        title={editingEpisode ? 'Editar Episodio' : 'Nuevo Episodio'}
        open={isModalOpen}
        onCancel={handleCloseModal}
        footer={null}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="Número de Episodio"
            name="episodeNumber"
            rules={[{ required: true, message: 'Requerido' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="Título del Episodio (opcional)" name="title">
            <Input placeholder="Ej: The Beginning" />
          </Form.Item>

          <Form.Item label="Duración (minutos)" name="duration">
            <InputNumber min={1} style={{ width: '100%' }} placeholder="45" />
          </Form.Item>

          <Form.Item label="Sinopsis del Episodio" name="synopsis">
            <TextArea
              rows={4}
              placeholder="Breve descripción de lo que sucede en este episodio..."
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Button onClick={handleCloseModal} style={{ marginRight: 8 }}>
              Cancelar
            </Button>
            <Button type="primary" htmlType="submit">
              {editingEpisode ? 'Guardar' : 'Crear'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
