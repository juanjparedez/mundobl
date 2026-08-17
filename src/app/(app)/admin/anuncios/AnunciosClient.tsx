'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Table,
  Button,
  Input,
  Modal,
  Form,
  Select,
  Radio,
  Checkbox,
  Switch,
  DatePicker,
  Popconfirm,
  Space,
  Tag,
} from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useMessage } from '@/hooks/useMessage';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { interpolateMessage } from '@/lib/i18n-format';
import { AdminPageHero } from '@/components/admin/AdminPageHero/AdminPageHero';
import { AdminTableToolbar } from '@/components/admin/AdminTableToolbar/AdminTableToolbar';
import { AnnouncementBodyEditor } from '@/components/admin/AnnouncementBodyEditor/AnnouncementBodyEditor';
import {
  ANNOUNCEMENT_PAGE_OPTIONS,
  ANNOUNCEMENT_TONE_COLORS,
  ANNOUNCEMENT_AUDIENCE_COLORS,
} from '@/constants/announcements';
import { AdminNav } from '../AdminNav';
import '../admin.css';
import './anuncios.css';

type Tone = 'INFO' | 'SUCCESS' | 'WARNING' | 'PROMO';
type Audience = 'EVERYONE' | 'MEMBERS' | 'NOTIFICATIONS_ENABLED';
type Status = 'draft' | 'scheduled' | 'active' | 'expired';

interface AnnouncementType {
  id: number;
  title: string;
  body: string;
  tone: Tone;
  audience: Audience;
  pages: string[];
  dismissible: boolean;
  linkUrl: string | null;
  linkLabel: string | null;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
}

interface FormValues {
  title: string;
  body: string;
  tone: Tone;
  audience: Audience;
  pages: string[];
  dismissible: boolean;
  linkUrl?: string;
  linkLabel?: string;
  isActive: boolean;
  schedule?: [Dayjs, Dayjs] | null;
}

function computeStatus(item: AnnouncementType): Status {
  if (!item.isActive) return 'draft';
  const now = Date.now();
  if (item.startsAt && new Date(item.startsAt).getTime() > now) {
    return 'scheduled';
  }
  if (item.endsAt && new Date(item.endsAt).getTime() < now) {
    return 'expired';
  }
  return 'active';
}

const STATUS_COLORS: Record<Status, string> = {
  draft: 'default',
  scheduled: 'blue',
  active: 'green',
  expired: 'default',
};

export function AnunciosClient() {
  const message = useMessage();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { t } = useLocale();
  const [items, setItems] = useState<AnnouncementType[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AnnouncementType | null>(null);
  const [form] = Form.useForm<FormValues>();

  const toneLabels: Record<Tone, string> = {
    INFO: t('adminAnnouncements.toneInfo'),
    SUCCESS: t('adminAnnouncements.toneSuccess'),
    WARNING: t('adminAnnouncements.toneWarning'),
    PROMO: t('adminAnnouncements.tonePromo'),
  };
  const toneOptions = (Object.keys(toneLabels) as Tone[]).map((value) => ({
    value,
    label: toneLabels[value],
  }));

  const audienceLabels: Record<Audience, string> = {
    EVERYONE: t('adminAnnouncements.audienceEveryone'),
    MEMBERS: t('adminAnnouncements.audienceMembers'),
    NOTIFICATIONS_ENABLED: t('adminAnnouncements.audienceNotificationsEnabled'),
  };
  const audienceOptions = (Object.keys(audienceLabels) as Audience[]).map(
    (value) => ({ value, label: audienceLabels[value] })
  );

  const statusLabels: Record<Status, string> = {
    draft: t('adminAnnouncements.statusDraft'),
    scheduled: t('adminAnnouncements.statusScheduled'),
    active: t('adminAnnouncements.statusActive'),
    expired: t('adminAnnouncements.statusExpired'),
  };

  const pageLabels = useMemo(
    () =>
      new Map<string, string>(
        ANNOUNCEMENT_PAGE_OPTIONS.map((p) => [p.value, p.label])
      ),
    []
  );

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/announcements');
      if (!response.ok) throw new Error(t('adminAnnouncements.loadError'));
      const data = await response.json();
      setItems(data);
    } catch (error) {
      message.error(t('adminAnnouncements.loadError'));
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [message, t]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items;
    const term = searchTerm.toLowerCase();
    return items.filter((item) => item.title.toLowerCase().includes(term));
  }, [items, searchTerm]);

  const handleOpenModal = (item?: AnnouncementType) => {
    if (item) {
      setEditingItem(item);
      form.setFieldsValue({
        title: item.title,
        body: item.body,
        tone: item.tone,
        audience: item.audience,
        pages: item.pages,
        dismissible: item.dismissible,
        linkUrl: item.linkUrl ?? undefined,
        linkLabel: item.linkLabel ?? undefined,
        isActive: item.isActive,
        schedule:
          item.startsAt && item.endsAt
            ? [dayjs(item.startsAt), dayjs(item.endsAt)]
            : null,
      });
    } else {
      setEditingItem(null);
      form.resetFields();
      form.setFieldsValue({
        tone: 'INFO',
        audience: 'EVERYONE',
        pages: ['global'],
        dismissible: true,
        isActive: true,
      });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingItem(null);
    form.resetFields();
  };

  const handleSubmit = async (values: FormValues) => {
    try {
      const [startsAt, endsAt] = values.schedule ?? [null, null];
      const payload = {
        title: values.title,
        body: values.body,
        tone: values.tone,
        audience: values.audience,
        pages: values.pages,
        dismissible: values.dismissible,
        linkUrl: values.linkUrl || null,
        linkLabel: values.linkLabel || null,
        isActive: values.isActive,
        startsAt: startsAt ? startsAt.toISOString() : null,
        endsAt: endsAt ? endsAt.toISOString() : null,
      };

      const url = editingItem
        ? `/api/admin/announcements/${editingItem.id}`
        : '/api/admin/announcements';
      const method = editingItem ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || t('adminAnnouncements.saveError'));
      }

      message.success(
        editingItem
          ? t('adminAnnouncements.updateSuccess')
          : t('adminAnnouncements.createSuccess')
      );
      handleCloseModal();
      loadItems();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : t('adminAnnouncements.saveError');
      message.error(errorMessage);
    }
  };

  const handleToggleActive = async (item: AnnouncementType) => {
    try {
      const response = await fetch(`/api/admin/announcements/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !item.isActive }),
      });
      if (!response.ok) throw new Error(t('adminAnnouncements.saveError'));
      loadItems();
    } catch (error) {
      message.error(t('adminAnnouncements.saveError'));
      console.error(error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/announcements/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || t('adminAnnouncements.deleteError'));
      }
      message.success(t('adminAnnouncements.deleteSuccess'));
      loadItems();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : t('adminAnnouncements.deleteError');
      message.error(errorMessage);
    }
  };

  const columns = [
    {
      title: t('adminAnnouncements.columnTitle'),
      dataIndex: 'title',
      key: 'title',
      sorter: (a: AnnouncementType, b: AnnouncementType) =>
        a.title.localeCompare(b.title),
    },
    {
      title: t('adminAnnouncements.columnTone'),
      key: 'tone',
      render: (record: AnnouncementType) => (
        <Tag color={ANNOUNCEMENT_TONE_COLORS[record.tone]}>
          {toneLabels[record.tone]}
        </Tag>
      ),
      responsive: ['md' as const],
    },
    {
      title: t('adminAnnouncements.columnAudience'),
      key: 'audience',
      render: (record: AnnouncementType) => (
        <Tag color={ANNOUNCEMENT_AUDIENCE_COLORS[record.audience]}>
          {audienceLabels[record.audience]}
        </Tag>
      ),
      responsive: ['md' as const],
    },
    {
      title: t('adminAnnouncements.columnPages'),
      key: 'pages',
      render: (record: AnnouncementType) => (
        <span className="anuncios-pages">
          {record.pages.map((p) => pageLabels.get(p) ?? p).join(', ')}
        </span>
      ),
      responsive: ['lg' as const],
    },
    {
      title: t('adminAnnouncements.columnStatus'),
      key: 'status',
      render: (record: AnnouncementType) => {
        const status = computeStatus(record);
        return <Tag color={STATUS_COLORS[status]}>{statusLabels[status]}</Tag>;
      },
    },
    {
      title: t('adminAnnouncements.columnActions'),
      key: 'actions',
      render: (record: AnnouncementType) => (
        <Space>
          <Switch
            size="small"
            checked={record.isActive}
            onChange={() => handleToggleActive(record)}
          />
          <Button
            icon={<EditOutlined />}
            onClick={() => handleOpenModal(record)}
            size="small"
          >
            {!isMobile && t('adminAnnouncements.actionEdit')}
          </Button>
          <Popconfirm
            title={t('adminAnnouncements.deleteTitle')}
            description={interpolateMessage(
              t('adminAnnouncements.deleteDescription'),
              { title: record.title }
            )}
            onConfirm={() => handleDelete(record.id)}
            okText={t('adminAnnouncements.actionDelete')}
            cancelText={t('adminAnnouncements.cancel')}
            okButtonProps={{ danger: true }}
          >
            <Button danger icon={<DeleteOutlined />} size="small">
              {!isMobile && t('adminAnnouncements.actionDelete')}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="admin-page-wrapper">
      <AdminNav />

      <AdminPageHero
        title={t('adminAnnouncements.title')}
        subtitle={t('adminAnnouncements.subtitle')}
        stats={[
          { label: t('adminAnnouncements.statsTotal'), value: items.length },
          {
            label: t('adminAnnouncements.statsFiltered'),
            value: filteredItems.length,
          },
        ]}
      />

      <AdminTableToolbar
        filters={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => handleOpenModal()}
          >
            {isMobile
              ? t('adminAnnouncements.newItemShort')
              : t('adminAnnouncements.newItem')}
          </Button>
        }
        searchPlaceholder={t('adminAnnouncements.searchPlaceholder')}
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
        pagination={{ pageSize: 20, showSizeChanger: true }}
      />

      <Modal
        title={
          editingItem
            ? t('adminAnnouncements.modalEditTitle')
            : t('adminAnnouncements.modalNewTitle')
        }
        open={modalOpen}
        onCancel={handleCloseModal}
        onOk={() => form.submit()}
        okText={t('adminAnnouncements.save')}
        cancelText={t('adminAnnouncements.cancel')}
        width={640}
        forceRender
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label={t('adminAnnouncements.fieldTitle')}
            name="title"
            rules={[
              {
                required: true,
                message: t('adminAnnouncements.requiredTitle'),
              },
            ]}
          >
            <Input placeholder={t('adminAnnouncements.hintTitle')} />
          </Form.Item>

          <Form.Item
            label={t('adminAnnouncements.fieldBody')}
            name="body"
            rules={[
              { required: true, message: t('adminAnnouncements.requiredBody') },
            ]}
          >
            <AnnouncementBodyEditor />
          </Form.Item>

          <Form.Item label={t('adminAnnouncements.fieldTone')} name="tone">
            <Select options={toneOptions} />
          </Form.Item>

          <Form.Item
            label={t('adminAnnouncements.fieldAudience')}
            name="audience"
          >
            <Radio.Group options={audienceOptions} optionType="button" />
          </Form.Item>

          <Form.Item
            label={t('adminAnnouncements.fieldPages')}
            name="pages"
            rules={[
              {
                validator: async (_, value: string[]) => {
                  if (!value || value.length === 0) {
                    throw new Error(t('adminAnnouncements.requiredPages'));
                  }
                },
              },
            ]}
          >
            <Checkbox.Group
              options={ANNOUNCEMENT_PAGE_OPTIONS.map((p) => ({
                value: p.value,
                label: p.label,
              }))}
            />
          </Form.Item>

          <Form.Item
            label={t('adminAnnouncements.fieldSchedule')}
            name="schedule"
          >
            <DatePicker.RangePicker showTime allowClear />
          </Form.Item>

          <Form.Item label={t('adminAnnouncements.fieldLink')} name="linkUrl">
            <Input placeholder={t('adminAnnouncements.hintLink')} />
          </Form.Item>

          <Form.Item
            label={t('adminAnnouncements.fieldLinkLabel')}
            name="linkLabel"
          >
            <Input placeholder={t('adminAnnouncements.hintLinkLabel')} />
          </Form.Item>

          <Form.Item
            label={t('adminAnnouncements.fieldDismissible')}
            name="dismissible"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            label={t('adminAnnouncements.fieldActive')}
            name="isActive"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
