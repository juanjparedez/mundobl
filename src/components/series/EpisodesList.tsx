'use client';

import { useState, useMemo, useEffect } from 'react';
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
  FileTextOutlined,
  FileTextFilled,
} from '@ant-design/icons';
import { useSession } from 'next-auth/react';
import { CommentsList } from '@/components/common/CommentsList';
import { SpoilerGate } from '@/components/common/SpoilerGate/SpoilerGate';
import { EpisodeNoteModal } from './EpisodeNoteModal/EpisodeNoteModal';
import './EpisodesList.css';
import { useMessage, useModal } from '@/hooks/useMessage';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { interpolateMessage } from '@/lib/i18n-format';

const { TextArea } = Input;

interface Episode {
  id: number;
  episodeNumber: number;
  title?: string | null;
  duration?: number | null;
  synopsis?: string | null;
  embedUrl?: string | null;
  embedPlatform?: string | null;
  embedChannelName?: string | null;
  embedChannelUrl?: string | null;
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
  const { t } = useLocale();
  const message = useMessage();
  const modal = useModal();
  const { data: session } = useSession();
  const [episodes, setEpisodes] = useState<Episode[]>(initialEpisodes);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEpisode, setEditingEpisode] = useState<Episode | null>(null);
  const [expandedEpisode, setExpandedEpisode] = useState<number | null>(null);
  const [generating, setGenerating] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [noteEpisodeId, setNoteEpisodeId] = useState<number | null>(null);
  // Marca local de qué episodios tienen nota (para refrescar el icono al
  // crear/borrar sin recargar). Se hidrata bajo demanda via /has-notes.
  const [episodesWithNotes, setEpisodesWithNotes] = useState<Set<number>>(
    new Set()
  );
  const [form] = Form.useForm();

  // Al montar (con usuario logueado), cargo en bulk los IDs con nota.
  const userId = session?.user?.id;
  useEffect(() => {
    if (!userId || episodes.length === 0) return;
    const ids = episodes.map((e) => e.id).join(',');
    let cancelled = false;
    fetch(`/api/episodes/notes-summary?ids=${ids}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { episodeIds?: number[] } | null) => {
        if (!cancelled && data?.episodeIds) {
          setEpisodesWithNotes(new Set(data.episodeIds));
        }
      })
      .catch(() => null);
    return () => {
      cancelled = true;
    };
    // Solo re-correr si cambia el usuario o la lista de IDs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, episodes.map((e) => e.id).join(',')]);

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
        message.success(t('episodesList.successUpdated'));
      } else {
        setEpisodes(
          [...episodes, savedEpisode].sort(
            (a, b) => a.episodeNumber - b.episodeNumber
          )
        );
        message.success(t('episodesList.successCreated'));
      }

      handleCloseModal();
    } catch {
      message.error(t('episodesList.errorSave'));
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
      message.success(t('episodesList.successDeleted'));
    } catch {
      message.error(t('episodesList.errorDelete'));
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
      message.error(t('episodesList.errorBulkDelete'));
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
          ? t('episodesList.markedWatched')
          : t('episodesList.markedUnwatched')
      );
    } catch {
      message.error(t('episodesList.errorToggleWatched'));
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
        interpolateMessage(
          markAsWatched
            ? t('episodesList.successBulkWatched')
            : t('episodesList.successBulkUnwatched'),
          { n: String(updatedCount) }
        )
      );
    } catch {
      message.error(t('episodesList.errorBulkToggle'));
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
        throw new Error(error.error || t('episodesList.errorGenerating'));
      }

      const result = await response.json();
      setEpisodes(result.episodes);
      setSelectedIds(new Set());
      message.success(result.message);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : t('episodesList.errorGenerate');
      message.error(errorMessage);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="episodes-list">
      {/* Header */}
      <div className="episodes-list__header">
        <h5 className="season-section-title">
          {interpolateMessage(t('episodesList.headerTitle'), {
            n: String(episodes.length),
          })}
        </h5>
        <Space>
          <Button
            size="small"
            icon={<ThunderboltOutlined />}
            onClick={handleGenerateEpisodes}
            loading={generating}
          >
            {t('episodesList.generateButton')}
          </Button>
          <Button
            type="dashed"
            size="small"
            icon={<PlusOutlined />}
            onClick={() => handleOpenModal()}
          >
            {t('episodesList.addButton')}
          </Button>
        </Space>
      </div>

      {episodes.length === 0 ? (
        <p className="episodes-list__empty">{t('episodesList.emptyText')}</p>
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
                  {interpolateMessage(t('episodesList.selectedCount'), {
                    n: String(selectedIds.size),
                  })}
                </span>
              ) : (
                <span className="episodes-table__col-label">
                  {t('episodesList.colEpisode')}
                </span>
              )}
            </div>
            {selectedIds.size > 0 ? (
              <Space size="small">
                <Tooltip title={t('episodesList.tooltipWatched')}>
                  <Button
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={() => handleBulkToggleWatched(true)}
                  >
                    {t('episodesList.bulkWatched')}
                  </Button>
                </Tooltip>
                <Tooltip title={t('episodesList.tooltipUnwatched')}>
                  <Button
                    size="small"
                    icon={<EyeInvisibleOutlined />}
                    onClick={() => handleBulkToggleWatched(false)}
                  >
                    {t('episodesList.bulkUnwatched')}
                  </Button>
                </Tooltip>
                <Button
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  loading={bulkDeleting}
                  onClick={() => {
                    modal.confirm({
                      title: t('episodesList.deleteBulkConfirmTitle'),
                      content: interpolateMessage(
                        t('episodesList.deleteBulkConfirmContent'),
                        { n: String(selectedIds.size) }
                      ),
                      okText: t('episodesList.confirmOk'),
                      cancelText: t('episodesList.confirmCancel'),
                      okButtonProps: { danger: true },
                      onOk: handleBulkDelete,
                    });
                  }}
                >
                  {t('episodesList.bulkDelete')}
                </Button>
              </Space>
            ) : (
              <span className="episodes-table__col-label episodes-table__col-label--actions">
                {t('episodesList.colActions')}
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
                          {t('episodesList.watchedTag')}
                        </Tag>
                      )}
                    </div>

                    <div className="episodes-table__cell episodes-table__cell--actions">
                      <Tooltip
                        title={interpolateMessage(
                          t('episodesList.tooltipComments'),
                          { n: String(commentCount) }
                        )}
                      >
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
                      {session?.user && (
                        <Tooltip title={t('episodeNote.tooltipOpen')}>
                          <Button
                            type="text"
                            size="small"
                            icon={
                              episodesWithNotes.has(episode.id) ? (
                                <FileTextFilled />
                              ) : (
                                <FileTextOutlined />
                              )
                            }
                            className={
                              episodesWithNotes.has(episode.id)
                                ? 'episodes-table__action-btn--active'
                                : ''
                            }
                            onClick={() => setNoteEpisodeId(episode.id)}
                          />
                        </Tooltip>
                      )}
                      <Tooltip title={t('episodesList.tooltipEdit')}>
                        <Button
                          type="text"
                          size="small"
                          icon={<EditOutlined />}
                          onClick={() => handleOpenModal(episode)}
                        />
                      </Tooltip>
                      <Tooltip title={t('episodesList.tooltipDelete')}>
                        <Button
                          type="text"
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => {
                            modal.confirm({
                              title: t('episodesList.deleteConfirmTitle'),
                              content: interpolateMessage(
                                t('episodesList.deleteConfirmContent'),
                                { n: String(episode.episodeNumber) }
                              ),
                              okText: t('episodesList.confirmOk'),
                              cancelText: t('episodesList.confirmCancel'),
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
                    <SpoilerGate
                      hide={!isWatched}
                      cacheKey={`ep-synopsis-${episode.id}`}
                      reason={t(
                        'episodesList.spoilerGateReasonEpisodeNotWatched'
                      )}
                    >
                      <div className="episodes-table__synopsis-preview">
                        {episode.synopsis}
                      </div>
                    </SpoilerGate>
                  )}

                  {/* Comments section */}
                  {expandedEpisode === episode.id && (
                    <div className="episodes-table__comments">
                      {episode.synopsis && (
                        <SpoilerGate
                          hide={!isWatched}
                          cacheKey={`ep-synopsis-full-${episode.id}`}
                          reason={t(
                            'episodesList.spoilerGateReasonEpisodeNotWatched'
                          )}
                        >
                          <p className="episodes-table__synopsis">
                            {episode.synopsis}
                          </p>
                        </SpoilerGate>
                      )}
                      <CommentsList
                        episodeId={episode.id}
                        initialComments={episode.comments || []}
                        compact={true}
                        placeholder={t('episodesList.commentsPlaceholder')}
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
        title={
          editingEpisode
            ? t('episodesList.modalEditTitle')
            : t('episodesList.modalNewTitle')
        }
        open={isModalOpen}
        onCancel={handleCloseModal}
        footer={null}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label={t('episodesList.fieldEpisodeNumber')}
            name="episodeNumber"
            rules={[
              {
                required: true,
                message: t('episodesList.requiredEpisodeNumber'),
              },
            ]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label={t('episodesList.fieldEpisodeTitle')} name="title">
            <Input placeholder={t('episodesList.hintTitle')} />
          </Form.Item>

          <Form.Item label={t('episodesList.fieldMinutes')} name="duration">
            <InputNumber min={1} style={{ width: '100%' }} placeholder="45" />
          </Form.Item>

          <Form.Item label={t('episodesList.fieldSynopsis')} name="synopsis">
            <TextArea rows={4} placeholder={t('episodesList.hintSynopsis')} />
          </Form.Item>

          <div className="episodes-list__embed-section">
            <h5 className="episodes-list__embed-title">
              {t('episodesList.embedSectionTitle')}
            </h5>
            <p className="episodes-list__embed-help">
              {t('episodesList.embedHelpText')}
            </p>
            <Form.Item
              label={t('episodesList.embedUrlLabel')}
              name="embedUrl"
              rules={[
                {
                  type: 'url',
                  message: t('episodesList.embedUrlInvalid'),
                  validateTrigger: 'onBlur',
                },
              ]}
            >
              <Input placeholder={t('episodesList.embedUrlPlaceholder')} />
            </Form.Item>
            <Form.Item
              label={t('episodesList.embedChannelNameLabel')}
              name="embedChannelName"
            >
              <Input
                placeholder={t('episodesList.embedChannelNamePlaceholder')}
              />
            </Form.Item>
            <Form.Item
              label={t('episodesList.embedChannelUrlLabel')}
              name="embedChannelUrl"
            >
              <Input
                placeholder={t('episodesList.embedChannelUrlPlaceholder')}
              />
            </Form.Item>
          </div>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Button onClick={handleCloseModal} style={{ marginRight: 8 }}>
              {t('episodesList.cancelButton')}
            </Button>
            <Button type="primary" htmlType="submit">
              {editingEpisode
                ? t('episodesList.saveButton')
                : t('episodesList.createButton')}
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <EpisodeNoteModal
        episodeId={noteEpisodeId}
        episodeLabel={(() => {
          const ep = episodes.find((e) => e.id === noteEpisodeId);
          if (!ep) return undefined;
          return ep.title
            ? `E${ep.episodeNumber} · ${ep.title}`
            : `E${ep.episodeNumber}`;
        })()}
        open={noteEpisodeId !== null}
        onClose={() => setNoteEpisodeId(null)}
        onNoteChange={(hasNote) => {
          if (noteEpisodeId === null) return;
          setEpisodesWithNotes((prev) => {
            const next = new Set(prev);
            if (hasNote) next.add(noteEpisodeId);
            else next.delete(noteEpisodeId);
            return next;
          });
        }}
      />
    </div>
  );
}
