'use client';

import { useState } from 'react';
import { Input, Button, Empty, Avatar, Switch, Tag, Tooltip } from 'antd';
import {
  CommentOutlined,
  ClockCircleOutlined,
  UserOutlined,
  LockOutlined,
  SendOutlined,
  CloseOutlined,
  CrownOutlined,
} from '@ant-design/icons';
import { useSession, signIn } from 'next-auth/react';
import './CommentsSection.css';
import { useMessage } from '@/hooks/useMessage';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { interpolateMessage } from '@/lib/i18n-format';
import { formatPublicName } from '@/lib/user-display';
import type { TranslationKey } from '@/i18n/messages';

const { TextArea } = Input;

interface CommentUser {
  id: string;
  name: string | null;
  nickname: string | null;
  image: string | null;
  role?: string | null;
}

export interface CommentData {
  id: number;
  content: string;
  isPrivate?: boolean;
  parentId?: number | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  user?: CommentUser | null;
  userId?: string | null;
  replies?: CommentData[];
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
  const [isPrivate, setIsPrivate] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem('comment-default-private') === 'true';
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estado para respuesta inline a un comentario
  const [replyingToId, setReplyingToId] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  // Filtrar comentarios privados de otros usuarios
  const filterVisible = (items: CommentData[]): CommentData[] => {
    return items
      .filter(
        (c) =>
          !c.isPrivate ||
          c.userId === currentUserId ||
          c.user?.id === currentUserId
      )
      .map((c) => ({
        ...c,
        replies: c.replies ? filterVisible(c.replies) : [],
      }));
  };

  const visibleComments = filterVisible(comments);

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

      const savedComment: CommentData = await response.json();
      setComments((prev) => [{ ...savedComment, replies: [] }, ...prev]);
      setNewComment('');
      setIsPrivate(
        typeof window !== 'undefined' &&
          window.localStorage.getItem('comment-default-private') === 'true'
      );
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

  const handleReplySubmit = async (parentId: number) => {
    if (!replyContent.trim()) {
      message.warning(t('comments.warningEmpty'));
      return;
    }

    setIsSubmittingReply(true);
    try {
      const response = await fetch(`/api/series/${seriesId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: replyContent,
          isPrivate: false,
          parentId,
        }),
      });

      if (!response.ok) throw new Error('Error al responder');

      const savedReply: CommentData = await response.json();
      setComments((prev) =>
        prev.map((c) => {
          if (c.id === parentId) {
            return {
              ...c,
              replies: [...(c.replies || []), savedReply],
            };
          }
          return c;
        })
      );
      setReplyContent('');
      setReplyingToId(null);
      message.success(t('comments.successPublic'));
    } catch (error) {
      message.error(t('comments.errorSave'));
      console.error(error);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const renderRoleBadge = (role?: string | null) => {
    if (role === 'ADMIN') {
      return (
        <Tag color="gold" className="comment-item__role-badge">
          <CrownOutlined /> Admin
        </Tag>
      );
    }
    if (role === 'MODERATOR') {
      return (
        <Tag color="blue" className="comment-item__role-badge">
          Mod
        </Tag>
      );
    }
    return null;
  };

  return (
    <div className="comments-section">
      {/* Formulario principal de comentario */}
      {session?.user ? (
        <div className="comments-composer">
          <div className="comments-composer__header">
            <Avatar
              src={session.user.image}
              icon={!session.user.image ? <UserOutlined /> : undefined}
              size={34}
              className="comments-composer__avatar"
            />
            <span className="comments-composer__user-name">
              {formatPublicName({
                name: session.user.name,
                nickname: (session.user as { nickname?: string }).nickname,
              })}
            </span>
          </div>

          <div className="comments-composer__input-box">
            <TextArea
              rows={3}
              placeholder={
                isPrivate
                  ? t('comments.placeholderPrivate')
                  : t('comments.placeholderPublic')
              }
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              maxLength={2000}
              showCount
              className="comments-composer__textarea"
            />
            <div className="comments-composer__actions">
              <Tooltip title={t('comments.tooltipPrivate')}>
                <label className="comments-composer__private-toggle">
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
                icon={<SendOutlined />}
                onClick={handleSubmit}
                loading={isSubmitting}
                className="comments-composer__submit"
              >
                {isPrivate
                  ? t('comments.savePrivateButton')
                  : t('comments.addButton')}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="comments-login-prompt">
          <p className="comments-login-prompt__text">
            {t('comments.loginPrompt')}
          </p>
          <Button type="primary" size="small" onClick={() => signIn('google')}>
            Iniciar sesión
          </Button>
        </div>
      )}

      {/* Lista de comentarios sin wrappers pesados */}
      <div className="comments-feed">
        {visibleComments.length === 0 ? (
          <Empty
            description={t('comments.emptyText')}
            className="comments-feed__empty"
          />
        ) : (
          <div className="comments-feed__threads">
            {visibleComments.map((comment) => (
              <article key={comment.id} className="comment-thread">
                {/* Comentario Padre */}
                <div
                  className={`comment-item${comment.isPrivate ? ' comment-item--private' : ''}`}
                >
                  <div className="comment-item__header">
                    <Avatar
                      src={comment.user?.image}
                      icon={!comment.user?.image ? <UserOutlined /> : undefined}
                      size={32}
                      className="comment-item__avatar"
                    />
                    <div className="comment-item__meta">
                      <div className="comment-item__author-row">
                        <span className="comment-item__author">
                          {formatPublicName(comment.user)}
                        </span>
                        {renderRoleBadge(comment.user?.role)}
                        {comment.isPrivate && (
                          <Tag
                            color="default"
                            icon={<LockOutlined />}
                            className="comment-item__private-tag"
                          >
                            {t('comments.privateLabel')}
                          </Tag>
                        )}
                      </div>
                      <span className="comment-item__date">
                        <ClockCircleOutlined />{' '}
                        {formatDate(new Date(comment.createdAt), t)}
                      </span>
                    </div>
                  </div>

                  <p className="comment-item__content">{comment.content}</p>

                  <div className="comment-item__actions">
                    {session?.user && !comment.isPrivate && (
                      <Button
                        type="text"
                        size="small"
                        icon={<CommentOutlined />}
                        onClick={() => {
                          setReplyingToId(
                            replyingToId === comment.id ? null : comment.id
                          );
                          setReplyContent('');
                        }}
                        className="comment-item__reply-trigger"
                      >
                        Responder
                      </Button>
                    )}
                  </div>

                  {/* Sub-formulario inline de respuesta */}
                  {replyingToId === comment.id && (
                    <div className="comment-reply-composer">
                      <TextArea
                        rows={2}
                        placeholder={`Respondiendo a ${formatPublicName(comment.user)}...`}
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        maxLength={1000}
                        showCount
                        autoFocus
                        className="comment-reply-composer__input"
                      />
                      <div className="comment-reply-composer__actions">
                        <Button
                          size="small"
                          icon={<CloseOutlined />}
                          onClick={() => {
                            setReplyingToId(null);
                            setReplyContent('');
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="primary"
                          size="small"
                          icon={<SendOutlined />}
                          onClick={() => handleReplySubmit(comment.id)}
                          loading={isSubmittingReply}
                        >
                          Responder
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Hilo de respuestas hijas */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="comment-replies">
                    {comment.replies.map((reply) => (
                      <div
                        key={reply.id}
                        className={`comment-item comment-item--reply${reply.isPrivate ? ' comment-item--reply--private' : ''}`}
                      >
                        <div className="comment-item__header">
                          <Avatar
                            src={reply.user?.image}
                            icon={
                              !reply.user?.image ? <UserOutlined /> : undefined
                            }
                            size={24}
                            className="comment-item__avatar comment-item__avatar--small"
                          />
                          <div className="comment-item__meta">
                            <div className="comment-item__author-row">
                              <span className="comment-item__author">
                                {formatPublicName(reply.user)}
                              </span>
                              {renderRoleBadge(reply.user?.role)}
                            </div>
                            <span className="comment-item__date">
                              <ClockCircleOutlined />{' '}
                              {formatDate(new Date(reply.createdAt), t)}
                            </span>
                          </div>
                        </div>
                        <p className="comment-item__content comment-item__content--reply">
                          {reply.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </article>
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
  if (days < 7)
    return interpolateMessage(t('common.daysAgo'), { n: String(days) });
  if (days < 30)
    return interpolateMessage(t('common.weeksAgo'), {
      n: String(Math.floor(days / 7)),
    });
  if (days < 365)
    return interpolateMessage(t('common.monthsAgo'), {
      n: String(Math.floor(days / 30)),
    });

  return date.toLocaleDateString();
}
