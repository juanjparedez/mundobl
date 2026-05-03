'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { AppLayout } from '@/components/layout/AppLayout/AppLayout';
import {
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
  ImportOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { useMessage } from '@/hooks/useMessage';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { interpolateMessage } from '@/lib/i18n-format';
import { AdminPageHero } from '@/components/admin/AdminPageHero/AdminPageHero';
import { AdminTableToolbar } from '@/components/admin/AdminTableToolbar/AdminTableToolbar';
import { AdminNav } from '../AdminNav';
import { EmbedPlayer } from '@/components/common/EmbedPlayer/EmbedPlayer';
import {
  PLATFORM_OPTIONS,
  CATEGORY_OPTIONS,
  CATEGORY_LABELS,
  detectPlatform,
  extractVideoId,
  getAutoThumbnailUrl,
  type Platform,
} from '@/lib/embed-helpers';
import { ImportChannelDrawer } from './ImportChannelDrawer/ImportChannelDrawer';
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
  const { t } = useLocale();
  const [items, setItems] = useState<EmbeddableContentItem[]>([]);
  const [seriesOptions, setSeriesOptions] = useState<SeriesOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
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
  const [importDrawerOpen, setImportDrawerOpen] = useState(false);
  const [showOnlyDuplicates, setShowOnlyDuplicates] = useState(false);
  const [form] = Form.useForm();

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/contenido');
      if (!res.ok) throw new Error();
      setItems(await res.json());
    } catch {
      message.error(t('adminContent.loadError'));
    } finally {
      setLoading(false);
    }
  }, [message, t]);

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
      if (autoThumb) {
        form.setFieldValue('thumbnailUrl', autoThumb);
      }
    }
  };

  const handlePreview = () => {
    const url: string = form.getFieldValue('url') || '';
    const platform: string = form.getFieldValue('platform');
    const title: string = form.getFieldValue('title') || 'Preview';
    if (!url || !platform) {
      message.warning(t('adminContent.previewWarning'));
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
        editingItem
          ? t('adminContent.updateSuccess')
          : t('adminContent.createSuccess')
      );
      handleCloseModal();
      loadItems();
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : t('adminContent.saveError')
      );
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/contenido/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      message.success(t('adminContent.deleteSuccess'));
      loadItems();
    } catch {
      message.error(t('adminContent.deleteError'));
    }
  };

  useEffect(() => {
    loadItems();
    loadSeries();
  }, [loadItems, loadSeries]);

  // Detect duplicates by videoId or url
  const duplicateIds = useMemo(() => {
    const ids = new Set<number>();
    const byVideoId = new Map<string, number[]>();
    const byUrl = new Map<string, number[]>();

    for (const item of items) {
      if (item.videoId) {
        const key = `${item.platform}:${item.videoId}`;
        const group = byVideoId.get(key) || [];
        group.push(item.id);
        byVideoId.set(key, group);
      }
      const normalizedUrl = item.url.replace(/\/$/, '').toLowerCase();
      const group = byUrl.get(normalizedUrl) || [];
      group.push(item.id);
      byUrl.set(normalizedUrl, group);
    }

    for (const group of byVideoId.values()) {
      if (group.length > 1) group.forEach((id) => ids.add(id));
    }
    for (const group of byUrl.values()) {
      if (group.length > 1) group.forEach((id) => ids.add(id));
    }

    return ids;
  }, [items]);

  const filteredItems = useMemo(() => {
    const base = showOnlyDuplicates
      ? items.filter((i) => duplicateIds.has(i.id))
      : items;
    if (!searchTerm.trim()) return base;
    const term = searchTerm.toLowerCase();
    return base.filter(
      (i) =>
        i.title.toLowerCase().includes(term) ||
        i.channelName?.toLowerCase().includes(term) ||
        i.series?.title.toLowerCase().includes(term)
    );
  }, [items, searchTerm, showOnlyDuplicates, duplicateIds]);

  const columns = [
    {
      title: '',
      key: 'thumbnail',
      width: 60,
      render: (r: EmbeddableContentItem) =>
        r.thumbnailUrl ? (
          <Image
            src={r.thumbnailUrl}
            alt=""
            width={48}
            height={36}
            style={{ objectFit: 'cover', borderRadius: 4 }}
            unoptimized
          />
        ) : (
          <div
            style={{
              width: 48,
              height: 36,
              borderRadius: 4,
              background: 'var(--bg-spotlight)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <PlayCircleOutlined style={{ color: 'var(--text-tertiary)' }} />
          </div>
        ),
    },
    {
      title: t('adminContent.columnTitle'),
      dataIndex: 'title',
      key: 'title',
      sorter: (a: EmbeddableContentItem, b: EmbeddableContentItem) =>
        a.title.localeCompare(b.title),
      render: (title: string, record: EmbeddableContentItem) => (
        <Space>
          <span>{title}</span>
          {duplicateIds.has(record.id) && (
            <Tag color="orange">{t('adminContent.tagDuplicate')}</Tag>
          )}
        </Space>
      ),
    },
    {
      title: t('adminContent.columnPlatform'),
      key: 'platform',
      render: (r: EmbeddableContentItem) => <Tag>{r.platform}</Tag>,
      responsive: ['sm' as const],
    },
    {
      title: t('adminContent.columnCategory'),
      key: 'category',
      render: (r: EmbeddableContentItem) => (
        <Tag>{CATEGORY_LABELS[r.category] || r.category}</Tag>
      ),
      responsive: ['md' as const],
    },
    {
      title: t('adminContent.columnSeries'),
      key: 'series',
      render: (r: EmbeddableContentItem) => r.series?.title || '-',
      responsive: ['lg' as const],
    },
    {
      title: t('adminContent.columnFeatured'),
      dataIndex: 'featured',
      key: 'featured',
      width: 60,
      render: (v: boolean) => (v ? '★' : '-'),
      responsive: ['md' as const],
    },
    {
      title: t('adminContent.columnActions'),
      key: 'actions',
      render: (record: EmbeddableContentItem) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => handleOpenModal(record)}
            size="small"
          >
            {!isMobile && t('adminContent.actionEdit')}
          </Button>
          <Popconfirm
            title={t('adminContent.deleteTitle')}
            onConfirm={() => handleDelete(record.id)}
            okText={t('adminContent.actionDelete')}
            cancelText={t('adminContent.cancel')}
            okButtonProps={{ danger: true }}
          >
            <Button danger icon={<DeleteOutlined />} size="small">
              {!isMobile && t('adminContent.actionDelete')}
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

        <AdminPageHero
          title={t('adminContent.title')}
          subtitle={t('adminContent.subtitle')}
          stats={[
            { label: t('adminContent.statsTotal'), value: items.length },
            {
              label: t('adminContent.statsFiltered'),
              value: filteredItems.length,
            },
            ...(duplicateIds.size > 0
              ? [
                  {
                    label: t('adminContent.statsDuplicates'),
                    value: duplicateIds.size,
                  },
                ]
              : []),
          ]}
        />

        <AdminTableToolbar
          filters={
            <Space wrap>
              {duplicateIds.size > 0 && (
                <Button
                  icon={<WarningOutlined />}
                  onClick={() => setShowOnlyDuplicates(!showOnlyDuplicates)}
                  type={showOnlyDuplicates ? 'primary' : 'default'}
                  danger={showOnlyDuplicates}
                >
                  {interpolateMessage(t('adminContent.actionShowDuplicates'), {
                    count: duplicateIds.size,
                  })}
                </Button>
              )}
              <Button
                icon={<ImportOutlined />}
                onClick={() => setImportDrawerOpen(true)}
              >
                {isMobile
                  ? t('adminContent.actionImportShort')
                  : t('adminContent.actionImport')}
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => handleOpenModal()}
              >
                {isMobile
                  ? t('adminContent.newItemShort')
                  : t('adminContent.newItem')}
              </Button>
            </Space>
          }
          searchPlaceholder={t('adminContent.searchPlaceholder')}
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          onSearchSubmit={() => undefined}
          onSearchClear={() => setSearchTerm('')}
        />

        <Table
          dataSource={filteredItems}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20 }}
        />

        <Modal
          title={
            editingItem
              ? t('adminContent.modalEditTitle')
              : t('adminContent.modalNewTitle')
          }
          open={modalOpen}
          onCancel={handleCloseModal}
          onOk={() => form.submit()}
          okText={t('adminContent.save')}
          cancelText={t('adminContent.cancel')}
          width={680}
          forceRender
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item
              label={t('adminContent.fieldTitle')}
              name="title"
              rules={[
                { required: true, message: t('adminContent.requiredTitle') },
              ]}
            >
              <Input placeholder={t('adminContent.hintTitle')} />
            </Form.Item>

            <Form.Item
              label={t('adminContent.fieldUrl')}
              name="url"
              rules={[
                { required: true, message: t('adminContent.requiredUrl') },
                { type: 'url', message: t('adminContent.invalidUrl') },
              ]}
            >
              <Input
                placeholder={t('adminContent.hintUrl')}
                onBlur={handleUrlBlur}
              />
            </Form.Item>

            <Form.Item
              label={t('adminContent.fieldPlatform')}
              name="platform"
              rules={[
                {
                  required: true,
                  message: t('adminContent.requiredPlatform'),
                },
              ]}
            >
              <Select
                options={PLATFORM_OPTIONS}
                placeholder={t('adminContent.fieldPlatform')}
              />
            </Form.Item>

            <Form.Item
              label={t('adminContent.fieldCategory')}
              name="category"
              initialValue="other"
            >
              <Select options={CATEGORY_OPTIONS} />
            </Form.Item>

            <Form.Item
              label={t('adminContent.fieldDescription')}
              name="description"
            >
              <Input.TextArea
                rows={2}
                placeholder={t('adminContent.fieldDescription')}
              />
            </Form.Item>

            <Form.Item label={t('adminContent.fieldLanguage')} name="language">
              <Select
                options={LANGUAGE_OPTIONS}
                placeholder={t('adminContent.fieldLanguage')}
                allowClear
              />
            </Form.Item>

            <Form.Item
              label={t('adminContent.fieldThumbnailUrl')}
              name="thumbnailUrl"
              extra={t('adminContent.thumbnailHint')}
            >
              <Input placeholder={t('adminContent.hintThumbnailUrl')} />
            </Form.Item>

            <Form.Item
              label={t('adminContent.fieldChannelName')}
              name="channelName"
            >
              <Input placeholder={t('adminContent.hintChannelName')} />
            </Form.Item>

            <Form.Item
              label={t('adminContent.fieldChannelUrl')}
              name="channelUrl"
            >
              <Input placeholder={t('adminContent.hintChannelUrl')} />
            </Form.Item>

            <Form.Item label={t('adminContent.fieldSeries')} name="seriesId">
              <Select
                options={seriesOptions}
                placeholder={t('adminContent.hintSeries')}
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
                <Checkbox>{t('adminContent.fieldOfficial')}</Checkbox>
              </Form.Item>
              <Form.Item
                name="featured"
                valuePropName="checked"
                initialValue={false}
              >
                <Checkbox>{t('adminContent.fieldFeatured')}</Checkbox>
              </Form.Item>
            </Space>

            <Form.Item
              label={t('adminContent.fieldOrder')}
              name="sortOrder"
              initialValue={0}
            >
              <InputNumber min={0} />
            </Form.Item>

            <Divider />

            <Button icon={<PlayCircleOutlined />} onClick={handlePreview} block>
              {t('adminContent.previewButton')}
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

        <ImportChannelDrawer
          open={importDrawerOpen}
          onClose={() => setImportDrawerOpen(false)}
          onImportComplete={loadItems}
          seriesOptions={seriesOptions}
        />
      </div>
    </AppLayout>
  );
}
