'use client';

import { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout/AppLayout';
import {
  Card,
  Table,
  Button,
  Input,
  InputNumber,
  Modal,
  Form,
  Select,
  Popconfirm,
  Space,
  Tag,
  Checkbox,
  Divider,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import { useMessage } from '@/hooks/useMessage';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { AdminNav } from '../AdminNav';
import { EmbedPlayer } from '@/components/common/EmbedPlayer/EmbedPlayer';
import {
  PLATFORM_OPTIONS,
  CATEGORY_OPTIONS,
  CATEGORY_LABELS,
  detectPlatform,
  extractVideoId,
  type Platform,
} from '@/lib/embed-helpers';
import '../admin.css';
import './contenido.css';

const LANGUAGE_OPTIONS = [
  { label: 'Español', value: 'ES' },
  { label: 'Inglés', value: 'EN' },
  { label: 'Chino', value: 'ZH' },
  { label: 'Tailandés', value: 'TH' },
  { label: 'Coreano', value: 'KR' },
  { label: 'Japonés', value: 'JP' },
  { label: 'Multi', value: 'Multi' },
];

interface EmbeddableContentItem {
  id: number;
  title: string;
  description: string | null;
  platform: string;
  url: string;
  videoId: string | null;
  category: string;
  language: string | null;
  thumbnailUrl: string | null;
  channelName: string | null;
  channelUrl: string | null;
  official: boolean;
  sortOrder: number;
  featured: boolean;
  seriesId: number | null;
  series: { id: number; title: string } | null;
}

interface SeriesOption {
  value: number;
  label: string;
}

export function ContenidoClient() {
  const message = useMessage();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [items, setItems] = useState<EmbeddableContentItem[]>([]);
  const [seriesOptions, setSeriesOptions] = useState<SeriesOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EmbeddableContentItem | null>(
    null
  );
  const [previewData, setPreviewData] = useState<{
    platform: string;
    url: string;
    videoId: string | null;
    title: string;
  } | null>(null);
  const [form] = Form.useForm();

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/contenido');
      if (!res.ok) throw new Error();
      setItems(await res.json());
    } catch {
      message.error('Error al cargar el contenido');
    } finally {
      setLoading(false);
    }
  }, [message]);

  const loadSeries = useCallback(async () => {
    try {
      const res = await fetch('/api/series');
      if (!res.ok) return;
      const data: { id: number; title: string }[] = await res.json();
      setSeriesOptions(data.map((s) => ({ value: s.id, label: s.title })));
    } catch {
      /* non-critical */
    }
  }, []);

  useEffect(() => {
    loadItems();
    loadSeries();
  }, [loadItems, loadSeries]);

  const handleUrlBlur = () => {
    const url: string = form.getFieldValue('url') || '';
    if (!url) return;
    const detected = detectPlatform(url);
    if (detected && !form.getFieldValue('platform')) {
      form.setFieldValue('platform', detected);
    }
  };

  const handlePreview = () => {
    const url: string = form.getFieldValue('url') || '';
    const platform: string = form.getFieldValue('platform');
    const title: string = form.getFieldValue('title') || 'Preview';
    if (!url || !platform) {
      message.warning('Ingresá una URL y plataforma para previsualizar');
      return;
    }
    const videoId = extractVideoId(platform as Platform, url);
    setPreviewData({ platform, url, videoId, title });
  };

  const handleOpenModal = (item?: EmbeddableContentItem) => {
    setPreviewData(null);
    if (item) {
      setEditingItem(item);
      form.setFieldsValue({ ...item });
    } else {
      setEditingItem(null);
      form.resetFields();
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingItem(null);
    setPreviewData(null);
    form.resetFields();
  };

  const handleSubmit = async (values: Record<string, unknown>) => {
    try {
      const url = editingItem
        ? `/api/contenido/${editingItem.id}`
        : '/api/contenido';
      const method = editingItem ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al guardar');
      }
      message.success(
        editingItem ? 'Contenido actualizado' : 'Contenido creado'
      );
      handleCloseModal();
      loadItems();
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : 'Error al guardar'
      );
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/contenido/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      message.success('Contenido eliminado');
      loadItems();
    } catch {
      message.error('Error al eliminar el contenido');
    }
  };

  const columns = [
    {
      title: 'Título',
      dataIndex: 'title',
      key: 'title',
      sorter: (a: EmbeddableContentItem, b: EmbeddableContentItem) =>
        a.title.localeCompare(b.title),
    },
    {
      title: 'Plataforma',
      key: 'platform',
      render: (r: EmbeddableContentItem) => <Tag>{r.platform}</Tag>,
      responsive: ['sm' as const],
    },
    {
      title: 'Categoría',
      key: 'category',
      render: (r: EmbeddableContentItem) => (
        <Tag>{CATEGORY_LABELS[r.category] || r.category}</Tag>
      ),
      responsive: ['md' as const],
    },
    {
      title: 'Serie',
      key: 'series',
      render: (r: EmbeddableContentItem) => r.series?.title || '-',
      responsive: ['lg' as const],
    },
    {
      title: 'Dest.',
      dataIndex: 'featured',
      key: 'featured',
      width: 60,
      render: (v: boolean) => (v ? '★' : '-'),
      responsive: ['md' as const],
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (record: EmbeddableContentItem) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => handleOpenModal(record)}
            size="small"
          >
            {!isMobile && 'Editar'}
          </Button>
          <Popconfirm
            title="¿Eliminar este contenido?"
            onConfirm={() => handleDelete(record.id)}
            okText="Eliminar"
            cancelText="Cancelar"
            okButtonProps={{ danger: true }}
          >
            <Button danger icon={<DeleteOutlined />} size="small">
              {!isMobile && 'Eliminar'}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <AppLayout>
      <div className="admin-page-wrapper">
        <AdminNav />
        <Card
          title="Administración de Contenido Embebible"
          extra={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => handleOpenModal()}
            >
              {isMobile ? 'Nuevo' : 'Nuevo Contenido'}
            </Button>
          }
        >
          <Table
            dataSource={items}
            columns={columns}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 20 }}
          />
        </Card>

        <Modal
          title={editingItem ? 'Editar Contenido' : 'Nuevo Contenido'}
          open={modalOpen}
          onCancel={handleCloseModal}
          onOk={() => form.submit()}
          okText="Guardar"
          cancelText="Cancelar"
          width={680}
          forceRender
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item
              label="Título"
              name="title"
              rules={[{ required: true, message: 'El título es requerido' }]}
            >
              <Input placeholder="Título del contenido" />
            </Form.Item>

            <Form.Item
              label="URL"
              name="url"
              rules={[
                { required: true, message: 'La URL es requerida' },
                { type: 'url', message: 'Ingresá una URL válida' },
              ]}
            >
              <Input
                placeholder="https://www.youtube.com/watch?v=..."
                onBlur={handleUrlBlur}
              />
            </Form.Item>

            <Form.Item
              label="Plataforma"
              name="platform"
              rules={[
                { required: true, message: 'La plataforma es requerida' },
              ]}
            >
              <Select
                options={PLATFORM_OPTIONS}
                placeholder="Seleccionar plataforma"
              />
            </Form.Item>

            <Form.Item label="Categoría" name="category" initialValue="other">
              <Select options={CATEGORY_OPTIONS} />
            </Form.Item>

            <Form.Item label="Descripción" name="description">
              <Input.TextArea rows={2} placeholder="Descripción breve" />
            </Form.Item>

            <Form.Item label="Idioma" name="language">
              <Select
                options={LANGUAGE_OPTIONS}
                placeholder="Idioma"
                allowClear
              />
            </Form.Item>

            <Form.Item label="URL de miniatura" name="thumbnailUrl">
              <Input placeholder="https://..." />
            </Form.Item>

            <Form.Item label="Canal / Creador" name="channelName">
              <Input placeholder="Nombre del canal" />
            </Form.Item>

            <Form.Item label="URL del canal" name="channelUrl">
              <Input placeholder="https://..." />
            </Form.Item>

            <Form.Item label="Serie relacionada (opcional)" name="seriesId">
              <Select
                options={seriesOptions}
                placeholder="Buscar serie..."
                allowClear
                showSearch
                filterOption={(input, option) =>
                  (option?.label as string)
                    ?.toLowerCase()
                    .includes(input.toLowerCase())
                }
              />
            </Form.Item>

            <Space>
              <Form.Item
                name="official"
                valuePropName="checked"
                initialValue={true}
              >
                <Checkbox>Oficial</Checkbox>
              </Form.Item>
              <Form.Item
                name="featured"
                valuePropName="checked"
                initialValue={false}
              >
                <Checkbox>Destacado</Checkbox>
              </Form.Item>
            </Space>

            <Form.Item label="Orden" name="sortOrder" initialValue={0}>
              <InputNumber min={0} />
            </Form.Item>

            <Divider />

            <Button icon={<PlayCircleOutlined />} onClick={handlePreview} block>
              Previsualizar embed
            </Button>

            {previewData && (
              <div className="contenido-admin__preview">
                <EmbedPlayer
                  platform={previewData.platform}
                  url={previewData.url}
                  videoId={previewData.videoId}
                  title={previewData.title}
                />
              </div>
            )}
          </Form>
        </Modal>
      </div>
    </AppLayout>
  );
}
