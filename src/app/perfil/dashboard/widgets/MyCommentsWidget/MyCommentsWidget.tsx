'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  Checkbox,
  Input,
  Modal,
  Pagination,
  Select,
  Spin,
  Tag,
} from 'antd';
import {
  CommentOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  LockOutlined,
  UnlockOutlined,
} from '@ant-design/icons';
import { useSession } from 'next-auth/react';
import { Widget } from '@/components/dashboard';
import { EmptyState } from '@/components/design-system';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { useMessage } from '@/hooks/useMessage';
import { interpolateMessage } from '@/lib/i18n-format';
import './MyCommentsWidget.css';

interface UserComment {
  id: number;
  content: string;
  isPrivate: boolean;
  reportCount: number;
  createdAt: string;
  series: { id: number; title: string } | null;
  season: {
    id: number;
    seasonNumber: number;
    series: { id: number; title: string } | null;
  } | null;
  episode: {
    id: number;
    episodeNumber: number;
    season: {
      seasonNumber: number;
      series: { id: number; title: string } | null;
    } | null;
  } | null;
}

interface UserCommentsResponse {
  comments: UserComment[];
  total: number;
  page: number;
  pageSize: number;
}

type VisibilityFilter = 'all' | 'public' | 'private';
type TargetFilter = 'all' | 'series' | 'season' | 'episode';

/** Gestion completa de los comentarios del usuario:
 *  - busqueda + filtros (visibility / target / reported)
 *  - bulk select + bulk delete + bulk visibility
 *  - editar inline (modal)
 *  - abrir disputa por reportes (modal)
 *  - export JSON de la seleccion / pagina actual
 *  - paginacion
 *
 *  Lo del legacy ProfileClient migrado al patron de widget. Por la
 *  cantidad de controles es un widget de ancho completo (w: 12). */
export function MyCommentsWidget() {
  const { t } = useLocale();
  const message = useMessage();
  const { status } = useSession();

  const [comments, setComments] = useState<UserComment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);

  const [searchDraft, setSearchDraft] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibility, setVisibility] = useState<VisibilityFilter>('all');
  const [target, setTarget] = useState<TargetFilter>('all');
  const [reportedOnly, setReportedOnly] = useState(false);

  const [busy, setBusy] = useState(false);

  const [editTarget, setEditTarget] = useState<UserComment | null>(null);
  const [editContent, setEditContent] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const [disputeTarget, setDisputeTarget] = useState<UserComment | null>(null);
  const [disputeMessage, setDisputeMessage] = useState('');
  const [submittingDispute, setSubmittingDispute] = useState(false);

  const resolveTarget = useCallback(
    (c: UserComment) => {
      if (c.episode?.season?.series?.title) {
        return `${c.episode.season.series.title} · T${c.episode.season.seasonNumber}E${c.episode.episodeNumber}`;
      }
      if (c.season?.series?.title) {
        return `${c.season.series.title} · T${c.season.seasonNumber}`;
      }
      if (c.series?.title) {
        return c.series.title;
      }
      return t('profile.commentsTargetUnknown');
    },
    [t]
  );

  const load = useCallback(async () => {
    if (status !== 'authenticated') return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));
      if (searchQuery) params.set('q', searchQuery);
      if (visibility !== 'all') params.set('visibility', visibility);
      if (target !== 'all') params.set('target', target);
      if (reportedOnly) params.set('reported', 'true');

      const res = await fetch(`/api/user/comments?${params.toString()}`);
      if (!res.ok) throw new Error(t('profile.commentsLoadError'));
      const data = (await res.json()) as UserCommentsResponse;
      setComments(data.comments);
      setTotal(data.total);
      setSelected((prev) =>
        prev.filter((id) => data.comments.some((c) => c.id === id))
      );
    } catch (err) {
      message.error(
        err instanceof Error ? err.message : t('profile.commentsLoadError')
      );
    } finally {
      setLoading(false);
    }
  }, [
    message,
    page,
    pageSize,
    reportedOnly,
    searchQuery,
    status,
    t,
    target,
    visibility,
  ]);

  useEffect(() => {
    void load();
  }, [load]);

  const allSelected =
    comments.length > 0 && selected.length === comments.length;
  const selectedComments = useMemo(
    () => comments.filter((c) => selected.includes(c.id)),
    [comments, selected]
  );

  const toggleSelectAll = () => {
    setSelected(allSelected ? [] : comments.map((c) => c.id));
  };

  const toggleOne = (id: number, checked: boolean) => {
    setSelected((prev) =>
      checked ? [...prev, id] : prev.filter((x) => x !== id)
    );
  };

  const onBulkDelete = async () => {
    if (selected.length === 0) return;
    setBusy(true);
    try {
      const res = await fetch('/api/user/comments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selected }),
      });
      if (!res.ok) throw new Error(t('profile.commentsDeleteError'));
      const result = (await res.json()) as { deleted: number };
      const n = Math.max(result.deleted ?? 0, 0);
      setSelected([]);
      await load();
      message.success(
        interpolateMessage(t('profile.commentsDeleteSuccess'), {
          n: String(n),
        })
      );
    } catch (err) {
      message.error(
        err instanceof Error ? err.message : t('profile.commentsDeleteError')
      );
    } finally {
      setBusy(false);
    }
  };

  const onSetVisibility = async (isPrivate: boolean) => {
    if (selected.length === 0) return;
    setBusy(true);
    try {
      const res = await fetch('/api/user/comments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'setVisibility',
          ids: selected,
          isPrivate,
        }),
      });
      if (!res.ok) throw new Error(t('profile.commentsVisibilityUpdateError'));
      await load();
      setSelected([]);
      message.success(
        isPrivate
          ? t('profile.commentsVisibilityPrivateSuccess')
          : t('profile.commentsVisibilityPublicSuccess')
      );
    } catch (err) {
      message.error(
        err instanceof Error
          ? err.message
          : t('profile.commentsVisibilityUpdateError')
      );
    } finally {
      setBusy(false);
    }
  };

  const onExport = () => {
    const rows = selectedComments.length > 0 ? selectedComments : comments;
    if (rows.length === 0) return;
    const payload = rows.map((c) => ({
      id: c.id,
      content: c.content,
      visibility: c.isPrivate ? 'private' : 'public',
      reportCount: c.reportCount,
      target: resolveTarget(c),
      createdAt: c.createdAt,
    }));
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mundobl-comments-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const openEdit = (c: UserComment) => {
    setEditTarget(c);
    setEditContent(c.content);
  };

  const saveEdit = async () => {
    if (!editTarget) return;
    setSavingEdit(true);
    try {
      const res = await fetch('/api/user/comments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateContent',
          id: editTarget.id,
          content: editContent,
        }),
      });
      if (!res.ok) throw new Error(t('profile.commentsEditError'));
      message.success(t('profile.commentsEditSuccess'));
      setEditTarget(null);
      setEditContent('');
      await load();
    } catch (err) {
      message.error(
        err instanceof Error ? err.message : t('profile.commentsEditError')
      );
    } finally {
      setSavingEdit(false);
    }
  };

  const submitDispute = async () => {
    if (!disputeTarget) return;
    setSubmittingDispute(true);
    try {
      const res = await fetch('/api/user/comment-disputes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commentId: disputeTarget.id,
          message: disputeMessage,
        }),
      });
      if (!res.ok) {
        const payload =
          ((await res.json().catch(() => ({}))) as { error?: string }) || {};
        throw new Error(payload.error || t('profile.disputeError'));
      }
      message.success(t('profile.disputeSuccess'));
      setDisputeTarget(null);
      setDisputeMessage('');
    } catch (err) {
      message.error(
        err instanceof Error ? err.message : t('profile.disputeError')
      );
    } finally {
      setSubmittingDispute(false);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  return (
    <Widget
      title={t('profileDashboard.widgetMyComments')}
      icon={<CommentOutlined />}
      noPadding
    >
      <div className="mb-my-comments">
        <div className="mb-my-comments__filters">
          <Input.Search
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            onSearch={() => {
              setPage(1);
              setSearchQuery(searchDraft.trim());
            }}
            placeholder={t('profile.commentsSearchPlaceholder')}
            allowClear
            size="small"
            className="mb-my-comments__search"
          />

          <Select
            value={visibility}
            onChange={(v: VisibilityFilter) => {
              setPage(1);
              setVisibility(v);
            }}
            size="small"
            options={[
              { value: 'all', label: t('profile.commentsFilterAll') },
              { value: 'public', label: t('profile.commentsFilterPublic') },
              { value: 'private', label: t('profile.commentsFilterPrivate') },
            ]}
            className="mb-my-comments__select"
          />

          <Select
            value={target}
            onChange={(v: TargetFilter) => {
              setPage(1);
              setTarget(v);
            }}
            size="small"
            options={[
              { value: 'all', label: t('profile.commentsFilterTargetAll') },
              { value: 'series', label: t('profile.commentsTargetSeries') },
              { value: 'season', label: t('profile.commentsTargetSeason') },
              { value: 'episode', label: t('profile.commentsTargetEpisode') },
            ]}
            className="mb-my-comments__select"
          />

          <Button
            size="small"
            type={reportedOnly ? 'primary' : 'default'}
            icon={<ExclamationCircleOutlined />}
            onClick={() => {
              setPage(1);
              setReportedOnly((p) => !p);
            }}
          >
            {t('profile.commentsFilterReported')}
          </Button>
        </div>

        <div className="mb-my-comments__toolbar">
          <Checkbox
            checked={allSelected}
            indeterminate={selected.length > 0 && !allSelected}
            disabled={comments.length === 0}
            onChange={toggleSelectAll}
          >
            {interpolateMessage(t('profile.commentsSelectedCount'), {
              n: String(selected.length),
            })}
          </Checkbox>

          <Button
            size="small"
            icon={<UnlockOutlined />}
            onClick={() => void onSetVisibility(false)}
            disabled={selected.length === 0 || busy}
          >
            {t('profile.commentsSetPublic')}
          </Button>

          <Button
            size="small"
            icon={<LockOutlined />}
            onClick={() => void onSetVisibility(true)}
            disabled={selected.length === 0 || busy}
          >
            {t('profile.commentsSetPrivate')}
          </Button>

          <Button
            size="small"
            icon={<DownloadOutlined />}
            onClick={onExport}
            disabled={comments.length === 0}
          >
            {t('profile.commentsExport')}
          </Button>

          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => void onBulkDelete()}
            disabled={selected.length === 0 || busy}
          >
            {t('profile.commentsDeleteSelected')}
          </Button>
        </div>

        {loading ? (
          <div className="mb-my-comments__loading">
            <Spin size="small" />
          </div>
        ) : comments.length === 0 ? (
          <div className="mb-my-comments__empty">
            <EmptyState
              title={t('profile.commentsEmpty')}
              variant="soft"
              fullHeight={false}
            />
          </div>
        ) : (
          <>
            <ul className="mb-my-comments__list">
              {comments.map((c) => {
                const isSelected = selected.includes(c.id);
                return (
                  <li key={c.id} className="mb-my-comments__item">
                    <div className="mb-my-comments__item-head">
                      <Checkbox
                        checked={isSelected}
                        onChange={(e) => toggleOne(c.id, e.target.checked)}
                      />
                      <span className="mb-my-comments__date">
                        {formatDate(c.createdAt)}
                      </span>
                      <Tag color={c.isPrivate ? 'default' : 'geekblue'}>
                        {c.isPrivate
                          ? t('profile.commentsPrivate')
                          : t('profile.commentsPublic')}
                      </Tag>
                      {c.reportCount > 0 && (
                        <Tag color="warning">
                          {interpolateMessage(
                            t('profile.commentsReportCount'),
                            {
                              n: String(c.reportCount),
                            }
                          )}
                        </Tag>
                      )}
                      <span className="mb-my-comments__target">
                        {resolveTarget(c)}
                      </span>
                      <span className="mb-my-comments__spacer" />
                      <Button
                        size="small"
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => openEdit(c)}
                      />
                      <Button
                        size="small"
                        type="text"
                        icon={<ExclamationCircleOutlined />}
                        disabled={c.reportCount <= 0}
                        onClick={() => {
                          setDisputeTarget(c);
                          setDisputeMessage('');
                        }}
                      />
                    </div>
                    <p className="mb-my-comments__content">{c.content}</p>
                  </li>
                );
              })}
            </ul>

            <div className="mb-my-comments__pagination">
              <Pagination
                current={page}
                pageSize={pageSize}
                total={total}
                size="small"
                showSizeChanger
                pageSizeOptions={['5', '10']}
                onChange={(p, ps) => {
                  setPage(p);
                  setPageSize(ps);
                }}
              />
            </div>
          </>
        )}
      </div>

      <Modal
        open={editTarget !== null}
        title={t('profile.commentsEditTitle')}
        okText={t('profile.commentsEditSave')}
        cancelText={t('profile.commentsEditCancel')}
        onCancel={() => {
          setEditTarget(null);
          setEditContent('');
        }}
        onOk={() => void saveEdit()}
        okButtonProps={{ loading: savingEdit }}
      >
        <Input.TextArea
          rows={5}
          maxLength={2000}
          showCount
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          placeholder={t('profile.commentsEditPlaceholder')}
        />
      </Modal>

      <Modal
        open={disputeTarget !== null}
        title={t('profile.disputeOpenTitle')}
        okText={t('profile.disputeSubmit')}
        cancelText={t('profile.disputeCancel')}
        onCancel={() => {
          setDisputeTarget(null);
          setDisputeMessage('');
        }}
        onOk={() => void submitDispute()}
        okButtonProps={{ loading: submittingDispute }}
      >
        <Input.TextArea
          rows={5}
          maxLength={2000}
          showCount
          value={disputeMessage}
          onChange={(e) => setDisputeMessage(e.target.value)}
          placeholder={t('profile.disputePlaceholder')}
        />
      </Modal>
    </Widget>
  );
}
