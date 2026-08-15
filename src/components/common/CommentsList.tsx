'use client';

import { useState } from 'react';
import { Input, Button, Empty, Modal, Switch, Tag, Tooltip, Avatar } from 'antd';
import {
  CommentOutlined,
  ClockCircleOutlined,
  FlagOutlined,
  LockOutlined,
  UserOutlined,
  SendOutlined,
  CloseOutlined,
  CrownOutlined,
} from '@ant-design/icons';
import { useSession } from 'next-auth/react';
import './CommentsList.css';
import { useMessage } from '@/hooks/useMessage';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { interpolateMessage } from '@/lib/i18n-format';
import { formatPublicName } from '@/lib/user-display';
import type { TranslationKey } from '@/i18n/messages';

const { TextArea } = Input;

interface CommentUser {
  id: string;
  name: string | null;
  nickname?: string | null;
  image: string | null;
  role?: string | null;
}

export interface CommentItemData {
  id: number;
  content: string;
  isPrivate?: boolean;
  parentId?: number | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  user?: CommentUser | null;
  userId?: string | null;
  replies?: CommentItemData[];
}

interface CommentsListProps {
  seriesId?: number;
  seasonId?: number;
  episodeId?: number;
  initialComments?: CommentItemData[];
  compact?: boolean;
  placeholder?: string;
}

export function CommentsList({
  seriesId,
  seasonId,
  episodeId,
  initialComments = [],
  placeholder,
}: CommentsListProps) {
  const { t } = useLocale();
  const message = useMessage();
  const { data: session } = useSession();
  const defaultPlaceholder = placeholder ?? t('commentsList.placeholderPublic');
  const currentUserId = session?.user?.id;
  const [comments, setComments] = useState<CommentItemData[]>(initialComments);
  const [newComment, setNewComment] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reportedIds, setReportedIds] = useState<Set<number>>(new Set());
  const [reportTarget, setReportTarget] = useState<number | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);

  // Estado para respuesta inline
  const [replyingToId, setReplyingToId] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  // Filtrar comentarios privados de otros usuarios
  const filterVisible = (items: CommentItemData[]): CommentItemData[] => {
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

  const getApiEndpoint = () => {
    if (episodeId) return `/api/episodes/${episodeId}/comments`;
    if (seasonId) return `/api/seasons/${seasonId}/comments`;
    if (seriesId) return `/api/series/${seriesId}/comments`;
    throw new Error(t('commentsList.errorMissingId'));
  };

  const handleSubmit = async () => {
    if (!newComment.trim()) {
      message.warning(t('commentsList.warningEmpty'));
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(getApiEndpoint(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment, isPrivate }),
      });

      if (!response.ok) throw new Error(t('commentsList.errorSaving'));

      const savedComment = await response.json();
      setComments((prev) => [savedComment, ...prev]);
      setNewComment('');
      setIsPrivate(false);
      message.success(
        isPrivate
          ? t('commentsList.successPrivate')
          : t('commentsList.successPublic')
      );
    } catch (error) {
      message.error(t('commentsList.errorSave'));
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReplySubmit = async (parentId: number) => {
    if (!replyContent.trim()) {
      message.warning(t('commentsList.warningEmpty'));
      return;
    }

    setIsSubmittingReply(true);
    try {
      const response = await fetch(getApiEndpoint(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: replyContent,
          isPrivate: false,
          parentId,
        }),
      });

      if (!response.ok) throw new Error(t('commentsList.errorSaving'));

      const savedReply = await response.json();

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

      setReplyingToId(null);
      setReplyContent('');
      message.success(t('commentsList.successPublic'));
    } catch (error) {
      message.error(t('commentsList.errorSave'));
      console.error(error);
    } finally {
      setIsSubmittingReply(false);
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
        throw new Error(data.error || t('commentsList.errorReporting'));
      }
      setReportedIds((prev) => new Set(prev).add(reportTarget));
      message.success(t('commentsList.reportedSuccess'));
      setReportTarget(null);
      setReportReason('');
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : t('commentsList.reportError')
      );
    } finally {
      setReportSubmitting(false);
    }
  };

  const canReport = (comment: CommentItemData) => {
    if (!currentUserId) return false;
    if (comment.isPrivate) return false;
    const authorId = comment.userId ?? comment.user?.id ?? null;
    if (authorId === currentUserId) return false;
    return !reportedIds.has(comment.id);
  };

  const renderRoleBadge = (role?: string | null) => {
    if (role === 'ADMIN') {
      return (
        <Tag
          color="gold"
          icon={<CrownOutlined />}
          className="comment-item__role-tag"
        >
          Admin
        </Tag>
      );
    }
    if (role === 'MODERATOR') {
      return (
        <Tag color="blue" className="comment-item__role-tag">
          Mod
        </Tag>
      );
    }
    return null;
  };

  const reportModal = (
    <Modal
      title={t('commentsList.reportModalTitle')}
      open={reportTarget !== null}
      onOk={submitReport}
      onCancel={() => {
        setReportTarget(null);
        setReportReason('');
      }}
      okText={t('commentsList.reportButton')}
      cancelText={t('commentsList.cancelButton')}
      okButtonProps={{ danger: true, loading: reportSubmitting }}
      destroyOnHidden
    >
      <p style={{ color: 'var(--text-secondary)', marginTop: 0 }}>
        {t('commentsList.reportModalHint')}
      </p>
      <TextArea
        rows={3}
        maxLength={500}
        showCount
        placeholder={t('commentsList.reportPlaceholder')}
        value={reportReason}
        onChange={(e) => setReportReason(e.target.value)}
      />
    </Modal>
  );

  return (
    <div className="comments-list">
      {/* Compositor moderno */}
      <div className="comments-list__composer">
        <TextArea
          rows={3}
          placeholder={
            isPrivate
              ? t('commentsList.placeholderPrivate')
              : defaultPlaceholder
          }
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          maxLength={2000}
          showCount
          className="comments-list__textarea"
        />
        <div className="comments-list__actions">
          <Tooltip title={t('commentsList.tooltipPrivate')}>
            <label className="comments-list__private-toggle">
              <Switch
                size="small"
                checked={isPrivate}
                onChange={setIsPrivate}
              />
              <LockOutlined />
              <span>{t('commentsList.privateLabel')}</span>
            </label>
          </Tooltip>
          <Button
            type="primary"
            icon={<CommentOutlined />}
            onClick={handleSubmit}
            loading={isSubmitting}
          >
            {isPrivate
              ? t('commentsList.savePrivateButton')
              : t('commentsList.addButton')}
          </Button>
        </div>
      </div>

      {/* Feed de comentarios con respuestas */}
      <div className="comments-list__items">
        <div className="comments-list__header">
          <h4 className="comments-list__title">
            {interpolateMessage(t('commentsList.listTitle'), {
              n: String(visibleComments.length),
            })}
          </h4>
        </div>

        {visibleComments.length === 0 ? (
          <Empty description={t('commentsList.emptyText')} />
        ) : (
          <div className="comments-list__feed">
            {visibleComments.map((comment) => (
              <article key={comment.id} className="comment-list-thread">
                <div
                  className={`comment-list-item${comment.isPrivate ? ' comment-list-item--private' : ''}`}
                >
                  <div className="comment-list-item__header">
                    <Avatar
                      src={comment.user?.image}
                      icon={!comment.user?.image ? <UserOutlined /> : undefined}
                      size={28}
                      className="comment-list-item__avatar"
                    />
                    <div className="comment-list-item__meta">
                      <div className="comment-list-item__author-row">
                        <span className="comment-list-item__author">
                          {formatPublicName(comment.user)}
                        </span>
                        {renderRoleBadge(comment.user?.role)}
                        {comment.isPrivate && (
                          <Tag color="default" icon={<LockOutlined />}>
                            {t('commentsList.privateLabel')}
                          </Tag>
                        )}
                      </div>
                      <span className="comment-list-item__date">
                        <ClockCircleOutlined />{' '}
                        {formatDate(new Date(comment.createdAt), t)}
                      </span>
                    </div>
                  </div>

                  <p className="comment-list-item__content">{comment.content}</p>

                  <div className="comment-list-item__actions">
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
                        className="comment-list-item__reply-trigger"
                      >
                        Responder
                      </Button>
                    )}
                    {canReport(comment) && (
                      <Button
                        type="text"
                        size="small"
                        icon={<FlagOutlined />}
                        onClick={() => setReportTarget(comment.id)}
                        className="comment-list-item__report"
                        title={t('commentsList.reportButton')}
                      />
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

                {/* Hilo de respuestas */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="comment-list-replies">
                    {comment.replies.map((reply) => (
                      <div
                        key={reply.id}
                        className={`comment-list-item comment-list-item--reply${reply.isPrivate ? ' comment-list-item--reply--private' : ''}`}
                      >
                        <div className="comment-list-item__header">
                          <Avatar
                            src={reply.user?.image}
                            icon={
                              !reply.user?.image ? <UserOutlined /> : undefined
                            }
                            size={22}
                            className="comment-list-item__avatar comment-list-item__avatar--small"
                          />
                          <div className="comment-list-item__meta">
                            <div className="comment-list-item__author-row">
                              <span className="comment-list-item__author">
                                {formatPublicName(reply.user)}
                              </span>
                              {renderRoleBadge(reply.user?.role)}
                            </div>
                            <span className="comment-list-item__date">
                              <ClockCircleOutlined />{' '}
                              {formatDate(new Date(reply.createdAt), t)}
                            </span>
                          </div>
                        </div>
                        <p className="comment-list-item__content">{reply.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
      {reportModal}
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
