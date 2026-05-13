'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  CameraOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { useSession } from 'next-auth/react';
import { PageTitle } from '@/components/common/PageTitle/PageTitle';
import { PanelCard, Chip } from '@/components/design-system';
import { useMessage } from '@/hooks/useMessage';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { interpolateMessage } from '@/lib/i18n-format';
import { formatPublicName } from '@/lib/user-display';
import './FeedbackClient.css';

interface FeatureRequestUser {
  id: string;
  name: string | null;
  nickname: string | null;
  image: string | null;
}

interface FeatureRequestImage {
  id: number;
  url: string;
}

interface FeatureRequestCommentUser {
  id: string;
  name: string | null;
  nickname: string | null;
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

interface ChangelogItemEntry {
  body: string;
  category: string | null;
}

interface ChangelogEntry {
  version: string;
  label?: string | null;
  items: ChangelogItemEntry[];
}

interface PendingImage {
  file: File;
  preview: string;
}

export function FeedbackClient() {
  const { t, locale } = useLocale();
  const message = useMessage();
  const { data: session } = useSession();

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

  // El DB enum FeatureRequestStatus usa keys en ingles (OPEN/IN_PROGRESS/
  // COMPLETED/REJECTED). Antes este config tenia keys en espaniol y nunca
  // matcheaba — todo se renderizaba como "pendiente" por fallback.
  const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
    OPEN: { color: 'default', label: t('feedback.statusPendiente') },
    IN_PROGRESS: {
      color: 'processing',
      label: t('feedback.statusEnProgreso'),
    },
    COMPLETED: { color: 'success', label: t('feedback.statusCompletado') },
    REJECTED: { color: 'error', label: t('feedback.statusDescartado') },
  };
  const [requests, setRequests] = useState<FeatureRequest[]>([]);
  const [_loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [form] = Form.useForm();
  // comments state: requestId -> list; null = not loaded; loading = Set of ids
  const [comments, setComments] = useState<
    Record<number, FeatureRequestComment[]>
  >({});
  const [commentsLoading, setCommentsLoading] = useState<Set<number>>(
    new Set()
  );
  const [expandedComments, setExpandedComments] = useState<Set<number>>(
    new Set()
  );
  const [commentTexts, setCommentTexts] = useState<Record<number, string>>({});
  const [commentSubmitting, setCommentSubmitting] = useState<Set<number>>(
    new Set()
  );
  const searchParams = useSearchParams();
  const prefilledRef = useRef(false);
  const [activeTab, setActiveTab] = useState<string>(
    searchParams.get('tab') ?? 'requests'
  );

  const isAdmin = session?.user?.role === 'ADMIN';
  const userId = session?.user?.id;
  const [changelog, setChangelog] = useState<ChangelogEntry[]>([]);
  const [buildId, setBuildId] = useState<string | null>(null);

  // Filtros del tab "Ideas y Bugs". Status default: solo Pendiente +
  // En progreso (las cerradas/descartadas se muestran si user las activa).
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<Set<string>>(
    new Set(['bug', 'feature', 'idea'])
  );
  const [statusFilter, setStatusFilter] = useState<Set<string>>(
    new Set(['OPEN', 'IN_PROGRESS'])
  );
  const [sortBy, setSortBy] = useState<'recent' | 'votes' | 'comments'>(
    'recent'
  );

  const toggleSetMember = <T,>(
    setter: React.Dispatch<React.SetStateAction<Set<T>>>,
    value: T
  ) => {
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  };

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

  const loadComments = useCallback(
    async (requestId: number) => {
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
    },
    [commentsLoading, comments]
  );

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

  // Validacion centralizada para los 3 entry points (paste, drop, file input).
  // Filtra non-image, descarta archivos > 5MB (mismo limite que el endpoint),
  // deduplica vs los ya pendientes (Flor reporto en feedback #99 que el
  // mismo screenshot quedo subido dos veces), y muestra toast por cada
  // rechazo asi el usuario sabe por que no aparece el preview.
  const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

  // Clave de deduplicacion: name + size + lastModified. Es el triple que
  // identifica univocamente un archivo del device en una sesion. No usamos
  // un hash del contenido porque no se justifica el costo (CPU + async)
  // para este caso de uso.
  const fileKey = (f: File) => `${f.name}|${f.size}|${f.lastModified}`;

  const addImageFiles = (files: File[] | FileList | null) => {
    if (!files) return;
    const list = Array.from(files);
    const accepted: PendingImage[] = [];
    setPendingImages((prev) => {
      const existingKeys = new Set(prev.map((p) => fileKey(p.file)));
      for (const file of list) {
        if (!file.type.startsWith('image/')) {
          message.warning(
            interpolateMessage(t('feedback.errorImageType'), {
              name: file.name,
            })
          );
          continue;
        }
        if (file.size > MAX_IMAGE_BYTES) {
          message.warning(
            interpolateMessage(t('feedback.errorImageSize'), {
              name: file.name,
            })
          );
          continue;
        }
        const key = fileKey(file);
        if (existingKeys.has(key)) {
          message.warning(
            interpolateMessage(t('feedback.errorImageDuplicate'), {
              name: file.name,
            })
          );
          continue;
        }
        existingKeys.add(key);
        accepted.push({ file, preview: URL.createObjectURL(file) });
      }
      return accepted.length > 0 ? [...prev, ...accepted] : prev;
    });
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const files: File[] = [];
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) files.push(file);
      }
    }
    if (files.length > 0) {
      e.preventDefault();
      addImageFiles(files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    addImageFiles(e.target.files);
    // Reset asi seleccionar el mismo archivo dos veces sigue disparando onChange.
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer?.types.includes('Files')) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Solo salir si estamos saliendo del contenedor (no de un hijo). En mobile
    // este event no aplica pero no molesta.
    if (e.currentTarget === e.target) setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addImageFiles(e.dataTransfer?.files ?? null);
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

      // /api/feedback/upload acepta cualquier user logueado y namespacea el
      // folder por userId. /api/upload requiere ADMIN/MODERATOR (portadas
      // de series), por eso aca usamos el endpoint dedicado.
      const response = await fetch('/api/feedback/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(t('feedback.errorUploadImage'));
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

      if (!response.ok) throw new Error(t('feedback.errorCreate'));

      const newRequest = await response.json();
      setRequests((prev) => [newRequest, ...prev]);
      setModalOpen(false);
      form.resetFields();
      pendingImages.forEach((img) => URL.revokeObjectURL(img.preview));
      setPendingImages([]);
      message.success(t('feedback.successCreated'));
    } catch (error) {
      message.error(t('feedback.errorCreateRequest'));
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

      if (!response.ok) throw new Error(t('feedback.errorVote'));

      const { voted } = await response.json();

      setRequests((prev) =>
        prev.map((r) => {
          if (r.id !== requestId) return r;
          return {
            ...r,
            _count: {
              votes: voted ? r._count.votes + 1 : r._count.votes - 1,
              comments: r._count.comments,
            },
            votes: voted
              ? [...r.votes, { userId: userId! }]
              : r.votes.filter((v) => v.userId !== userId),
          };
        })
      );
    } catch (error) {
      message.error(t('feedback.errorVote'));
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

      if (!response.ok) throw new Error(t('feedback.errorStatusUpdate'));

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

      if (!response.ok) throw new Error(t('feedback.errorDelete'));

      setRequests((prev) => prev.filter((r) => r.id !== requestId));
      message.success(t('feedback.successDeleted'));
    } catch (error) {
      message.error(t('feedback.errorDelete'));
      console.error(error);
    }
  };

  // Solo lo cerrado para timeline del Changelog. El listado principal usa
  // filteredRequests (toolbar de search/type/status/sort).
  const completedRequests = requests
    .filter((r) => r.status === 'COMPLETED')
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

  const filteredRequests = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = requests.filter((r) => {
      if (!typeFilter.has(r.type)) return false;
      if (!statusFilter.has(r.status)) return false;
      if (q) {
        const hay = `${r.title} ${r.description ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    // Sort
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'votes':
          return b._count.votes - a._count.votes;
        case 'comments':
          return b._count.comments - a._count.comments;
        case 'recent':
        default:
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
      }
    });
  }, [requests, searchQuery, typeFilter, statusFilter, sortBy]);

  const hasActiveFilter =
    searchQuery.trim().length > 0 ||
    typeFilter.size !== 3 ||
    statusFilter.size !== 2 ||
    !statusFilter.has('OPEN') ||
    !statusFilter.has('IN_PROGRESS');

  const renderRequestCard = (request: FeatureRequest) => {
    const typeConfig = TYPE_CONFIG[request.type] || TYPE_CONFIG.idea;
    const statusConfig = STATUS_CONFIG[request.status] || STATUS_CONFIG.OPEN;
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
                    alt={t('feedback.imageAltAttachment')}
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
                  <span>{formatPublicName(request.user)}</span>
                </>
              )}
              <span>
                {new Date(request.createdAt).toLocaleDateString(locale)}
              </span>
            </div>

            {(userId || isAdmin) && (
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
            )}
          </div>
        </div>

        {/* Hilo de comentarios: visible solo para el dueño y admins */}
        {userId &&
          (request.user?.id === userId || isAdmin) &&
          renderCommentThread(request)}
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
              ? interpolateMessage(t('feedback.commentsCount'), {
                  n: String(commentCount),
                })
              : t('feedback.commentsTitle')}
          </span>
          <span
            className={`feedback-card__comments-chevron${isExpanded ? ' expanded' : ''}`}
          >
            ›
          </span>
        </button>

        {isExpanded && (
          <div className="feedback-card__comments-body">
            {isLoading ? (
              <div className="feedback-card__comments-loading">…</div>
            ) : threadComments && threadComments.length > 0 ? (
              <div className="feedback-card__comments-list">
                {threadComments.map((c) => (
                  <div
                    key={c.id}
                    className={`feedback-comment${c.user.role === 'ADMIN' || c.user.role === 'MODERATOR' ? ' feedback-comment--admin' : ''}`}
                  >
                    <div className="feedback-comment__header">
                      <Avatar
                        src={c.user.image}
                        icon={!c.user.image ? <UserOutlined /> : undefined}
                        size={20}
                      />
                      <span className="feedback-comment__name">
                        {formatPublicName(c.user)}
                      </span>
                      {(c.user.role === 'ADMIN' ||
                        c.user.role === 'MODERATOR') && (
                        <span className="feedback-comment__admin-badge">
                          {t('feedback.adminBadge')}
                        </span>
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
              <p className="feedback-card__comments-empty">
                {t('feedback.commentsEmpty')}
              </p>
            )}

            {session?.user && (
              <div className="feedback-card__comment-input">
                <Input.TextArea
                  rows={2}
                  maxLength={2000}
                  value={commentTexts[request.id] ?? ''}
                  onChange={(e) =>
                    setCommentTexts((prev) => ({
                      ...prev,
                      [request.id]: e.target.value,
                    }))
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
              {hasActiveFilter
                ? interpolateMessage(t('feedback.filteredCount'), {
                    shown: String(filteredRequests.length),
                    total: String(requests.length),
                  })
                : interpolateMessage(t('feedback.activeCount'), {
                    n: String(filteredRequests.length),
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

          <PanelCard padding="md" className="feedback-toolbar">
            <Input
              prefix={<SearchOutlined />}
              placeholder={t('feedback.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              allowClear
              className="feedback-toolbar__search"
            />

            <div className="feedback-toolbar__group">
              <span className="feedback-toolbar__label">
                {t('feedback.filterTypeLabel')}
              </span>
              {['bug', 'feature', 'idea'].map((type) => {
                const cfg = TYPE_CONFIG[type];
                const active = typeFilter.has(type);
                return (
                  <Chip
                    key={type}
                    size="sm"
                    icon={cfg.icon}
                    tone={active ? 'accent' : 'neutral'}
                    outline={!active}
                    pressed={active}
                    onClick={() => toggleSetMember(setTypeFilter, type)}
                  >
                    {cfg.label}
                  </Chip>
                );
              })}
            </div>

            <div className="feedback-toolbar__group">
              <span className="feedback-toolbar__label">
                {t('feedback.filterStatusLabel')}
              </span>
              {['OPEN', 'IN_PROGRESS', 'COMPLETED', 'REJECTED'].map((st) => {
                const cfg = STATUS_CONFIG[st];
                const active = statusFilter.has(st);
                return (
                  <Chip
                    key={st}
                    size="sm"
                    tone={active ? 'accent' : 'neutral'}
                    outline={!active}
                    pressed={active}
                    onClick={() => toggleSetMember(setStatusFilter, st)}
                  >
                    {cfg.label}
                  </Chip>
                );
              })}
            </div>

            <Select
              value={sortBy}
              onChange={(v) => setSortBy(v)}
              className="feedback-toolbar__sort"
              size="middle"
              options={[
                { value: 'recent', label: t('feedback.sortRecent') },
                { value: 'votes', label: t('feedback.sortVotes') },
                { value: 'comments', label: t('feedback.sortComments') },
              ]}
            />
          </PanelCard>

          {filteredRequests.length > 0 ? (
            <div className="feedback-list">
              {filteredRequests.map(renderRequestCard)}
            </div>
          ) : (
            <Empty
              description={
                hasActiveFilter
                  ? t('feedback.emptyFiltered')
                  : t('feedback.emptyRequests')
              }
            />
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
                      <li key={j}>
                        {item.category && (
                          <Tag
                            color="default"
                            className="changelog-entry__cat-tag"
                          >
                            {item.category}
                          </Tag>
                        )}
                        {item.body}
                      </li>
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
      <PageTitle title={t('feedback.pageTitle')} />
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
        className="feedback-modal"
        width="min(560px, 100vw - 32px)"
      >
        {/* Drag-drop zone envuelve todo el form. En mobile no aplica
         * (touch no dispara dragover) pero no molesta. */}
        <div
          className={`feedback-drop-zone${isDragging ? ' feedback-drop-zone--active' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onPaste={handlePaste}
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
                placeholder={t('feedback.formDescriptionPlaceholder')}
              />
            </Form.Item>

            {/* Acciones de adjuntar: en mobile el primero abre galeria y
             * el segundo (capture) abre directamente la camara. En desktop
             * el "camera" igual abre file picker (el browser lo ignora si
             * no hay camara). */}
            <div className="feedback-attach-actions">
              <Button
                icon={<PictureOutlined />}
                onClick={() => fileInputRef.current?.click()}
              >
                {t('feedback.attachImage')}
              </Button>
              <Button
                icon={<CameraOutlined />}
                onClick={() => cameraInputRef.current?.click()}
                className="feedback-attach-actions__camera"
              >
                {t('feedback.takePhoto')}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={handleFileInputChange}
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                hidden
                onChange={handleFileInputChange}
              />
            </div>

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

          {isDragging && (
            <div className="feedback-drop-zone__overlay" aria-hidden>
              <PictureOutlined />
              <span>{t('feedback.dropImagesHere')}</span>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
