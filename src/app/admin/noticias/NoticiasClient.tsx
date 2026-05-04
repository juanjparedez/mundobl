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
import { MarkdownEditor } from '@/components/admin/MarkdownEditor/MarkdownEditor';
import { useMessage } from '@/hooks/useMessage';
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

const STATUS_LABEL: Record<NewsStatus, string> = {
  DRAFT: 'Borrador',
  REVIEW: 'En revisión',
  APPROVED: 'Aprobada',
  PUBLISHED: 'Publicada',
  REJECTED: 'Rechazada',
};

// ─── Component ────────────────────────────────────────────────────────────────

export function NoticiasClient() {
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
      if (!res.ok) throw new Error('Error al cargar noticias');
      const data: NewsResponse = await res.json();
      setNews(data.news);
      setTotal(data.total);
    } catch (error) {
      console.error(error);
      message.error('Error al cargar noticias');
    } finally {
      setLoading(false);
    }
  }, [page, view, search, message]);

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
        throw new Error(err.error ?? 'Error');
      }
      message.success('Estado actualizado');
      setNews((prev) =>
        prev.map((n) => (n.id === id ? { ...n, status: newStatus } : n))
      );
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : 'Error al actualizar';
      message.error(msg);
    }
  };

  // ─── Delete ─────────────────────────────────────────────────────────────────

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/news?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar');
      message.success('Noticia eliminada');
      setNews((prev) => prev.filter((n) => n.id !== id));
      setTotal((prev) => Math.max(prev - 1, 0));
    } catch (error) {
      console.error(error);
      message.error('Error al eliminar noticia');
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
        throw new Error(err.error ?? 'Error');
      }

      message.success(isEdit ? 'Noticia actualizada' : 'Noticia creada');
      setIsFormOpen(false);
      await fetchData();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error al guardar';
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
        throw new Error(err.error ?? 'Error de IA');
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
      message.success('Resumen generado — revisá antes de publicar');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error de IA';
      message.error(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  // ─── Columns ─────────────────────────────────────────────────────────────────

  const columns: ColumnsType<NewsRow> = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 60,
    },
    {
      title: 'Título',
      dataIndex: 'title',
      render: (title: string, row) => (
        <div className="noticias-admin__title-cell">
          <span className="noticias-admin__title-text">{title}</span>
          <span className="noticias-admin__source">{row.sourceName}</span>
        </div>
      ),
    },
    {
      title: 'Estado',
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
      title: 'IA',
      dataIndex: 'aiGenerated',
      width: 50,
      render: (ai: boolean) =>
        ai ? (
          <Tooltip title="Generado con IA">
            <RobotOutlined style={{ color: '#6366f1' }} />
          </Tooltip>
        ) : null,
    },
    {
      title: 'Creada',
      dataIndex: 'createdAt',
      width: 110,
      render: (d: string) => new Date(d).toLocaleDateString('es-AR'),
    },
    {
      title: 'Acciones',
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
            title="¿Eliminar esta noticia?"
            onConfirm={() => handleDelete(row.id)}
            okText="Eliminar"
            cancelText="Cancelar"
          >
            <Button icon={<DeleteOutlined />} size="small" danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // ─── Render ──────────────────────────────────────────────────────────────────

  const viewOptions = [
    { label: 'Todas', value: 'all' },
    { label: 'Borrador', value: 'DRAFT' },
    { label: 'Revisión', value: 'REVIEW' },
    { label: 'Aprobada', value: 'APPROVED' },
    { label: 'Publicada', value: 'PUBLISHED' },
    { label: 'Rechazada', value: 'REJECTED' },
  ];

  return (
    <div className="noticias-admin">
      <AdminPageHero
        title="Noticias BL/GL"
        subtitle="Gestión de noticias curadas con asistencia de IA"
        stats={[{ label: 'Total', value: total }]}
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
        searchPlaceholder="Buscar por título, fuente…"
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
            <Button icon={<RobotOutlined />} onClick={() => setIsAiOpen(true)}>
              Generar con IA
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={openCreateForm}
            >
              Nueva noticia
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
          showTotal: (t) => `${t} noticias`,
          onChange: (p) => setPage(p),
        }}
        className="noticias-admin__table"
      />

      {/* ── Modal preview ── */}
      <Modal
        title={previewRow?.title ?? 'Vista previa'}
        open={!!previewRow}
        onCancel={() => setPreviewRow(null)}
        footer={
          <Space>
            <Tag
              color={previewRow ? STATUS_COLOR[previewRow.status] : 'default'}
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
                Ver fuente →
              </Button>
            )}
            <Button onClick={() => setPreviewRow(null)}>Cerrar</Button>
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
              Fuente: <strong>{previewRow.sourceName}</strong>
              {previewRow.publishedAt && (
                <>
                  {' '}
                  ·{' '}
                  {new Date(previewRow.publishedAt).toLocaleDateString('es-AR')}
                </>
              )}
            </p>
            <div className="noticias-admin__preview-body">
              {previewRow.summary}
            </div>
            {previewRow.tags.length > 0 && (
              <div className="noticias-admin__preview-tags">
                {previewRow.tags.map((t) => (
                  <Tag key={t.tag.id}>{t.tag.name}</Tag>
                ))}
              </div>
            )}
            {previewRow.florNotes && (
              <div className="noticias-admin__preview-notes">
                <strong>Notas privadas:</strong> {previewRow.florNotes}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ── Modal form crear/editar ── */}
      <Modal
        title={
          editingRow ? `Editar noticia #${editingRow.id}` : 'Nueva noticia'
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
            label="Título"
            name="title"
            rules={[{ required: true, message: 'El título es requerido' }]}
          >
            <Input placeholder="Título de la noticia" />
          </Form.Item>

          <Form.Item
            label="Resumen"
            name="summary"
            rules={[{ required: true, message: 'El resumen es requerido' }]}
          >
            {({ value, onChange }) => (
              <MarkdownEditor
                value={value || ''}
                onChange={onChange}
                rows={8}
                placeholder="Resumen de la noticia (soporta Markdown)"
              />
            )}
          </Form.Item>

          <div className="noticias-admin__form-row">
            <Form.Item
              label="URL original"
              name="originalUrl"
              rules={[
                { required: true, message: 'La URL original es requerida' },
              ]}
              style={{ flex: 1 }}
            >
              <Input placeholder="https://…" />
            </Form.Item>
            <Form.Item
              label="Nombre de la fuente"
              name="sourceName"
              rules={[
                {
                  required: true,
                  message: 'El nombre de la fuente es requerido',
                },
              ]}
              style={{ flex: 1 }}
            >
              <Input placeholder="Ej: Anime News Network" />
            </Form.Item>
          </div>

          <div className="noticias-admin__form-row">
            <Form.Item
              label="Logo de la fuente (URL)"
              name="sourceLogo"
              style={{ flex: 1 }}
            >
              <Input placeholder="https://…/favicon.ico" />
            </Form.Item>
            <Form.Item
              label="Imagen de portada (URL)"
              name="imageUrl"
              style={{ flex: 1 }}
            >
              <Input placeholder="https://…/imagen.jpg" />
            </Form.Item>
          </div>

          <div className="noticias-admin__form-row">
            <Form.Item
              label="Fecha de publicación original"
              name="publishedAt"
              style={{ flex: 1 }}
            >
              <Input type="date" />
            </Form.Item>
            <Form.Item
              label="Estado"
              name="status"
              rules={[{ required: true }]}
              style={{ flex: 1 }}
            >
              <Select
                options={Object.entries(STATUS_LABEL).map(([value, label]) => ({
                  value,
                  label,
                }))}
              />
            </Form.Item>
          </div>

          <Form.Item
            label="Notas privadas (no visibles al público)"
            name="florNotes"
          >
            <Input.TextArea rows={2} placeholder="Notas internas…" />
          </Form.Item>

          <div className="noticias-admin__form-actions">
            <Button onClick={() => setIsFormOpen(false)}>Cancelar</Button>
            <Button type="primary" htmlType="submit" loading={isSaving}>
              {editingRow ? 'Guardar cambios' : 'Crear noticia'}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* ── Modal AI generator ── */}
      <Modal
        title="Generar noticia con IA"
        open={isAiOpen}
        onCancel={() => setIsAiOpen(false)}
        footer={null}
        width={640}
        destroyOnHidden
      >
        <p className="noticias-admin__ai-disclaimer">
          La IA genera un resumen basado en el texto que pegues. El resultado
          siempre incluye el crédito a la fuente original. Revisá antes de
          publicar.
        </p>
        <Form form={aiForm} layout="vertical" onFinish={handleAiGenerate}>
          <Form.Item
            label="URL del artículo original"
            name="url"
            rules={[{ required: true, message: 'La URL es requerida' }]}
          >
            <Input placeholder="https://…" />
          </Form.Item>
          <Form.Item
            label="Nombre del sitio fuente"
            name="sourceName"
            rules={[
              {
                required: true,
                message: 'El nombre de la fuente es requerido',
              },
            ]}
          >
            <Input placeholder="Ej: Anime News Network" />
          </Form.Item>
          <Form.Item
            label="Texto del artículo (pegá el contenido principal)"
            name="articleText"
            rules={[
              { required: true, message: 'El texto del artículo es requerido' },
            ]}
          >
            <Input.TextArea
              rows={8}
              placeholder="Copiá y pegá el texto del artículo acá…"
            />
          </Form.Item>
          <div className="noticias-admin__form-actions">
            <Button onClick={() => setIsAiOpen(false)}>Cancelar</Button>
            <Button
              type="primary"
              htmlType="submit"
              icon={<RobotOutlined />}
              loading={isGenerating}
            >
              Generar resumen
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
