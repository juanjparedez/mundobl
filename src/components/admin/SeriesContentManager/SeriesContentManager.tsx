'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Tag,
  Popconfirm,
  Checkbox,
  Divider,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import { EmbedPlayer } from '@/components/common/EmbedPlayer/EmbedPlayer';
import {
  PLATFORM_OPTIONS,
  CATEGORY_OPTIONS,
  CATEGORY_LABELS,
  PLATFORM_COLORS,
  detectPlatform,
  extractVideoId,
  getAutoThumbnailUrl,
  type Platform,
} from '@/lib/embed-helpers';
import { useMessage } from '@/hooks/useMessage';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import './SeriesContentManager.css';

interface ContentItem {
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
}

export interface PendingContentItem {
  _tempId: number;
  title: string;
  description: string | null;
  platform: string;
  url: string;
  category: string;
  thumbnailUrl: string | null;
  channelName: string | null;
  official: boolean;
  featured: boolean;
  sortOrder: number;
}

interface SeriesContentManagerProps {
  seriesId?: number;
  pendingItems?: PendingContentItem[];
  onPendingItemsChange?: (items: PendingContentItem[]) => void;
}

export function SeriesContentManager({
  seriesId,
  pendingItems,
  onPendingItemsChange,
}: SeriesContentManagerProps) {
  const message = useMessage();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const [editingPendingItem, setEditingPendingItem] =
    useState<PendingContentItem | null>(null);
  const [previewData, setPreviewData] = useState<{
    platform: string;
    url: string;
    videoId: string | null;
    title: string;
  } | null>(null);
  const [form] = Form.useForm();
  const tempIdCounter = useRef(0);

  const isLocalMode = !seriesId;

  const loadItems = useCallback(async () => {
    if (isLocalMode) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/contenido?seriesId=${seriesId}`);
      if (!res.ok) throw new Error();
      setItems(await res.json());
    } catch {
      message.error('Error al cargar el contenido');
    } finally {
      setLoading(false);
    }
  }, [seriesId, isLocalMode, message]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const handleUrlBlur = () => {
    const url: string = form.getFieldValue('url') || '';
    if (!url) return;
    const detected = detectPlatform(url);
    if (detected && !form.getFieldValue('platform')) {
      form.setFieldValue('platform', detected);
    }
    const platform = detected || form.getFieldValue('platform');
    if (platform && !form.getFieldValue('thumbnailUrl')) {
      const autoThumb = getAutoThumbnailUrl(platform as Platform, url);
      if (autoThumb) form.setFieldValue('thumbnailUrl', autoThumb);
    }
  };

  const handlePreview = () => {
    const url: string = form.getFieldValue('url') || '';
    const platform: string = form.getFieldValue('platform');
    const title: string = form.getFieldValue('title') || 'Preview';
    if (!url || !platform) {
      message.warning('Ingresa una URL y plataforma primero');
      return;
    }
    const videoId = extractVideoId(platform as Platform, url);
    setPreviewData({ platform, url, videoId, title });
  };

  const handleOpenModal = (item?: ContentItem | PendingContentItem) => {
    setPreviewData(null);
    if (item) {
      if ('_tempId' in item) {
        setEditingPendingItem(item);
        setEditingItem(null);
      } else {
        setEditingItem(item);
        setEditingPendingItem(null);
      }
      form.setFieldsValue({ ...item });
    } else {
      setEditingItem(null);
      setEditingPendingItem(null);
      form.resetFields();
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingItem(null);
    setEditingPendingItem(null);
    setPreviewData(null);
    form.resetFields();
  };

  const handleSubmit = async (values: Record<string, unknown>) => {
    if (isLocalMode) {
      const pendingItem: PendingContentItem = {
        _tempId: editingPendingItem?._tempId ?? ++tempIdCounter.current,
        title: values.title as string,
        description: (values.description as string) || null,
        platform: values.platform as string,
        url: values.url as string,
        category: (values.category as string) || 'trailer',
        thumbnailUrl: (values.thumbnailUrl as string) || null,
        channelName: (values.channelName as string) || null,
        official: (values.official as boolean) ?? true,
        featured: (values.featured as boolean) ?? false,
        sortOrder: (values.sortOrder as number) ?? 0,
      };

      const current = pendingItems ?? [];
      const updated = editingPendingItem
        ? current.map((i) =>
            i._tempId === editingPendingItem._tempId ? pendingItem : i
          )
        : [...current, pendingItem];

      onPendingItemsChange?.(updated);
      message.success(
        editingPendingItem ? 'Contenido actualizado' : 'Contenido agregado'
      );
      handleCloseModal();
      return;
    }

    try {
      const url = editingItem
        ? `/api/contenido/${editingItem.id}`
        : '/api/contenido';
      const method = editingItem ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, seriesId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al guardar');
      }
      message.success(
        editingItem ? 'Contenido actualizado' : 'Contenido agregado'
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
    if (isLocalMode) {
      const updated = (pendingItems ?? []).filter((i) => i._tempId !== id);
      onPendingItemsChange?.(updated);
      message.success('Contenido eliminado');
      return;
    }

    try {
      const res = await fetch(`/api/contenido/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      message.success('Contenido eliminado');
      loadItems();
    } catch {
      message.error('Error al eliminar');
    }
  };

  type TableRow = ContentItem | PendingContentItem;

  const getRowId = (record: TableRow): number =>
    '_tempId' in record ? record._tempId : record.id;

  const columns = [
    {
      title: 'Título',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Plataforma',
      key: 'platform',
      render: (r: TableRow) => (
        <Tag color={PLATFORM_COLORS[r.platform] ?? 'default'}>{r.platform}</Tag>
      ),
      responsive: ['sm' as const],
    },
    {
      title: 'Categoría',
      key: 'category',
      render: (r: TableRow) => (
        <Tag>{CATEGORY_LABELS[r.category] ?? r.category}</Tag>
      ),
      responsive: ['md' as const],
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (record: TableRow) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleOpenModal(record)}
          >
            {!isMobile && 'Editar'}
          </Button>
          <Popconfirm
            title="¿Eliminar este contenido?"
            onConfirm={() => handleDelete(getRowId(record))}
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
    <div className="series-content-manager">
      <div className="series-content-manager__toolbar">
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => handleOpenModal()}
        >
          Agregar contenido
        </Button>
      </div>

      <Table<TableRow>
        dataSource={isLocalMode ? (pendingItems ?? []) : items}
        columns={columns}
        rowKey={(record) => String(getRowId(record))}
        loading={loading}
        pagination={false}
        size="small"
      />

      <Modal
        title={editingItem ? 'Editar contenido' : 'Agregar contenido'}
        open={modalOpen}
        onCancel={handleCloseModal}
        onOk={() => form.submit()}
        okText="Guardar"
        cancelText="Cancelar"
        width={600}
        forceRender
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="Título"
            name="title"
            rules={[{ required: true, message: 'El título es requerido' }]}
          >
            <Input placeholder="Ej: Tráiler oficial" />
          </Form.Item>

          <Form.Item
            label="URL"
            name="url"
            rules={[
              { required: true, message: 'La URL es requerida' },
              { type: 'url', message: 'URL inválida' },
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
            rules={[{ required: true, message: 'La plataforma es requerida' }]}
          >
            <Select
              options={PLATFORM_OPTIONS}
              placeholder="Seleccionar plataforma"
            />
          </Form.Item>

          <Form.Item label="Categoría" name="category" initialValue="trailer">
            <Select options={CATEGORY_OPTIONS} />
          </Form.Item>

          <Form.Item label="Descripción" name="description">
            <Input.TextArea rows={2} placeholder="Descripción opcional" />
          </Form.Item>

          <Form.Item
            label="Miniatura (URL)"
            name="thumbnailUrl"
            extra="Se detecta automáticamente para YouTube"
          >
            <Input placeholder="https://..." />
          </Form.Item>

          <Form.Item label="Canal / Fuente" name="channelName">
            <Input placeholder="Nombre del canal" />
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
            Vista previa del embed
          </Button>

          {previewData && (
            <div className="series-content-manager__preview">
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
  );
}
