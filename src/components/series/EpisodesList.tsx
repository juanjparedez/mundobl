'use client';

import { useState, useMemo } from 'react';
import {
  Tag,
  Modal,
  Form,
  Input,
  InputNumber,
  Button,
  Checkbox,
  Tooltip,
  Space,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
  CommentOutlined,
  ThunderboltOutlined,
  CheckCircleFilled,
  EyeOutlined,
  EyeInvisibleOutlined,
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
    status: string;
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
  const [generating, setGenerating] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [form] = Form.useForm();

  const allSelected = useMemo(
    () => episodes.length > 0 && selectedIds.size === episodes.length,
    [episodes.length, selectedIds.size]
  );

  const someSelected = useMemo(
    () => selectedIds.size > 0 && selectedIds.size < episodes.length,
    [episodes.length, selectedIds.size]
  );

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(episodes.map((ep) => ep.id)));
    }
  };

  const handleSelectOne = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

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
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(episodeId);
        return next;
      });
      message.success('Episodio eliminado');
    } catch {
      message.error('Error al eliminar el episodio');
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    setBulkDeleting(true);
    try {
      const response = await fetch('/api/episodes/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });

      if (!response.ok) throw new Error();

      const result = await response.json();
      setEpisodes(episodes.filter((ep) => !selectedIds.has(ep.id)));
      setSelectedIds(new Set());
      message.success(result.message);
    } catch {
      message.error('Error al eliminar los episodios');
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleToggleWatched = async (
    episodeId: number,
    currentlyWatched: boolean
  ) => {
    try {
      const newStatus = currentlyWatched ? 'SIN_VER' : 'VISTA';
      const response = await fetch(`/api/episodes/${episodeId}/view-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error();

      const viewStatus = await response.json();

      setEpisodes(
        episodes.map((ep) =>
          ep.id === episodeId
            ? {
                ...ep,
                viewStatus: [
                  {
                    status: viewStatus.status,
                    watchedDate: viewStatus.watchedDate,
                  },
                ],
              }
            : ep
        )
      );

      message.success(
        viewStatus.status === 'VISTA'
          ? 'Episodio marcado como visto'
          : 'Episodio marcado como no visto'
      );
    } catch {
      message.error('Error al actualizar el estado');
    }
  };

  const handleBulkToggleWatched = async (markAsWatched: boolean) => {
    const ids = Array.from(selectedIds);
    const newStatus = markAsWatched ? 'VISTA' : 'SIN_VER';
    let updatedCount = 0;

    try {
      await Promise.all(
        ids.map(async (id) => {
          const response = await fetch(`/api/episodes/${id}/view-status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus }),
          });
          if (response.ok) {
            updatedCount++;
            const viewStatus = await response.json();
            setEpisodes((prev) =>
              prev.map((ep) =>
                ep.id === id
                  ? {
                      ...ep,
                      viewStatus: [
                        {
                          status: viewStatus.status,
                          watchedDate: viewStatus.watchedDate,
                        },
                      ],
                    }
                  : ep
              )
            );
          }
        })
      );

      setSelectedIds(new Set());
      message.success(
        `${updatedCount} episodio(s) marcado(s) como ${markAsWatched ? 'vistos' : 'no vistos'}`
      );
    } catch {
      message.error('Error al actualizar los episodios');
    }
  };

  const handleGenerateEpisodes = async () => {
    setGenerating(true);
    try {
      const response = await fetch('/api/episodes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seasonId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al generar');
      }

      const result = await response.json();
      setEpisodes(result.episodes);
      setSelectedIds(new Set());
      message.success(result.message);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error al generar episodios';
      message.error(errorMessage);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="episodes-list">
      {/* Header */}
      <div className="episodes-list__header">
        <h5 className="season-section-title">Episodios ({episodes.length})</h5>
        <Space>
          <Button
            size="small"
            icon={<ThunderboltOutlined />}
            onClick={handleGenerateEpisodes}
            loading={generating}
          >
            Generar
          </Button>
          <Button
            type="dashed"
            size="small"
            icon={<PlusOutlined />}
            onClick={() => handleOpenModal()}
          >
            Agregar
          </Button>
        </Space>
      </div>

      {episodes.length === 0 ? (
        <p className="episodes-list__empty">
          No hay episodios registrados. Usa &quot;Generar&quot; o
          &quot;Agregar&quot; para comenzar.
        </p>
      ) : (
        <>
          {/* Table header with select all and bulk actions */}
          <div className="episodes-table__toolbar">
            <div className="episodes-table__toolbar-left">
              <Checkbox
                checked={allSelected}
                indeterminate={someSelected}
                onChange={handleSelectAll}
              />
              {selectedIds.size > 0 ? (
                <span className="episodes-table__selected-count">
                  {selectedIds.size} seleccionado
                  {selectedIds.size > 1 ? 's' : ''}
                </span>
              ) : (
                <span className="episodes-table__col-label">Episodio</span>
              )}
            </div>
            {selectedIds.size > 0 ? (
              <Space size="small">
                <Tooltip title="Marcar como vistos">
                  <Button
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={() => handleBulkToggleWatched(true)}
                  >
                    Vistos
                  </Button>
                </Tooltip>
                <Tooltip title="Marcar como no vistos">
                  <Button
                    size="small"
                    icon={<EyeInvisibleOutlined />}
                    onClick={() => handleBulkToggleWatched(false)}
                  >
                    No vistos
                  </Button>
                </Tooltip>
                <Button
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  loading={bulkDeleting}
                  onClick={() => {
                    modal.confirm({
                      title: '¿Eliminar episodios seleccionados?',
                      content: `Se eliminarán ${selectedIds.size} episodio(s) con sus comentarios y estados de visualización.`,
                      okText: 'Sí, eliminar',
                      cancelText: 'Cancelar',
                      okButtonProps: { danger: true },
                      onOk: handleBulkDelete,
                    });
                  }}
                >
                  Eliminar
                </Button>
              </Space>
            ) : (
              <span className="episodes-table__col-label episodes-table__col-label--actions">
                Acciones
              </span>
            )}
          </div>

          {/* Episode rows */}
          <div className="episodes-table__body">
            {episodes.map((episode) => {
              const isWatched =
                episode.viewStatus?.[0]?.status === 'VISTA' || false;
              const isSelected = selectedIds.has(episode.id);
              const commentCount = episode.comments?.length || 0;

              return (
                <div key={episode.id}>
                  <div
                    className={`episodes-table__row${isWatched ? ' episodes-table__row--watched' : ''}${isSelected ? ' episodes-table__row--selected' : ''}`}
                  >
                    <div className="episodes-table__cell episodes-table__cell--select">
                      <Checkbox
                        checked={isSelected}
                        onChange={() => handleSelectOne(episode.id)}
                      />
                    </div>

                    <div
                      className="episodes-table__cell episodes-table__cell--number"
                      onClick={() => handleToggleWatched(episode.id, isWatched)}
                    >
                      <span className="episodes-table__ep-number">
                        {episode.episodeNumber}
                      </span>
                    </div>

                    <div className="episodes-table__cell episodes-table__cell--title">
                      {episode.title && (
                        <span className="episodes-table__ep-title">
                          {episode.title}
                        </span>
                      )}
                      {episode.duration && (
                        <Tag
                          icon={<ClockCircleOutlined />}
                          className="episodes-table__duration-tag"
                        >
                          {episode.duration} min
                        </Tag>
                      )}
                    </div>

                    <div className="episodes-table__cell episodes-table__cell--status">
                      {isWatched && (
                        <Tag
                          icon={<CheckCircleFilled />}
                          color="success"
                          className="episodes-table__watched-tag"
                        >
                          Visto
                        </Tag>
                      )}
                    </div>

                    <div className="episodes-table__cell episodes-table__cell--actions">
                      <Tooltip title={`Comentarios (${commentCount})`}>
                        <Button
                          type="text"
                          size="small"
                          icon={<CommentOutlined />}
                          className={
                            expandedEpisode === episode.id
                              ? 'episodes-table__action-btn--active'
                              : ''
                          }
                          onClick={() =>
                            setExpandedEpisode(
                              expandedEpisode === episode.id ? null : episode.id
                            )
                          }
                        >
                          {commentCount > 0 && (
                            <span className="episodes-table__comment-count">
                              {commentCount}
                            </span>
                          )}
                        </Button>
                      </Tooltip>
                      <Tooltip title="Editar">
                        <Button
                          type="text"
                          size="small"
                          icon={<EditOutlined />}
                          onClick={() => handleOpenModal(episode)}
                        />
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <Button
                          type="text"
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
                        />
                      </Tooltip>
                    </div>
                  </div>

                  {/* Synopsis expandible */}
                  {episode.synopsis && expandedEpisode !== episode.id && (
                    <div className="episodes-table__synopsis-preview">
                      {episode.synopsis}
                    </div>
                  )}

                  {/* Comments section */}
                  {expandedEpisode === episode.id && (
                    <div className="episodes-table__comments">
                      {episode.synopsis && (
                        <p className="episodes-table__synopsis">
                          {episode.synopsis}
                        </p>
                      )}
                      <CommentsList
                        episodeId={episode.id}
                        initialComments={episode.comments || []}
                        compact={true}
                        placeholder="Escribe tus notas sobre este episodio, escenas interesantes, momentos clave..."
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Modal crear/editar episodio */}
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

          <Form.Item label="Título (opcional)" name="title">
            <Input placeholder="Ej: The Beginning" />
          </Form.Item>

          <Form.Item label="Minutos" name="duration">
            <InputNumber min={1} style={{ width: '100%' }} placeholder="45" />
          </Form.Item>

          <Form.Item label="Sinopsis" name="synopsis">
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
