'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Tabs,
  Button,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  Timeline,
  Avatar,
  Empty,
  Image,
} from 'antd';
import {
  PlusOutlined,
  LikeOutlined,
  LikeFilled,
  BugOutlined,
  BulbOutlined,
  RocketOutlined,
  CheckCircleOutlined,
  UserOutlined,
  PictureOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { useSession } from 'next-auth/react';
import { PageTitle } from '@/components/common/PageTitle/PageTitle';
import { useMessage } from '@/hooks/useMessage';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { interpolateMessage } from '@/lib/i18n-format';
import './FeedbackClient.css';

interface FeatureRequestUser {
  id: string;
  name: string | null;
  image: string | null;
}

interface FeatureRequestImage {
  id: number;
  url: string;
}

interface FeatureRequestCommentUser {
  id: string;
  name: string | null;
  image: string | null;
  role: string;
}

interface FeatureRequestComment {
  id: number;
  body: string;
  createdAt: string;
  user: FeatureRequestCommentUser;
}

interface FeatureRequest {
  id: number;
  title: string;
  description: string | null;
  type: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  user: FeatureRequestUser | null;
  _count: { votes: number; comments: number };
  votes: Array<{ userId: string }>;
  images?: FeatureRequestImage[];
}

interface ChangelogEntry {
  version: string;
  items: string[];
}

interface PendingImage {
  file: File;
  preview: string;
}

export function FeedbackClient() {
  const message = useMessage();
  const { data: session } = useSession();
  const { t, locale } = useLocale();

  const TYPE_CONFIG: Record<
    string,
    { color: string; label: string; icon: React.ReactNode }
  > = {
    bug: { color: 'red', label: t('feedback.typeBug'), icon: <BugOutlined /> },
    feature: {
      color: 'blue',
      label: t('feedback.typeFeature'),
      icon: <RocketOutlined />,
    },
    idea: {
      color: 'purple',
      label: t('feedback.typeIdea'),
      icon: <BulbOutlined />,
    },
  };

  const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
    pendiente: { color: 'default', label: t('feedback.statusPendiente') },
    en_progreso: { color: 'processing', label: t('feedback.statusEnProgreso') },
    completado: { color: 'success', label: t('feedback.statusCompletado') },
    descartado: { color: 'error', label: t('feedback.statusDescartado') },
  };
  const [requests, setRequests] = useState<FeatureRequest[]>([]);
  const [_loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [form] = Form.useForm();
  // comments state: requestId -> list; null = not loaded; loading = Set of ids
  const [comments, setComments] = useState<Record<number, FeatureRequestComment[]>>({});
  const [commentsLoading, setCommentsLoading] = useState<Set<number>>(new Set());
  const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set());
  const [commentTexts, setCommentTexts] = useState<Record<number, string>>({});
  const [commentSubmitting, setCommentSubmitting] = useState<Set<number>>(new Set());
  const searchParams = useSearchParams();
  const prefilledRef = useRef(false);
  const [activeTab, setActiveTab] = useState<string>(
    searchParams.get('tab') ?? 'requests'
  );

  const isAdmin = session?.user?.role === 'ADMIN';
  const userId = session?.user?.id;
  const [changelog, setChangelog] = useState<ChangelogEntry[]>([]);
  const [buildId, setBuildId] = useState<string | null>(null);

  useEffect(() => {
    if (prefilledRef.current) return;
    const type = searchParams.get('type');
    const title = searchParams.get('title');
    const description = searchParams.get('description');
    if (!type && !title && !description) return;
    prefilledRef.current = true;
    form.setFieldsValue({
      type: type ?? 'bug',
      title: title ?? '',
      description: description ?? '',
    });
    setModalOpen(true);
  }, [searchParams, form]);

  useEffect(() => {
    fetch('/api/changelog')
      .then((res) => res.json())
      .then((data) => {
        setChangelog(data.entries || []);
        setBuildId(data.buildId || null);
      })
      .catch(() => {});
  }, []);

  const fetchRequests = useCallback(async () => {
    try {
      const response = await fetch('/api/feature-requests');
      if (response.ok) {
        const data = await response.json();
        setRequests(data);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Cleanup previews on unmount
  useEffect(() => {
    return () => {
      pendingImages.forEach((img) => URL.revokeObjectURL(img.preview));
    };
  }, [pendingImages]);

  const loadComments = useCallback(async (requestId: number) => {
    if (commentsLoading.has(requestId) || comments[requestId]) return;
    setCommentsLoading((prev) => new Set(prev).add(requestId));
    try {
      const res = await fetch(`/api/feature-requests/${requestId}/comments`);
      if (res.ok) {
        const data: FeatureRequestComment[] = await res.json();
        setComments((prev) => ({ ...prev, [requestId]: data }));
      }
    } catch {
      // silently fail
    } finally {
      setCommentsLoading((prev) => {
        const next = new Set(prev);
        next.delete(requestId);
        return next;
      });
    }
  }, [commentsLoading, comments]);

  const toggleComments = (requestId: number) => {
    setExpandedComments((prev) => {
      const next = new Set(prev);
      if (next.has(requestId)) {
        next.delete(requestId);
      } else {
        next.add(requestId);
        loadComments(requestId);
      }
      return next;
    });
  };

  const handleCommentSubmit = async (requestId: number) => {
    const body = commentTexts[requestId]?.trim();
    if (!body) return;
    setCommentSubmitting((prev) => new Set(prev).add(requestId));
    try {
      const res = await fetch(`/api/feature-requests/${requestId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      });
      if (!res.ok) throw new Error();
      const newComment: FeatureRequestComment = await res.json();
      setComments((prev) => ({
        ...prev,
        [requestId]: [...(prev[requestId] ?? []), newComment],
      }));
      setCommentTexts((prev) => ({ ...prev, [requestId]: '' }));
      message.success(t('feedback.commentSuccess'));
    } catch {
      message.error(t('feedback.commentError'));
    } finally {
      setCommentSubmitting((prev) => {
        const next = new Set(prev);
        next.delete(requestId);
        return next;
      });
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          const preview = URL.createObjectURL(file);
          setPendingImages((prev) => [...prev, { file, preview }]);
        }
      }
    }
  };

  const removePendingImage = (index: number) => {
    setPendingImages((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const uploadImages = async (images: PendingImage[]): Promise<string[]> => {
    const urls: string[] = [];
    for (const img of images) {
      const formData = new FormData();
      formData.append('file', img.file);
      formData.append('folder', 'feedback');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Error al subir imagen');
      }

      const result = await response.json();
      urls.push(result.url);
    }
    return urls;
  };

  const handleCreate = async (values: {
    title: string;
    description?: string;
    type: string;
  }) => {
    setSubmitting(true);
    try {
      let imageUrls: string[] = [];
      if (pendingImages.length > 0) {
        imageUrls = await uploadImages(pendingImages);
      }

      const response = await fetch('/api/feature-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, imageUrls }),
      });

      if (!response.ok) throw new Error('Error al crear');

      const newRequest = await response.json();
      setRequests((prev) => [newRequest, ...prev]);
      setModalOpen(false);
      form.resetFields();
      pendingImages.forEach((img) => URL.revokeObjectURL(img.preview));
      setPendingImages([]);
      message.success(t('feedback.successCreated'));
    } catch (error) {
      message.error(t('feedback.errorCreate'));
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (requestId: number) => {
    try {
      const response = await fetch(`/api/feature-requests/${requestId}/vote`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Error al votar');

      const { voted } = await response.json();

      setRequests((prev) =>
        prev.map((r) => {
          if (r.id !== requestId) return r;
          return {
            ...r,
            _count: {
              votes: voted ? r._count.votes + 1 : r._count.votes - 1,
            },
            votes: voted
              ? [...r.votes, { userId: userId! }]
              : r.votes.filter((v) => v.userId !== userId),
          };
        })
      );
    } catch (error) {
      message.error('Error al votar');
      console.error(error);
    }
  };

  const handleStatusChange = async (requestId: number, status: string) => {
    try {
      const response = await fetch(`/api/feature-requests/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) throw new Error('Error al actualizar');

      const updated = await response.json();
      setRequests((prev) =>
        prev.map((r) => (r.id === requestId ? updated : r))
      );
      message.success(t('feedback.successStatusUpdated'));
    } catch (error) {
      message.error(t('feedback.errorStatusUpdate'));
      console.error(error);
    }
  };

  const handleDelete = async (requestId: number) => {
    try {
      const response = await fetch(`/api/feature-requests/${requestId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Error al eliminar');

      setRequests((prev) => prev.filter((r) => r.id !== requestId));
      message.success(t('feedback.successDeleted'));
    } catch (error) {
      message.error(t('feedback.errorDelete'));
      console.error(error);
    }
  };

  const activeRequests = requests.filter((r) => r.status !== 'completado');
  const completedRequests = requests
    .filter((r) => r.status === 'completado')
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

  const renderRequestCard = (request: FeatureRequest) => {
    const typeConfig = TYPE_CONFIG[request.type] || TYPE_CONFIG.idea;
    const statusConfig =
      STATUS_CONFIG[request.status] || STATUS_CONFIG.pendiente;
    const hasVoted = userId
      ? request.votes.some((v) => v.userId === userId)
      : false;

    return (
      <div key={request.id}>
      <div className="feedback-card">
        <div className="feedback-card__header">
          <h4 className="feedback-card__title">{request.title}</h4>
          <div className="feedback-card__tags">
            <Tag icon={typeConfig.icon} color={typeConfig.color}>
              {typeConfig.label}
            </Tag>
            <Tag color={statusConfig.color}>{statusConfig.label}</Tag>
          </div>
        </div>

        {request.description && (
          <p className="feedback-card__description">{request.description}</p>
        )}

        {request.images && request.images.length > 0 && (
          <div className="feedback-card__images">
            <Image.PreviewGroup>
              {request.images.map((img) => (
                <Image
                  key={img.id}
                  src={img.url}
                  alt="Adjunto"
                  width={120}
                  height={80}
                  style={{ objectFit: 'cover', borderRadius: 6 }}
                />
              ))}
            </Image.PreviewGroup>
          </div>
        )}

        <div className="feedback-card__footer">
          <div className="feedback-card__meta">
            {request.user && (
              <>
                <Avatar
                  src={request.user.image}
                  icon={!request.user.image ? <UserOutlined /> : undefined}
                  size={20}
                />
                <span>{request.user.name}</span>
              </>
            )}
            <span>
              {new Date(request.createdAt).toLocaleDateString(locale)}
            </span>
          </div>

          <div className="feedback-card__actions">
            {userId && (
              <Button
                type={hasVoted ? 'primary' : 'default'}
                size="small"
                icon={hasVoted ? <LikeFilled /> : <LikeOutlined />}
                onClick={() => handleVote(request.id)}
              >
                {request._count.votes}
              </Button>
            )}

            {isAdmin && (
              <Select
                value={request.status}
                size="small"
                style={{ width: 130 }}
                onChange={(value) => handleStatusChange(request.id, value)}
                options={Object.entries(STATUS_CONFIG).map(
                  ([value, config]) => ({
                    value,
                    label: config.label,
                  })
                )}
              />
            )}

            {isAdmin && (
              <Button
                danger
                size="small"
                onClick={() => handleDelete(request.id)}
              >
                {t('feedback.deleteButton')}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Hilo de comentarios: visible solo para el dueño y admins */}
      {userId && (request.user?.id === userId || isAdmin) && renderCommentThread(request)}
      </div>
    );
  };

  const renderCommentThread = (request: FeatureRequest) => {
    const isExpanded = expandedComments.has(request.id);
    const isLoading = commentsLoading.has(request.id);
    const threadComments = comments[request.id];
    const commentCount = request._count.comments;

    return (
      <div className="feedback-card__comments">
        <button
          className="feedback-card__comments-toggle"
          onClick={() => toggleComments(request.id)}
        >
          <span>
            {commentCount > 0
              ? interpolateMessage(t('feedback.commentsCount'), { n: String(commentCount) })
              : t('feedback.commentsTitle')}
          </span>
          <span className={`feedback-card__comments-chevron${isExpanded ? ' expanded' : ''}`}>›</span>
        </button>

        {isExpanded && (
          <div className="feedback-card__comments-body">
            {isLoading ? (
              <div className="feedback-card__comments-loading">…</div>
            ) : threadComments && threadComments.length > 0 ? (
              <div className="feedback-card__comments-list">
                {threadComments.map((c) => (
                  <div key={c.id} className={`feedback-comment${c.user.role === 'ADMIN' || c.user.role === 'MODERATOR' ? ' feedback-comment--admin' : ''}`}>
                    <div className="feedback-comment__header">
                      <Avatar
                        src={c.user.image}
                        icon={!c.user.image ? <UserOutlined /> : undefined}
                        size={20}
                      />
                      <span className="feedback-comment__name">{c.user.name}</span>
                      {(c.user.role === 'ADMIN' || c.user.role === 'MODERATOR') && (
                        <span className="feedback-comment__admin-badge">{t('feedback.adminBadge')}</span>
                      )}
                      <span className="feedback-comment__date">
                        {new Date(c.createdAt).toLocaleDateString(locale)}
                      </span>
                    </div>
                    <p className="feedback-comment__body">{c.body}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="feedback-card__comments-empty">{t('feedback.commentsEmpty')}</p>
            )}

            {session?.user && (
              <div className="feedback-card__comment-input">
                <Input.TextArea
                  rows={2}
                  maxLength={2000}
                  value={commentTexts[request.id] ?? ''}
                  onChange={(e) =>
                    setCommentTexts((prev) => ({ ...prev, [request.id]: e.target.value }))
                  }
                  placeholder={t('feedback.commentPlaceholder')}
                />
                <Button
                  size="small"
                  type="primary"
                  loading={commentSubmitting.has(request.id)}
                  onClick={() => handleCommentSubmit(request.id)}
                  disabled={!commentTexts[request.id]?.trim()}
                >
                  {t('feedback.commentSubmit')}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const myRequests = requests.filter((r) => userId && r.user?.id === userId);

  const tabItems = [
    {
      key: 'requests',
      label: t('feedback.tabRequests'),
      children: (
        <>
          <div className="feedback-page__header">
            <span style={{ color: 'var(--text-secondary)' }}>
              {interpolateMessage(t('feedback.activeCount'), {
                n: String(activeRequests.length),
              })}
            </span>
            {session?.user && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setModalOpen(true)}
              >
                {t('feedback.newRequest')}
              </Button>
            )}
          </div>
          {activeRequests.length > 0 ? (
            <div className="feedback-list">
              {activeRequests.map(renderRequestCard)}
            </div>
          ) : (
            <Empty description={t('feedback.emptyRequests')} />
          )}
        </>
      ),
    },
    {
      key: 'changelog',
      label: 'Changelog',
      children: (
        <div className="changelog-tab">
          {buildId && (
            <div className="changelog-version-badge">
              {t('feedback.currentVersion')} <code>{buildId}</code>
            </div>
          )}
          {changelog.length > 0 ? (
            <div className="changelog-entries">
              {changelog.map((entry, i) => (
                <div key={i} className="changelog-entry">
                  <div className="changelog-entry__header">
                    <Tag color={i === 0 ? 'blue' : 'default'}>
                      {entry.version}
                    </Tag>
                  </div>
                  <ul className="changelog-entry__list">
                    {entry.items.map((item, j) => (
                      <li key={j}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <Empty description={t('feedback.emptyChangelog')} />
          )}
          {completedRequests.length > 0 && (
            <>
              <h4 className="changelog-section-title">
                {t('feedback.completedSection')}
              </h4>
              <Timeline
                items={completedRequests.map((r) => ({
                  color: 'green',
                  dot: <CheckCircleOutlined />,
                  children: (
                    <div className="changelog-item">
                      <div className="changelog-item__title">
                        <Tag
                          icon={TYPE_CONFIG[r.type]?.icon}
                          color={TYPE_CONFIG[r.type]?.color}
                        >
                          {TYPE_CONFIG[r.type]?.label}
                        </Tag>
                        {r.title}
                      </div>
                      {r.description && (
                        <div className="changelog-item__description">
                          {r.description}
                        </div>
                      )}
                      <div
                        style={{
                          fontSize: 'var(--font-size-sm)',
                          color: 'var(--text-tertiary)',
                          marginTop: 4,
                        }}
                      >
                        {new Date(r.updatedAt).toLocaleDateString(locale)}
                      </div>
                    </div>
                  ),
                }))}
              />
            </>
          )}
        </div>
      ),
    },
    ...(session?.user
      ? [
          {
            key: 'mis-solicitudes',
            label: t('feedback.tabMySolicitudes'),
            children: (
              <div className="feedback-list">
                {myRequests.length > 0 ? (
                  myRequests.map(renderRequestCard)
                ) : (
                  <Empty description={t('feedback.myRequestsEmpty')} />
                )}
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="feedback-page">
      <PageTitle title="Feedback" />
      <Tabs items={tabItems} activeKey={activeTab} onChange={setActiveTab} />

      <Modal
        title={t('feedback.newRequest')}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          pendingImages.forEach((img) => URL.revokeObjectURL(img.preview));
          setPendingImages([]);
        }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item
            name="type"
            label={t('feedback.formFieldType')}
            rules={[
              { required: true, message: t('feedback.formRequiredType') },
            ]}
          >
            <Select
              options={[
                { label: 'Bug', value: 'bug' },
                { label: 'Feature', value: 'feature' },
                { label: 'Idea', value: 'idea' },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="title"
            label={t('feedback.formFieldTitle')}
            rules={[
              { required: true, message: t('feedback.formRequiredTitle') },
            ]}
          >
            <Input maxLength={200} />
          </Form.Item>

          <Form.Item
            name="description"
            label={t('feedback.formFieldDescription')}
          >
            <Input.TextArea
              rows={3}
              maxLength={1000}
              onPaste={handlePaste}
              placeholder={t('feedback.formDescriptionPlaceholder')}
            />
          </Form.Item>

          {pendingImages.length > 0 && (
            <div className="feedback-pending-images">
              {pendingImages.map((img, index) => (
                <div key={index} className="feedback-pending-image">
                  {/* blob: URLs (URL.createObjectURL) no son soportadas por next/image */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.preview} alt={`Preview ${index + 1}`} />
                  <Button
                    type="text"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    className="feedback-pending-image__remove"
                    onClick={() => removePendingImage(index)}
                  />
                </div>
              ))}
            </div>
          )}

          <div className="feedback-image-hint">
            <PictureOutlined /> {t('feedback.formDescriptionHint')}
          </div>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Button type="primary" htmlType="submit" loading={submitting}>
              {t('feedback.createButton')}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
