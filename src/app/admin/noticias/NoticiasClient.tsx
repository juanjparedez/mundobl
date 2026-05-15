'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Form,
  Input,
  Modal,
  Popconfirm,
  Segmented,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  RobotOutlined,
} from '@ant-design/icons';
import { AdminPageHero } from '@/components/admin/AdminPageHero/AdminPageHero';
import { AdminTableToolbar } from '@/components/admin/AdminTableToolbar/AdminTableToolbar';
import { AppLayout } from '@/components/layout/AppLayout/AppLayout';
import { AdminNav } from '../AdminNav';
import { useMessage } from '@/hooks/useMessage';
import { useLocale } from '@/lib/providers/LocaleProvider';
import './noticias-admin.css';

// ─── Types ────────────────────────────────────────────────────────────────────

type NewsStatus = 'DRAFT' | 'REVIEW' | 'APPROVED' | 'PUBLISHED' | 'REJECTED';
type ViewMode = 'all' | NewsStatus;

interface NewsTag {
  tag: { id: number; name: string };
}

interface NewsRow {
  id: number;
  title: string;
  summary: string;
  originalUrl: string;
  sourceName: string;
  sourceLogo: string | null;
  imageUrl: string | null;
  publishedAt: string | null;
  status: NewsStatus;
  aiGenerated: boolean;
  florNotes: string | null;
  createdAt: string;
  updatedAt: string;
  relatedSeries: { id: number; title: string } | null;
  approvedBy: { id: string; name: string | null } | null;
  tags: NewsTag[];
}

interface NewsResponse {
  news: NewsRow[];
  total: number;
  page: number;
  pageSize: number;
}

interface FormValues {
  title: string;
  summary: string;
  originalUrl: string;
  sourceName: string;
  sourceLogo?: string;
  imageUrl?: string;
  publishedAt?: string;
  status: NewsStatus;
  aiGenerated: boolean;
  florNotes?: string;
}

interface AiPanelValues {
  url: string;
  sourceName: string;
  articleText: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PAGE_SIZE = 50;

const STATUS_COLOR: Record<NewsStatus, string> = {
  DRAFT: 'default',
  REVIEW: 'processing',
  APPROVED: 'success',
  PUBLISHED: 'green',
  REJECTED: 'error',
};

// ─── Component ────────────────────────────────────────────────────────────────

export function NoticiasClient() {
  const { t } = useLocale();
  const message = useMessage();

  const [news, setNews] = useState<NewsRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [view, setView] = useState<ViewMode>('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal estados
  const [editingRow, setEditingRow] = useState<NewsRow | null>(null);
  const [previewRow, setPreviewRow] = useState<NewsRow | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // AI panel
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiForm] = Form.useForm<AiPanelValues>();
  const [mainForm] = Form.useForm<FormValues>();

  // ─── Data loading ───────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
      });
      if (view !== 'all') params.set('status', view);
      if (search) params.set('q', search);

      const res = await fetch(`/api/admin/news?${params.toString()}`);
      if (!res.ok) throw new Error(t('newsAdmin.errorLoadingNews'));
      const data: NewsResponse = await res.json();
      setNews(data.news);
      setTotal(data.total);
    } catch (error) {
      console.error(error);
      message.error(t('newsAdmin.errorLoadingNews'));
    } finally {
      setLoading(false);
    }
  }, [page, view, search, message, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Status change ──────────────────────────────────────────────────────────

  const handleStatusChange = async (id: number, newStatus: NewsStatus) => {
    try {
      const res = await fetch(`/api/admin/news?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        throw new Error(err.error ?? t('newsAdmin.errorUpdatingStatus'));
      }
      message.success(t('newsAdmin.statusUpdatedSuccess'));
      setNews((prev) =>
        prev.map((n) => (n.id === id ? { ...n, status: newStatus } : n))
      );
    } catch (error) {
      const msg =
        error instanceof Error
          ? error.message
          : t('newsAdmin.errorUpdatingStatus');
      message.error(msg);
    }
  };

  // ─── Delete ─────────────────────────────────────────────────────────────────

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/news?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(t('newsAdmin.errorDeletingNews'));
      message.success(t('newsAdmin.newsDeletedSuccess'));
      setNews((prev) => prev.filter((n) => n.id !== id));
      setTotal((prev) => Math.max(prev - 1, 0));
    } catch (error) {
      console.error(error);
      message.error(t('newsAdmin.errorDeletingNews'));
    }
  };

  // ─── Form (create / edit) ───────────────────────────────────────────────────

  const openCreateForm = () => {
    setEditingRow(null);
    mainForm.resetFields();
    mainForm.setFieldsValue({ status: 'DRAFT', aiGenerated: true });
    setIsFormOpen(true);
  };

  const openEditForm = (row: NewsRow) => {
    setEditingRow(row);
    mainForm.setFieldsValue({
      title: row.title,
      summary: row.summary,
      originalUrl: row.originalUrl,
      sourceName: row.sourceName,
      sourceLogo: row.sourceLogo ?? undefined,
      imageUrl: row.imageUrl ?? undefined,
      publishedAt: row.publishedAt
        ? new Date(row.publishedAt).toISOString().split('T')[0]
        : undefined,
      status: row.status,
      aiGenerated: row.aiGenerated,
      florNotes: row.florNotes ?? undefined,
    });
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (values: FormValues) => {
    setIsSaving(true);
    try {
      const isEdit = !!editingRow;
      const url = isEdit
        ? `/api/admin/news?id=${editingRow!.id}`
        : '/api/admin/news';
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        throw new Error(err.error ?? t('newsAdmin.errorSavingNews'));
      }

      message.success(
        isEdit
          ? t('newsAdmin.newsUpdatedSuccess')
          : t('newsAdmin.newsCreatedSuccess')
      );
      setIsFormOpen(false);
      await fetchData();
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : t('newsAdmin.errorSavingNews');
      message.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  // ─── AI generation ──────────────────────────────────────────────────────────

  const handleAiGenerate = async (values: AiPanelValues) => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/admin/news/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        throw new Error(err.error ?? t('newsAdmin.aiGenerationError'));
      }
      const data = (await res.json()) as {
        summary: string;
        suggestedTitle: string | null;
      };

      // Pasar resultado al form de creación
      setIsAiOpen(false);
      aiForm.resetFields();
      mainForm.setFieldsValue({
        summary: data.summary,
        title: data.suggestedTitle ?? undefined,
        originalUrl: values.url,
        sourceName: values.sourceName,
        status: 'DRAFT',
        aiGenerated: true,
      });
      setEditingRow(null);
      setIsFormOpen(true);
      message.success(t('newsAdmin.aiSummarySuccess'));
    } catch (error) {
      const msg =
        error instanceof Error
          ? error.message
          : t('newsAdmin.aiGenerationError');
      message.error(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  // ─── Columns ─────────────────────────────────────────────────────────────────

  const STATUS_LABEL: Record<NewsStatus, string> = {
    DRAFT: t('newsAdmin.draftStatus'),
    REVIEW: t('newsAdmin.reviewStatus'),
    APPROVED: t('newsAdmin.approvedStatus'),
    PUBLISHED: t('newsAdmin.publishedStatus'),
    REJECTED: t('newsAdmin.rejectedStatus'),
  };

  const columns: ColumnsType<NewsRow> = [
    {
      title: t('newsAdmin.tableColumnId'),
      dataIndex: 'id',
      width: 60,
    },
    {
      title: t('newsAdmin.tableColumnTitle'),
      dataIndex: 'title',
      render: (title: string, row) => (
        <div className="noticias-admin__title-cell">
          <span className="noticias-admin__title-text">{title}</span>
          <span className="noticias-admin__source">{row.sourceName}</span>
        </div>
      ),
    },
    {
      title: t('newsAdmin.tableColumnStatus'),
      dataIndex: 'status',
      width: 130,
      render: (status: NewsStatus, row) => (
        <Select
          value={status}
          size="small"
          style={{ width: 130 }}
          onChange={(val) => handleStatusChange(row.id, val)}
          options={Object.entries(STATUS_LABEL).map(([value, label]) => ({
            value,
            label,
          }))}
        />
      ),
    },
    {
      title: t('newsAdmin.tableColumnAi'),
      dataIndex: 'aiGenerated',
      width: 50,
      render: (ai: boolean) =>
        ai ? (
          <Tooltip title={t('newsAdmin.aiGeneratedTooltip')}>
            <RobotOutlined style={{ color: '#6366f1' }} />
          </Tooltip>
        ) : null,
    },
    {
      title: t('newsAdmin.tableColumnCreatedAt'),
      dataIndex: 'createdAt',
      width: 110,
      render: (d: string) => new Date(d).toLocaleDateString('es-AR'),
    },
    {
      title: t('newsAdmin.tableColumnActions'),
      key: 'actions',
      width: 120,
      render: (_: unknown, row: NewsRow) => (
        <Space size="small">
          <Button
            icon={<EyeOutlined />}
            size="small"
            onClick={() => setPreviewRow(row)}
          />
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => openEditForm(row)}
          />
          <Popconfirm
            title={t('newsAdmin.deleteConfirmTitle')}
            onConfirm={() => handleDelete(row.id)}
            okText={t('newsAdmin.deleteButton')}
            cancelText={t('newsAdmin.cancelButton')}
          >
            <Button icon={<DeleteOutlined />} size="small" danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // ─── Render ──────────────────────────────────────────────────────────────────

  const viewOptions = [
    { label: t('newsAdmin.allViewOption'), value: 'all' },
    { label: t('newsAdmin.draftStatus'), value: 'DRAFT' },
    { label: t('newsAdmin.reviewStatus'), value: 'REVIEW' },
    { label: t('newsAdmin.approvedStatus'), value: 'APPROVED' },
    { label: t('newsAdmin.publishedStatus'), value: 'PUBLISHED' },
    { label: t('newsAdmin.rejectedStatus'), value: 'REJECTED' },
  ];

  return (
    <AppLayout>
      <div className="admin-page-wrapper">
        <AdminNav />
        <div className="noticias-admin">
          <AdminPageHero
            title={t('newsAdmin.pageTitle')}
            subtitle={t('newsAdmin.pageSubtitle')}
            stats={[{ label: t('newsAdmin.totalNewsStat'), value: total }]}
          />

          <AdminTableToolbar
            filters={
              <Segmented
                options={viewOptions}
                value={view}
                onChange={(val) => {
                  setView(val as ViewMode);
                  setPage(1);
                }}
              />
            }
            searchPlaceholder={t('newsAdmin.searchPlaceholder')}
            searchValue={searchInput}
            onSearchChange={setSearchInput}
            onSearchSubmit={() => {
              setSearch(searchInput);
              setPage(1);
            }}
            onSearchClear={() => {
              setSearchInput('');
              setSearch('');
              setPage(1);
            }}
            rightActions={
              <Space>
                <Button
                  icon={<RobotOutlined />}
                  onClick={() => setIsAiOpen(true)}
                >
                  {t('newsAdmin.generateWithAiButton')}
                </Button>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={openCreateForm}
                >
                  {t('newsAdmin.newNewsButton')}
                </Button>
              </Space>
            }
          />

          <Table<NewsRow>
            columns={columns}
            dataSource={news}
            rowKey="id"
            loading={loading}
            pagination={{
              current: page,
              pageSize: PAGE_SIZE,
              total,
              showTotal: (t_total) =>
                t('newsAdmin.paginationTotal', { total: t_total }),
              onChange: (p) => setPage(p),
            }}
            className="noticias-admin__table"
          />

          {/* ── Modal preview ── */}
          <Modal
            title={previewRow?.title ?? t('newsAdmin.previewModalTitle')}
            open={!!previewRow}
            onCancel={() => setPreviewRow(null)}
            footer={
              <Space>
                <Tag
                  color={
                    previewRow ? STATUS_COLOR[previewRow.status] : 'default'
                  }
                >
                  {previewRow ? STATUS_LABEL[previewRow.status] : ''}
                </Tag>
                {previewRow && (
                  <Button
                    size="small"
                    href={previewRow.originalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t('newsAdmin.viewSourceButton')}
                  </Button>
                )}
                <Button onClick={() => setPreviewRow(null)}>
                  {t('newsAdmin.closeButton')}
                </Button>
              </Space>
            }
            width={680}
          >
            {previewRow && (
              <div className="noticias-admin__preview">
                {previewRow.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewRow.imageUrl}
                    alt={previewRow.title}
                    className="noticias-admin__preview-img"
                  />
                )}
                <p className="noticias-admin__preview-source">
                  {t('newsAdmin.previewSourceLabel')}{' '}
                  <strong>{previewRow.sourceName}</strong>
                  {previewRow.publishedAt && (
                    <>
                      {' '}
                      ·{' '}
                      {new Date(previewRow.publishedAt).toLocaleDateString(
                        'es-AR'
                      )}
                    </>
                  )}
                </p>
                <div className="noticias-admin__preview-body">
                  {previewRow.summary}
                </div>
                {previewRow.tags.length > 0 && (
                  <div className="noticias-admin__preview-tags">
                    {previewRow.tags.map((t_tag) => (
                      <Tag key={t_tag.tag.id}>{t_tag.tag.name}</Tag>
                    ))}
                  </div>
                )}
                {previewRow.florNotes && (
                  <div className="noticias-admin__preview-notes">
                    <strong>{t('newsAdmin.previewPrivateNotesLabel')}</strong>{' '}
                    {previewRow.florNotes}
                  </div>
                )}
              </div>
            )}
          </Modal>

          {/* ── Modal form crear/editar ── */}
          <Modal
            title={
              editingRow
                ? t('newsAdmin.editNewsModalTitle', { id: editingRow.id })
                : t('newsAdmin.newNewsModalTitle')
            }
            open={isFormOpen}
            onCancel={() => setIsFormOpen(false)}
            footer={null}
            width={700}
            destroyOnHidden
          >
            <Form
              form={mainForm}
              layout="vertical"
              onFinish={handleFormSubmit}
              className="noticias-admin__form"
            >
              <Form.Item
                label={t('newsAdmin.titleLabel')}
                name="title"
                rules={[
                  { required: true, message: t('newsAdmin.titleRequired') },
                ]}
              >
                <Input placeholder={t('newsAdmin.titlePlaceholder')} />
              </Form.Item>

              <Form.Item
                label={t('newsAdmin.summaryLabel')}
                name="summary"
                rules={[
                  { required: true, message: t('newsAdmin.summaryRequired') },
                ]}
              >
                <Input.TextArea
                  rows={6}
                  placeholder={t('newsAdmin.summaryPlaceholder')}
                />
              </Form.Item>

              <div className="noticias-admin__form-row">
                <Form.Item
                  label={t('newsAdmin.originalUrlLabel')}
                  name="originalUrl"
                  rules={[
                    {
                      required: true,
                      message: t('newsAdmin.originalUrlRequired'),
                    },
                  ]}
                  style={{ flex: 1 }}
                >
                  <Input placeholder="https://…" />
                </Form.Item>
                <Form.Item
                  label={t('newsAdmin.sourceNameLabel')}
                  name="sourceName"
                  rules={[
                    {
                      required: true,
                      message: t('newsAdmin.sourceNameRequired'),
                    },
                  ]}
                  style={{ flex: 1 }}
                >
                  <Input placeholder={t('newsAdmin.sourceNamePlaceholder')} />
                </Form.Item>
              </div>

              <div className="noticias-admin__form-row">
                <Form.Item
                  label={t('newsAdmin.sourceLogoUrlLabel')}
                  name="sourceLogo"
                  style={{ flex: 1 }}
                >
                  <Input
                    placeholder={t('newsAdmin.sourceLogoUrlPlaceholder')}
                  />
                </Form.Item>
                <Form.Item
                  label={t('newsAdmin.imageUrlLabel')}
                  name="imageUrl"
                  style={{ flex: 1 }}
                >
                  <Input placeholder={t('newsAdmin.imageUrlPlaceholder')} />
                </Form.Item>
              </div>

              <div className="noticias-admin__form-row">
                <Form.Item
                  label={t('newsAdmin.publishedAtLabel')}
                  name="publishedAt"
                  style={{ flex: 1 }}
                >
                  <Input type="date" />
                </Form.Item>
                <Form.Item
                  label={t('newsAdmin.statusLabel')}
                  name="status"
                  rules={[{ required: true }]}
                  style={{ flex: 1 }}
                >
                  <Select
                    options={Object.entries(STATUS_LABEL).map(
                      ([value, label]) => ({
                        value,
                        label,
                      })
                    )}
                  />
                </Form.Item>
              </div>

              <Form.Item
                label={t('newsAdmin.privateNotesLabel')}
                name="florNotes"
              >
                <Input.TextArea
                  rows={2}
                  placeholder={t('newsAdmin.privateNotesPlaceholder')}
                />
              </Form.Item>

              <div className="noticias-admin__form-actions">
                <Button onClick={() => setIsFormOpen(false)}>
                  {t('newsAdmin.cancelButton')}
                </Button>
                <Button type="primary" htmlType="submit" loading={isSaving}>
                  {editingRow
                    ? t('newsAdmin.saveChangesButton')
                    : t('newsAdmin.createNewsButton')}
                </Button>
              </div>
            </Form>
          </Modal>

          {/* ── Modal AI generator ── */}
          <Modal
            title={t('newsAdmin.aiGeneratorModalTitle')}
            open={isAiOpen}
            onCancel={() => setIsAiOpen(false)}
            footer={null}
            width={640}
            destroyOnHidden
          >
            <p className="noticias-admin__ai-disclaimer">
              {t('newsAdmin.aiDisclaimer')}
            </p>
            <Form form={aiForm} layout="vertical" onFinish={handleAiGenerate}>
              <Form.Item
                label={t('newsAdmin.aiUrlLabel')}
                name="url"
                rules={[
                  { required: true, message: t('newsAdmin.aiUrlRequired') },
                ]}
              >
                <Input placeholder="https://…" />
              </Form.Item>
              <Form.Item
                label={t('newsAdmin.aiSourceNameLabel')}
                name="sourceName"
                rules={[
                  {
                    required: true,
                    message: t('newsAdmin.aiSourceNameRequired'),
                  },
                ]}
              >
                <Input placeholder={t('newsAdmin.sourceNamePlaceholder')} />
              </Form.Item>
              <Form.Item
                label={t('newsAdmin.aiArticleTextLabel')}
                name="articleText"
                rules={[
                  {
                    required: true,
                    message: t('newsAdmin.aiArticleTextRequired'),
                  },
                ]}
              >
                <Input.TextArea
                  rows={8}
                  placeholder={t('newsAdmin.aiArticleTextPlaceholder')}
                />
              </Form.Item>
              <div className="noticias-admin__form-actions">
                <Button onClick={() => setIsAiOpen(false)}>
                  {t('newsAdmin.cancelButton')}
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<RobotOutlined />}
                  loading={isGenerating}
                >
                  {t('newsAdmin.generateSummaryButton')}
                </Button>
              </div>
            </Form>
          </Modal>
        </div>
      </div>
    </AppLayout>
  );
}
