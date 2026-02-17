'use client';

import { useState } from 'react';
import { Input, Button, Card, Empty, Avatar } from 'antd';
import {
  CommentOutlined,
  ClockCircleOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useSession } from 'next-auth/react';
import './CommentsSection.css';
import { useMessage } from '@/hooks/useMessage';

const { TextArea } = Input;

interface CommentUser {
  id: string;
  name: string | null;
  image: string | null;
}

interface CommentsSectionProps {
  seriesId: number;
  comments: Array<{
    id: number;
    content: string;
    createdAt: Date;
    updatedAt: Date;
    user?: CommentUser | null;
  }>;
}

export function CommentsSection({
  seriesId,
  comments: initialComments,
}: CommentsSectionProps) {
  const message = useMessage();
  const { data: session } = useSession();
  const [comments, setComments] = useState(initialComments);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!newComment.trim()) {
      message.warning('Escribe un comentario primero');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/series/${seriesId}/comments`, {
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

  return (
    <div className="comments-section">
      {session?.user ? (
        <Card
          title={
            <h4 className="comments-section__title">Agregar Comentario</h4>
          }
          className="comments-section__form"
        >
          <TextArea
            rows={4}
            placeholder="Escribe tus impresiones, opiniones o notas sobre esta serie..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            maxLength={2000}
            showCount
          />
          <div className="comments-section__actions">
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
      ) : (
        <Card className="comments-section__login-prompt">
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>
            Inicia sesión para dejar un comentario
          </p>
        </Card>
      )}

      <div className="comments-section__list">
        <h4 className="comments-section__title">
          Comentarios ({comments.length})
        </h4>

        {comments.length === 0 ? (
          <Empty description="No hay comentarios aún" />
        ) : (
          <div className="comments-section__items">
            {comments.map((comment) => (
              <Card key={comment.id} className="comment-card">
                <p className="comment-card__content">{comment.content}</p>
                <div className="comment-card__footer">
                  {comment.user && (
                    <span className="comment-card__author">
                      <Avatar
                        src={comment.user.image}
                        icon={
                          !comment.user.image ? <UserOutlined /> : undefined
                        }
                        size={20}
                      />
                      <span>{comment.user.name}</span>
                    </span>
                  )}
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
