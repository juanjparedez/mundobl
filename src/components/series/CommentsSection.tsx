'use client';

import { useState } from 'react';
import { Input, Button, Card, Empty, Avatar, Switch, Tag, Tooltip } from 'antd';
import {
  CommentOutlined,
  ClockCircleOutlined,
  UserOutlined,
  LockOutlined,
} from '@ant-design/icons';
import { useSession } from 'next-auth/react';
import './CommentsSection.css';
import { useMessage } from '@/hooks/useMessage';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { interpolateMessage } from '@/lib/i18n-format';
import type { TranslationKey } from '@/i18n/messages';

const { TextArea } = Input;

interface CommentUser {
  id: string;
  name: string | null;
  image: string | null;
}

interface CommentData {
  id: number;
  content: string;
  isPrivate?: boolean;
  createdAt: Date;
  updatedAt: Date;
  user?: CommentUser | null;
  userId?: string | null;
}

interface CommentsSectionProps {
  seriesId: number;
  comments: CommentData[];
}

export function CommentsSection({
  seriesId,
  comments: initialComments,
}: CommentsSectionProps) {
  const message = useMessage();
  const { t } = useLocale();
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;
  const [comments, setComments] = useState<CommentData[]>(initialComments);
  const [newComment, setNewComment] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtrar comentarios privados de otros usuarios
  const visibleComments = comments.filter(
    (c) =>
      !c.isPrivate || c.userId === currentUserId || c.user?.id === currentUserId
  );

  const handleSubmit = async () => {
    if (!newComment.trim()) {
      message.warning(t('comments.warningEmpty'));
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/series/${seriesId}/comments`, {
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
        isPrivate ? t('comments.successPrivate') : t('comments.successPublic')
      );
    } catch (error) {
      message.error(t('comments.errorSave'));
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
            <h4 className="comments-section__title">{t('comments.addTitle')}</h4>
          }
          className="comments-section__form"
        >
          <TextArea
            rows={4}
            placeholder={
              isPrivate
                ? t('comments.placeholderPrivate')
                : t('comments.placeholderPublic')
            }
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            maxLength={2000}
            showCount
          />
          <div className="comments-section__actions">
            <Tooltip title={t('comments.tooltipPrivate')}>
              <label className="comments-section__private-toggle">
                <Switch
                  size="small"
                  checked={isPrivate}
                  onChange={setIsPrivate}
                />
                <LockOutlined />
                <span>{t('comments.privateLabel')}</span>
              </label>
            </Tooltip>
            <Button
              type="primary"
              icon={<CommentOutlined />}
              onClick={handleSubmit}
              loading={isSubmitting}
            >
              {isPrivate ? t('comments.savePrivateButton') : t('comments.addButton')}
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="comments-section__login-prompt">
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>
            {t('comments.loginPrompt')}
          </p>
        </Card>
      )}

      <div className="comments-section__list">
        <h4 className="comments-section__title">
          {interpolateMessage(t('comments.listTitle'), { n: String(visibleComments.length) })}
        </h4>

        {visibleComments.length === 0 ? (
          <Empty description={t('comments.emptyText')} />
        ) : (
          <div className="comments-section__items">
            {visibleComments.map((comment) => (
              <Card
                key={comment.id}
                className={`comment-card${comment.isPrivate ? ' comment-card--private' : ''}`}
              >
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
                  {comment.isPrivate && (
                    <Tag color="default" icon={<LockOutlined />}>
                      {t('comments.privateLabel')}
                    </Tag>
                  )}
                  <span
                    style={{ color: 'var(--text-secondary)' }}
                    className="comment-card__date"
                  >
                    <ClockCircleOutlined />{' '}
                    {formatDate(new Date(comment.createdAt), t)}
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

function formatDate(date: Date, t: (key: TranslationKey) => string): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return t('common.today');
  if (days === 1) return t('common.yesterday');
  if (days < 7) return interpolateMessage(t('common.daysAgo'), { n: String(days) });
  if (days < 30) return interpolateMessage(t('common.weeksAgo'), { n: String(Math.floor(days / 7)) });
  if (days < 365) return interpolateMessage(t('common.monthsAgo'), { n: String(Math.floor(days / 30)) });

  return date.toLocaleDateString();
}
