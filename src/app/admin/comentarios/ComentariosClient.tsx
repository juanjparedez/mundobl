'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Avatar,
  Button,
  Checkbox,
  Input,
  Modal,
  Popconfirm,
  Segmented,
  Space,
  Table,
  Tag,
} from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  ExportOutlined,
  FlagOutlined,
  StopOutlined,
  UserOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { AdminPageHero } from '@/components/admin/AdminPageHero/AdminPageHero';
import { AdminTableToolbar } from '@/components/admin/AdminTableToolbar/AdminTableToolbar';
import { AppLayout } from '@/components/layout/AppLayout/AppLayout';
import { AdminNav } from '../AdminNav';
import { useMessage } from '@/hooks/useMessage';
import { useLocale } from '@/lib/providers/LocaleProvider';
import '../admin.css';
import './comentarios.css';

type TargetFilter = 'all' | 'series' | 'season' | 'episode';
type AuthorFilter = 'all' | 'active' | 'deleted';

interface CommentReportRow {
  id: number;
  reason: string | null;
  createdAt: string;
  user: { id: string; name: string | null; email: string | null } | null;
}

interface CommentRow {
  id: number;
  content: string;
  reportCount: number;
  reportedAt: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  } | null;
  series: { id: number; title: string } | null;
  season: {
    id: number;
    seasonNumber: number;
    series: { id: number; title: string } | null;
  } | null;
  episode: {
    id: number;
    episodeNumber: number;
    title: string | null;
    season: {
      seasonNumber: number;
      series: { id: number; title: string } | null;
    } | null;
  } | null;
  reports: CommentReportRow[];
}

interface CommentsResponse {
  comments: CommentRow[];
  total: number;
  page: number;
  pageSize: number;
}

const PAGE_SIZE = 50;

export function ComentariosClient() {
  const message = useMessage();
  const { locale, t } = useLocale();
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [target, setTarget] = useState<TargetFilter>('all');
  const [author, setAuthor] = useState<AuthorFilter>('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [reportedOnly, setReportedOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingComment, setEditingComment] = useState<CommentRow | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
      });
      if (target !== 'all') params.set('target', target);
      if (author !== 'all') params.set('author', author);
      if (search) params.set('q', search);
      if (reportedOnly) params.set('reported', 'true');

      const response = await fetch(`/api/admin/comments?${params.toString()}`);
      if (!response.ok) throw new Error('Error al cargar comentarios');
      const data: CommentsResponse = await response.json();
      setComments(data.comments);
      setTotal(data.total);
    } catch (error) {
      console.error(error);
      message.error(t('adminComments.loadError'));
    } finally {
      setLoading(false);
    }
  }, [page, target, author, search, reportedOnly, message, t]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/comments?id=${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Error al eliminar');
      message.success(t('adminComments.deleteSuccess'));
      setComments((prev) => prev.filter((c) => c.id !== id));
      setTotal((prev) => Math.max(prev - 1, 0));
    } catch (error) {
      console.error(error);
      message.error(t('adminComments.deleteError'));
    }
  };

  const handleDismissReports = async (id: number) => {
    try {
      const response = await fetch(
        `/api/admin/comments/${id}/dismiss-reports`,
        { method: 'POST' }
      );
      if (!response.ok) throw new Error('Error al descartar reportes');
      message.success(t('adminComments.dismissSuccess'));
      if (reportedOnly) {
        setComments((prev) => prev.filter((c) => c.id !== id));
        setTotal((prev) => Math.max(prev - 1, 0));
      } else {
        setComments((prev) =>
          prev.map((c) =>
            c.id === id
              ? { ...c, reportCount: 0, reportedAt: null, reports: [] }
              : c
          )
        );
      }
    } catch (error) {
      console.error(error);
      message.error(t('adminComments.dismissError'));
    }
  };

  const openEditModal = (comment: CommentRow) => {
    setEditingComment(comment);
    setEditingContent(comment.content);
  };

  const closeEditModal = () => {
    if (isSavingEdit) return;
    setEditingComment(null);
    setEditingContent('');
  };

  const handleSaveEdit = async () => {
    if (!editingComment) return;

    const trimmedContent = editingContent.trim();
    if (!trimmedContent) {
      message.warning(t('adminComments.editEmptyWarning'));
      return;
    }
    if (trimmedContent.length > 2000) {
      message.warning(t('adminComments.editLengthWarning'));
      return;
    }

    setIsSavingEdit(true);
    try {
      const response = await fetch(
        `/api/admin/comments?id=${editingComment.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: trimmedContent }),
        }
      );

      if (!response.ok) throw new Error('Error al editar comentario');

      const nowIso = new Date().toISOString();
      setComments((prev) =>
        prev.map((comment) =>
          comment.id === editingComment.id
            ? { ...comment, content: trimmedContent, updatedAt: nowIso }
            : comment
        )
      );
      message.success(t('adminComments.editSuccess'));
      closeEditModal();
    } catch (error) {
      console.error(error);
      message.error(t('adminComments.editError'));
    } finally {
      setIsSavingEdit(false);
    }
  };

  const getTargetSeriesId = (record: CommentRow): number | null => {
    if (record.episode) return record.episode.season?.series?.id ?? null;
    if (record.season) return record.season.series?.id ?? null;
    if (record.series) return record.series.id;
    return null;
  };

  const renderTarget = (record: CommentRow) => {
    if (record.episode) {
      const seriesTitle =
        record.episode.season?.series?.title ??
        t('adminComments.targetSeriesFallback');
      const seasonNum = record.episode.season?.seasonNumber ?? '?';
      const epNum = record.episode.episodeNumber;
      const epTitle = record.episode.title ? ` — ${record.episode.title}` : '';
      return (
        <span className="comentarios-target">
          <span className="comentarios-target__type">
            {t('adminComments.targetEpisode')}
          </span>
          {seriesTitle} · T{seasonNum}E{epNum}
          {epTitle}
        </span>
      );
    }
    if (record.season) {
      const seriesTitle =
        record.season.series?.title ?? t('adminComments.targetSeriesFallback');
      return (
        <span className="comentarios-target">
          <span className="comentarios-target__type">
            {t('adminComments.targetSeason')}
          </span>
          {seriesTitle} · T{record.season.seasonNumber}
        </span>
      );
    }
    if (record.series) {
      return (
        <span className="comentarios-target">
          <span className="comentarios-target__type">
            {t('adminComments.targetSeries')}
          </span>
          {record.series.title}
        </span>
      );
    }
    return (
      <span className="comentarios-target__empty">
        {t('adminComments.targetUnknown')}
      </span>
    );
  };

  const reportedCount = comments.filter(
    (comment) => comment.reportCount > 0
  ).length;

  const columns: ColumnsType<CommentRow> = [
    {
      title: t('adminComments.columnUser'),
      key: 'user',
      width: 220,
      render: (_, record) =>
        record.user ? (
          <div className="comentarios-user">
            <Avatar
              src={record.user.image}
              icon={!record.user.image ? <UserOutlined /> : undefined}
              size={32}
            />
            <div>
              <div className="comentarios-user__name">
                {record.user.name ?? t('adminComments.unnamedUser')}
              </div>
              <div className="comentarios-user__email">{record.user.email}</div>
            </div>
          </div>
        ) : (
          <span className="comentarios-target__empty">
            {t('adminComments.deletedUser')}
          </span>
        ),
    },
    {
      title: t('adminComments.columnComment'),
      key: 'content',
      render: (_, record) => (
        <div className="comentarios-content">
          {record.reportCount > 0 && (
            <Tag
              color="red"
              icon={<FlagOutlined />}
              className="comentarios-report-tag"
            >
              {record.reportCount}{' '}
              {record.reportCount === 1
                ? t('adminComments.reportsSuffixOne')
                : t('adminComments.reportsSuffixMany')}
            </Tag>
          )}
          {new Date(record.updatedAt).getTime() >
            new Date(record.createdAt).getTime() && (
            <Tag color="processing" className="comentarios-report-tag">
              {t('adminComments.edited')}
            </Tag>
          )}
          {record.content}
        </div>
      ),
    },
    {
      title: t('adminComments.columnAbout'),
      key: 'target',
      width: 280,
      render: (_, record) => renderTarget(record),
    },
    {
      title: t('adminComments.columnDate'),
      key: 'createdAt',
      width: 130,
      render: (_, record) =>
        new Date(record.createdAt).toLocaleDateString(locale),
    },
    {
      title: t('adminComments.columnActions'),
      key: 'actions',
      width: 260,
      render: (_, record) => {
        const seriesId = getTargetSeriesId(record);
        return (
          <Space size="small" wrap>
            {seriesId && (
              <Button
                size="small"
                icon={<ExportOutlined />}
                href={`/series/${seriesId}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('adminComments.actionView')}
              </Button>
            )}
            {record.reportCount > 0 && (
              <Popconfirm
                title={t('adminComments.dismissReportsTitle')}
                description={t('adminComments.dismissReportsDescription')}
                onConfirm={() => handleDismissReports(record.id)}
                okText={t('adminComments.dismissReportsConfirm')}
                cancelText={t('adminComments.cancel')}
              >
                <Button size="small" icon={<StopOutlined />}>
                  {t('adminComments.actionIgnore')}
                </Button>
              </Popconfirm>
            )}
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => openEditModal(record)}
            >
              {t('adminComments.actionEdit')}
            </Button>
            <Popconfirm
              title={t('adminComments.deleteTitle')}
              description={t('adminComments.deleteDescription')}
              onConfirm={() => handleDelete(record.id)}
              okText={t('adminComments.deleteConfirm')}
              cancelText={t('adminComments.cancel')}
              okButtonProps={{ danger: true }}
            >
              <Button size="small" danger icon={<DeleteOutlined />}>
                {t('adminComments.actionDelete')}
              </Button>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <AppLayout>
      <div className="admin-page-wrapper">
        <AdminNav />
        <div className="comentarios-page">
          <AdminPageHero
            title={t('adminComments.title')}
            subtitle={t('adminComments.subtitle')}
            stats={[
              { label: t('adminComments.statsTotal'), value: total },
              { label: t('adminComments.statsReported'), value: reportedCount },
              { label: t('adminComments.statsPage'), value: comments.length },
            ]}
          />

          <AdminTableToolbar
            filters={
              <Segmented<TargetFilter>
                value={target}
                onChange={(value) => {
                  setTarget(value);
                  setPage(1);
                }}
                options={[
                  { label: t('adminComments.filterAll'), value: 'all' },
                  { label: t('adminComments.filterSeries'), value: 'series' },
                  { label: t('adminComments.filterSeasons'), value: 'season' },
                  {
                    label: t('adminComments.filterEpisodes'),
                    value: 'episode',
                  },
                ]}
              />
            }
            searchPlaceholder={t('adminComments.searchPlaceholder')}
            searchValue={searchInput}
            onSearchChange={setSearchInput}
            onSearchSubmit={() => {
              setSearch(searchInput.trim());
              setPage(1);
            }}
            onSearchClear={() => {
              setSearchInput('');
              setSearch('');
              setPage(1);
            }}
            rightActions={
              <Space wrap>
                <Segmented<AuthorFilter>
                  value={author}
                  onChange={(value) => {
                    setAuthor(value);
                    setPage(1);
                  }}
                  options={[
                    {
                      label: t('adminComments.filterAuthorAll'),
                      value: 'all',
                    },
                    {
                      label: t('adminComments.filterAuthorActive'),
                      value: 'active',
                    },
                    {
                      label: t('adminComments.filterAuthorDeleted'),
                      value: 'deleted',
                    },
                  ]}
                />
                <Checkbox
                  checked={reportedOnly}
                  onChange={(event) => {
                    setReportedOnly(event.target.checked);
                    setPage(1);
                  }}
                >
                  {t('adminComments.reportedOnly')}
                </Checkbox>
              </Space>
            }
          />

          <Table
            className="comentarios-table"
            columns={columns}
            dataSource={comments}
            rowKey="id"
            loading={loading}
            size="small"
            expandable={{
              rowExpandable: (record) => record.reports.length > 0,
              expandedRowRender: (record) => (
                <ul className="comentarios-reports">
                  {record.reports.map((report) => (
                    <li key={report.id} className="comentarios-reports__item">
                      <div className="comentarios-reports__head">
                        <span className="comentarios-reports__user">
                          {report.user?.name ?? t('adminComments.deletedUser')}
                          {report.user?.email && (
                            <span className="comentarios-reports__email">
                              {' '}
                              · {report.user.email}
                            </span>
                          )}
                        </span>
                        <span className="comentarios-reports__date">
                          {new Date(report.createdAt).toLocaleString(locale)}
                        </span>
                      </div>
                      <div className="comentarios-reports__reason">
                        {report.reason ?? (
                          <span className="comentarios-target__empty">
                            {t('adminComments.noReason')}
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ),
            }}
            pagination={{
              current: page,
              pageSize: PAGE_SIZE,
              total,
              showSizeChanger: false,
              onChange: (newPage) => setPage(newPage),
            }}
          />

          <Modal
            title={t('adminComments.modalEditTitle')}
            open={Boolean(editingComment)}
            onCancel={closeEditModal}
            onOk={handleSaveEdit}
            confirmLoading={isSavingEdit}
            okText={t('adminComments.save')}
            cancelText={t('adminComments.cancel')}
          >
            <Input.TextArea
              value={editingContent}
              onChange={(e) => setEditingContent(e.target.value)}
              rows={6}
              maxLength={2000}
              showCount
              placeholder={t('adminComments.modalEditPlaceholder')}
            />
          </Modal>
        </div>
      </div>
    </AppLayout>
  );
}
