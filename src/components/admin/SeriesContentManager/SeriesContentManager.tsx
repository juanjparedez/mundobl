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
import { useLocale } from '@/lib/providers/LocaleProvider';
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
  const { t } = useLocale();
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
      message.error(t('seriesContentManager.errorLoadingContent'));
    } finally {
      setLoading(false);
    }
  }, [seriesId, isLocalMode, message, t]);

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
    const title: string =
      form.getFieldValue('title') || t('seriesContentManager.previewTitle');
    if (!url || !platform) {
      message.warning(t('seriesContentManager.enterUrlAndPlatform'));
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
        editingPendingItem
          ? t('seriesContentManager.contentUpdated')
          : t('seriesContentManager.contentAdded')
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
        throw new Error(err.error || t('seriesContentManager.errorSaving'));
      }
      message.success(
        editingItem
          ? t('seriesContentManager.contentUpdated')
          : t('seriesContentManager.contentAdded')
      );
      handleCloseModal();
      loadItems();
    } catch (error) {
      message.error(
        error instanceof Error
          ? error.message
          : t('seriesContentManager.errorSaving')
      );
    }
  };

  const handleDelete = async (id: number) => {
    if (isLocalMode) {
      const updated = (pendingItems ?? []).filter((i) => i._tempId !== id);
      onPendingItemsChange?.(updated);
      message.success(t('seriesContentManager.contentDeleted'));
      return;
    }

    try {
      const res = await fetch(`/api/contenido/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      message.success(t('seriesContentManager.contentDeleted'));
      loadItems();
    } catch {
      message.error(t('seriesContentManager.errorDeleting'));
    }
  };

  type TableRow = ContentItem | PendingContentItem;

  const getRowId = (record: TableRow): number =>
    '_tempId' in record ? record._tempId : record.id;

  const columns = [
    {
      title: t('seriesContentManager.titleColumn'),
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: t('seriesContentManager.platformColumn'),
      key: 'platform',
      render: (r: TableRow) => (
        <Tag color={PLATFORM_COLORS[r.platform] ?? 'default'}>{r.platform}</Tag>
      ),
      responsive: ['sm' as const],
    },
    {
      title: t('seriesContentManager.categoryColumn'),
      key: 'category',
      render: (r: TableRow) => (
        <Tag>{CATEGORY_LABELS[r.category] ?? r.category}</Tag>
      ),
      responsive: ['md' as const],
    },
    {
      title: t('seriesContentManager.actionsColumn'),
      key: 'actions',
      render: (record: TableRow) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleOpenModal(record)}
          >
            {!isMobile && t('seriesContentManager.editButton')}
          </Button>
          <Popconfirm
            title={t('seriesContentManager.deleteConfirmTitle')}
            onConfirm={() => handleDelete(getRowId(record))}
            okText={t('seriesContentManager.deleteButton')}
            cancelText={t('seriesContentManager.cancelButton')}
            okButtonProps={{ danger: true }}
          >
            <Button danger icon={<DeleteOutlined />} size="small">
              {!isMobile && t('seriesContentManager.deleteButton')}
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
          {t('seriesContentManager.addContentButton')}
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
        title={
          editingItem
            ? t('seriesContentManager.editContentModalTitle')
            : t('seriesContentManager.addContentModalTitle')
        }
        open={modalOpen}
        onCancel={handleCloseModal}
        onOk={() => form.submit()}
        okText={t('seriesContentManager.saveButton')}
        cancelText={t('seriesContentManager.cancelButton')}
        width={600}
        forceRender
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label={t('seriesContentManager.titleLabel')}
            name="title"
            rules={[
              {
                required: true,
                message: t('seriesContentManager.titleRequired'),
              },
            ]}
          >
            <Input placeholder={t('seriesContentManager.titlePlaceholder')} />
          </Form.Item>

          <Form.Item
            label={t('seriesContentManager.urlLabel')}
            name="url"
            rules={[
              {
                required: true,
                message: t('seriesContentManager.urlRequired'),
              },
              { type: 'url', message: t('seriesContentManager.invalidUrl') },
            ]}
          >
            <Input
              placeholder={t('seriesContentManager.urlPlaceholder')}
              onBlur={handleUrlBlur}
            />
          </Form.Item>

          <Form.Item
            label={t('seriesContentManager.platformLabel')}
            name="platform"
            rules={[
              {
                required: true,
                message: t('seriesContentManager.platformRequired'),
              },
            ]}
          >
            <Select
              options={PLATFORM_OPTIONS}
              placeholder={t('seriesContentManager.selectPlatformPlaceholder')}
            />
          </Form.Item>

          <Form.Item
            label={t('seriesContentManager.categoryLabel')}
            name="category"
            initialValue="trailer"
          >
            <Select options={CATEGORY_OPTIONS} />
          </Form.Item>

          <Form.Item
            label={t('seriesContentManager.descriptionLabel')}
            name="description"
          >
            <Input.TextArea
              rows={2}
              placeholder={t('seriesContentManager.descriptionPlaceholder')}
            />
          </Form.Item>

          <Form.Item
            label={t('seriesContentManager.thumbnailUrlLabel')}
            name="thumbnailUrl"
            extra={t('seriesContentManager.thumbnailUrlExtra')}
          >
            <Input
              placeholder={t('seriesContentManager.thumbnailUrlPlaceholder')}
            />
          </Form.Item>

          <Form.Item
            label={t('seriesContentManager.channelNameLabel')}
            name="channelName"
          >
            <Input
              placeholder={t('seriesContentManager.channelNamePlaceholder')}
            />
          </Form.Item>

          <Space>
            <Form.Item
              name="official"
              valuePropName="checked"
              initialValue={true}
            >
              <Checkbox>{t('seriesContentManager.officialCheckbox')}</Checkbox>
            </Form.Item>
            <Form.Item
              name="featured"
              valuePropName="checked"
              initialValue={false}
            >
              <Checkbox>{t('seriesContentManager.featuredCheckbox')}</Checkbox>
            </Form.Item>
          </Space>

          <Form.Item
            label={t('seriesContentManager.sortOrderLabel')}
            name="sortOrder"
            initialValue={0}
          >
            <InputNumber min={0} />
          </Form.Item>

          <Divider />

          <Button icon={<PlayCircleOutlined />} onClick={handlePreview} block>
            {t('seriesContentManager.previewEmbedButton')}
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
