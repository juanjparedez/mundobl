'use client';

import { useState } from 'react';
import { Input, Button, Card, Empty, Modal, Switch, Tag, Tooltip } from 'antd';
import {
  CommentOutlined,
  ClockCircleOutlined,
  FlagOutlined,
  LockOutlined,
} from '@ant-design/icons';
import { useSession } from 'next-auth/react';
import './CommentsList.css';
import { useMessage } from '@/hooks/useMessage';

const { TextArea } = Input;

interface CommentUser {
  id: string;
  name: string | null;
  image: string | null;
}

interface Comment {
  id: number;
  content: string;
  isPrivate?: boolean;
  createdAt: Date;
  updatedAt: Date;
  user?: CommentUser | null;
  userId?: string | null;
}

interface CommentsListProps {
  seriesId?: number;
  seasonId?: number;
  episodeId?: number;
  initialComments?: Comment[];
  compact?: boolean;
  placeholder?: string;
}

export function CommentsList({
  seriesId,
  seasonId,
  episodeId,
  initialComments = [],
  compact = false,
  placeholder = 'Escribe tus impresiones, opiniones o notas...',
}: CommentsListProps) {
  const message = useMessage();
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [newComment, setNewComment] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reportedIds, setReportedIds] = useState<Set<number>>(new Set());
  const [reportTarget, setReportTarget] = useState<number | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);

  const visibleComments = comments.filter(
    (c) =>
      !c.isPrivate || c.userId === currentUserId || c.user?.id === currentUserId
  );

  const getApiEndpoint = () => {
    if (episodeId) return `/api/episodes/${episodeId}/comments`;
    if (seasonId) return `/api/seasons/${seasonId}/comments`;
    if (seriesId) return `/api/series/${seriesId}/comments`;
    throw new Error('Debe proporcionar seriesId, seasonId o episodeId');
  };

  const handleSubmit = async () => {
    if (!newComment.trim()) {
      message.warning('Escribe un comentario primero');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(getApiEndpoint(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment, isPrivate }),
      });

      if (!response.ok) throw new Error('Error al guardar');

      const savedComment = await response.json();
      setComments((prev) => [savedComment, ...prev]);
      setNewComment('');
      setIsPrivate(false);
      message.success(
        isPrivate ? 'Nota privada agregada' : 'Comentario agregado'
      );
    } catch (error) {
      message.error('Error al guardar el comentario');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitReport = async () => {
    if (reportTarget == null) return;
    setReportSubmitting(true);
    try {
      const response = await fetch(`/api/comments/${reportTarget}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reportReason }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'No se pudo reportar');
      }
      setReportedIds((prev) => new Set(prev).add(reportTarget));
      message.success('Comentario reportado. Gracias por avisar.');
      setReportTarget(null);
      setReportReason('');
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : 'No se pudo reportar'
      );
    } finally {
      setReportSubmitting(false);
    }
  };

  const canReport = (comment: Comment) => {
    if (!currentUserId) return false;
    if (comment.isPrivate) return false;
    const authorId = comment.userId ?? comment.user?.id ?? null;
    if (authorId === currentUserId) return false;
    return !reportedIds.has(comment.id);
  };

  const reportModal = (
    <Modal
      title="Reportar comentario"
      open={reportTarget !== null}
      onOk={submitReport}
      onCancel={() => {
        setReportTarget(null);
        setReportReason('');
      }}
      okText="Reportar"
      cancelText="Cancelar"
      okButtonProps={{ danger: true, loading: reportSubmitting }}
      destroyOnHidden
    >
      <p style={{ color: 'var(--text-secondary)', marginTop: 0 }}>
        Contanos brevemente por qué (opcional). Un admin lo va a revisar.
      </p>
      <TextArea
        rows={3}
        maxLength={500}
        showCount
        placeholder="Spam, contenido fuera de tema, datos personales..."
        value={reportReason}
        onChange={(e) => setReportReason(e.target.value)}
      />
    </Modal>
  );

  if (compact) {
    return (
      <div className="comments-list-compact">
        <div className="comments-list-compact__form">
          <TextArea
            rows={3}
            placeholder={
              isPrivate ? 'Nota privada (solo vos la verás)...' : placeholder
            }
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            maxLength={1000}
            showCount
          />
          <div className="comments-list-compact__actions">
            <Tooltip title="Solo vos verás este comentario">
              <label className="comments-list__private-toggle">
                <Switch
                  size="small"
                  checked={isPrivate}
                  onChange={setIsPrivate}
                />
                <LockOutlined />
              </label>
            </Tooltip>
            <Button
              type="primary"
              size="small"
              icon={<CommentOutlined />}
              onClick={handleSubmit}
              loading={isSubmitting}
            >
              {isPrivate ? 'Nota Privada' : 'Comentar'}
            </Button>
          </div>
        </div>

        {visibleComments.length > 0 && (
          <div className="comments-list-compact__items">
            <h6
              style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}
            >
              Comentarios ({visibleComments.length})
            </h6>
            <div>
              {visibleComments.map((comment) => (
                <div
                  key={comment.id}
                  className={`comment-compact${comment.isPrivate ? ' comment-compact--private' : ''}`}
                >
                  <p className="comment-compact__content">{comment.content}</p>
                  <span className="comment-compact__date">
                    {comment.isPrivate && <LockOutlined />}
                    <ClockCircleOutlined />{' '}
                    {formatDate(new Date(comment.createdAt))}
                    {canReport(comment) && (
                      <Button
                        type="text"
                        size="small"
                        icon={<FlagOutlined />}
                        onClick={() => setReportTarget(comment.id)}
                        aria-label="Reportar comentario"
                        className="comment-compact__report"
                      />
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        {reportModal}
      </div>
    );
  }

  return (
    <div className="comments-list">
      <Card
        title={<h4 className="comments-list__title">Agregar Comentario</h4>}
        className="comments-list__form"
      >
        <TextArea
          rows={4}
          placeholder={
            isPrivate ? 'Nota privada (solo vos la verás)...' : placeholder
          }
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          maxLength={2000}
          showCount
        />
        <div className="comments-list__actions">
          <Tooltip title="Solo vos verás este comentario">
            <label className="comments-list__private-toggle">
              <Switch
                size="small"
                checked={isPrivate}
                onChange={setIsPrivate}
              />
              <LockOutlined />
              <span>Privado</span>
            </label>
          </Tooltip>
          <Button
            type="primary"
            icon={<CommentOutlined />}
            onClick={handleSubmit}
            loading={isSubmitting}
          >
            {isPrivate ? 'Guardar Nota Privada' : 'Agregar Comentario'}
          </Button>
        </div>
      </Card>

      <div className="comments-list__items">
        <h4 className="comments-list__title">
          Comentarios ({visibleComments.length})
        </h4>

        {visibleComments.length === 0 ? (
          <Empty description="No hay comentarios aún" />
        ) : (
          <div>
            {visibleComments.map((comment) => (
              <Card
                key={comment.id}
                className={`comment-card${comment.isPrivate ? ' comment-card--private' : ''}`}
              >
                <p className="comment-card__content">{comment.content}</p>
                <div className="comment-card__footer">
                  {comment.isPrivate && (
                    <Tag color="default" icon={<LockOutlined />}>
                      Privado
                    </Tag>
                  )}
                  <span
                    style={{ color: 'var(--text-secondary)' }}
                    className="comment-card__date"
                  >
                    <ClockCircleOutlined />{' '}
                    {formatDate(new Date(comment.createdAt))}
                  </span>
                  {canReport(comment) && (
                    <Button
                      type="text"
                      size="small"
                      icon={<FlagOutlined />}
                      onClick={() => setReportTarget(comment.id)}
                      className="comment-card__report"
                    >
                      Reportar
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
      {reportModal}
    </div>
  );
}

function formatDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return 'Hoy';
  if (days === 1) return 'Ayer';
  if (days < 7) return `Hace ${days} días`;
  if (days < 30) return `Hace ${Math.floor(days / 7)} semanas`;
  if (days < 365) return `Hace ${Math.floor(days / 30)} meses`;

  return date.toLocaleDateString('es-ES');
}
