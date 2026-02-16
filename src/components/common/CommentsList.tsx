'use client';

import { useState } from 'react';
import { Input, Button, Card, Empty } from 'antd';
import { CommentOutlined, ClockCircleOutlined } from '@ant-design/icons';
import './CommentsList.css';
import { useMessage } from '@/hooks/useMessage';

const { TextArea } = Input;

interface Comment {
  id: number;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CommentsListProps {
  seriesId?: number;
  seasonId?: number;
  episodeId?: number;
  initialComments?: Comment[];
  compact?: boolean; // Modo compacto para episodios
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
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        body: JSON.stringify({ content: newComment }),
      });

      if (!response.ok) throw new Error('Error al guardar');

      const savedComment = await response.json();
      setComments((prev) => [savedComment, ...prev]);
      setNewComment('');
      message.success('Comentario agregado');
    } catch (error) {
      message.error('Error al guardar el comentario');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (compact) {
    return (
      <div className="comments-list-compact">
        <div className="comments-list-compact__form">
          <TextArea
            rows={3}
            placeholder={placeholder}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            maxLength={1000}
            showCount
          />
          <Button
            type="primary"
            size="small"
            icon={<CommentOutlined />}
            onClick={handleSubmit}
            loading={isSubmitting}
            style={{ marginTop: '8px' }}
          >
            Agregar Comentario
          </Button>
        </div>

        {comments.length > 0 && (
          <div className="comments-list-compact__items">
            <h6
              style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}
            >
              💬 Comentarios ({comments.length})
            </h6>
            <div>
              {comments.map((comment) => (
                <div key={comment.id} className="comment-compact">
                  <p className="comment-compact__content">{comment.content}</p>
                  <span className="comment-compact__date">
                    <ClockCircleOutlined />{' '}
                    {formatDate(new Date(comment.createdAt))}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
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
          placeholder={placeholder}
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          maxLength={2000}
          showCount
        />
        <div className="comments-list__actions">
          <Button
            type="primary"
            icon={<CommentOutlined />}
            onClick={handleSubmit}
            loading={isSubmitting}
          >
            Agregar Comentario
          </Button>
        </div>
      </Card>

      <div className="comments-list__items">
        <h4 className="comments-list__title">
          Comentarios ({comments.length})
        </h4>

        {comments.length === 0 ? (
          <Empty description="No hay comentarios aún" />
        ) : (
          <div>
            {comments.map((comment) => (
              <Card key={comment.id} className="comment-card">
                <p className="comment-card__content">{comment.content}</p>
                <div className="comment-card__footer">
                  <span
                    style={{ color: 'var(--text-secondary)' }}
                    className="comment-card__date"
                  >
                    <ClockCircleOutlined />{' '}
                    {formatDate(new Date(comment.createdAt))}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
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
