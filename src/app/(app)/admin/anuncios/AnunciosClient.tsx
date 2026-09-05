'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Table,
  Button,
  Input,
  Drawer,
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
  ANNOUNCEMENT_SURFACE_COLORS,
  ANNOUNCEMENT_SURFACE_OPTIONS,
  ANNOUNCEMENT_TEMPLATE_OPTIONS,
} from '@/constants/announcements';
import { AdminNav } from '../AdminNav';
import { AnuncioPreview } from './AnuncioPreview';
import '../admin.css';
import './anuncios.css';

type Tone = 'INFO' | 'SUCCESS' | 'WARNING' | 'PROMO';
type Audience =
  | 'EVERYONE'
  | 'MEMBERS'
  | 'NOTIFICATIONS_ENABLED'
  | 'SPECIFIC_USERS';
type Surface = 'BANNER' | 'MODAL' | 'TOAST';
type Template = 'SIMPLE' | 'FEATURE' | 'MAINTENANCE';
type Status = 'draft' | 'scheduled' | 'active' | 'expired';

interface AnnouncementType {
  id: number;
  title: string;
  body: string;
  tone: Tone;
  audience: Audience;
  surface: Surface;
  template: Template;
  pages: string[];
  dismissible: boolean;
  linkUrl: string | null;
  linkLabel: string | null;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
  _count?: { recipients: number };
}

interface UserOption {
  id: string;
  name: string | null;
  email: string;
}

interface FormValues {
  title: string;
  body: string;
  tone: Tone;
  audience: Audience;
  surface: Surface;
  template: Template;
  pages: string[];
  dismissible: boolean;
  linkUrl?: string;
  linkLabel?: string;
  isActive: boolean;
  schedule?: [Dayjs, Dayjs] | null;
  recipientUserIds?: string[];
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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AnnouncementType | null>(null);
  const [userOptions, setUserOptions] = useState<UserOption[]>([]);
  const [form] = Form.useForm<FormValues>();
  // Watch reactivo de TODO el form -> alimenta el preview en vivo. Con
  // valores undefined al montar (antes del primer setFieldsValue), asi que
  // el preview tolera undefined en cada campo (ver fallbacks abajo).
  const watched = Form.useWatch([], form) as Partial<FormValues> | undefined;

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
    SPECIFIC_USERS: t('adminAnnouncements.audienceSpecificUsers'),
  };
  const audienceOptions = (Object.keys(audienceLabels) as Audience[]).map(
    (value) => ({ value, label: audienceLabels[value] })
  );

  const surfaceLabels: Record<Surface, string> = useMemo(
    () =>
      Object.fromEntries(
        ANNOUNCEMENT_SURFACE_OPTIONS.map((o) => [o.value, o.label])
      ) as Record<Surface, string>,
    []
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

  const userOptionItems = useMemo(
    () =>
      userOptions.map((u) => ({
        value: u.id,
        label: u.name ? `${u.name} · ${u.email}` : u.email,
      })),
    [userOptions]
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

  // Usuarios para el picker de SPECIFIC_USERS: se traen una sola vez (no en
  // cada apertura del drawer), lazy la primera vez que hace falta.
  const ensureUserOptionsLoaded = useCallback(async () => {
    if (userOptions.length > 0) return;
    try {
      const response = await fetch('/api/users');
      if (!response.ok) return;
      const data = await response.json();
      setUserOptions(data);
    } catch (error) {
      console.error(error);
    }
  }, [userOptions.length]);

  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items;
    const term = searchTerm.toLowerCase();
    return items.filter((item) => item.title.toLowerCase().includes(term));
  }, [items, searchTerm]);

  const handleOpenDrawer = (item?: AnnouncementType) => {
    ensureUserOptionsLoaded();
    if (item) {
      setEditingItem(item);
      form.setFieldsValue({
        title: item.title,
        body: item.body,
        tone: item.tone,
        audience: item.audience,
        surface: item.surface,
        template: item.template,
        pages: item.pages,
        dismissible: item.dismissible,
        linkUrl: item.linkUrl ?? undefined,
        linkLabel: item.linkLabel ?? undefined,
        isActive: item.isActive,
        schedule:
          item.startsAt && item.endsAt
            ? [dayjs(item.startsAt), dayjs(item.endsAt)]
            : null,
        recipientUserIds: undefined,
      });
      // Los recipients no vienen en el listado (solo el count) — se cargan
      // aparte solo si hace falta editarlos.
      if (item.audience === 'SPECIFIC_USERS') {
        fetch(`/api/admin/announcements/${item.id}/recipients`)
          .then((res) => (res.ok ? res.json() : []))
          .then((ids: string[]) => form.setFieldValue('recipientUserIds', ids))
          .catch(() => undefined);
      }
    } else {
      setEditingItem(null);
      form.resetFields();
      form.setFieldsValue({
        tone: 'INFO',
        audience: 'EVERYONE',
        surface: 'BANNER',
        template: 'SIMPLE',
        pages: ['global'],
        dismissible: true,
        isActive: true,
      });
    }
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
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
        surface: values.surface,
        template: values.template,
        pages: values.pages,
        dismissible: values.dismissible,
        linkUrl: values.linkUrl || null,
        linkLabel: values.linkLabel || null,
        isActive: values.isActive,
        startsAt: startsAt ? startsAt.toISOString() : null,
        endsAt: endsAt ? endsAt.toISOString() : null,
        ...(values.audience === 'SPECIFIC_USERS' && {
          recipientUserIds: values.recipientUserIds ?? [],
        }),
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
      handleCloseDrawer();
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
      title: t('adminAnnouncements.columnSurface'),
      key: 'surface',
      render: (record: AnnouncementType) => (
        <Tag color={ANNOUNCEMENT_SURFACE_COLORS[record.surface]}>
          {surfaceLabels[record.surface]}
        </Tag>
      ),
      responsive: ['md' as const],
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
        <Space size={4}>
          <Tag color={ANNOUNCEMENT_AUDIENCE_COLORS[record.audience]}>
            {audienceLabels[record.audience]}
          </Tag>
          {record.audience === 'SPECIFIC_USERS' && (
            <Tag>{record._count?.recipients ?? 0}</Tag>
          )}
        </Space>
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
            onClick={() => handleOpenDrawer(record)}
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
            onClick={() => handleOpenDrawer()}
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
        scroll={{ x: 'max-content' }}
        dataSource={filteredItems}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 20, showSizeChanger: true }}
      />

      <Drawer
        title={
          editingItem
            ? t('adminAnnouncements.modalEditTitle')
            : t('adminAnnouncements.modalNewTitle')
        }
        open={drawerOpen}
        onClose={handleCloseDrawer}
        width={isMobile ? '100%' : 960}
        maskClosable={false}
        destroyOnClose
        extra={
          <Space>
            <Button onClick={handleCloseDrawer}>
              {t('adminAnnouncements.cancel')}
            </Button>
            <Button type="primary" onClick={() => form.submit()}>
              {t('adminAnnouncements.save')}
            </Button>
          </Space>
        }
      >
        <div className="anuncios-editor">
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            className="anuncios-editor__form"
          >
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
              help={t('adminAnnouncements.hintUserName')}
              rules={[
                {
                  required: true,
                  message: t('adminAnnouncements.requiredBody'),
                },
              ]}
            >
              <AnnouncementBodyEditor />
            </Form.Item>

            <div className="anuncios-editor__row">
              <Form.Item
                label={t('adminAnnouncements.fieldSurface')}
                name="surface"
                className="anuncios-editor__col"
              >
                <Select
                  options={ANNOUNCEMENT_SURFACE_OPTIONS.map((o) => ({
                    value: o.value,
                    label: o.label,
                  }))}
                />
              </Form.Item>

              <Form.Item
                label={t('adminAnnouncements.fieldTemplate')}
                name="template"
                className="anuncios-editor__col"
              >
                <Select
                  options={ANNOUNCEMENT_TEMPLATE_OPTIONS.map((o) => ({
                    value: o.value,
                    label: `${o.label} — ${o.description}`,
                  }))}
                />
              </Form.Item>
            </div>

            <Form.Item label={t('adminAnnouncements.fieldTone')} name="tone">
              <Select options={toneOptions} />
            </Form.Item>

            <Form.Item
              label={t('adminAnnouncements.fieldAudience')}
              name="audience"
            >
              <Radio.Group options={audienceOptions} optionType="button" />
            </Form.Item>

            {watched?.audience === 'SPECIFIC_USERS' && (
              <Form.Item
                label={t('adminAnnouncements.fieldRecipients')}
                name="recipientUserIds"
                rules={[
                  {
                    validator: async (_, value: string[]) => {
                      if (!value || value.length === 0) {
                        throw new Error(
                          t('adminAnnouncements.requiredRecipients')
                        );
                      }
                    },
                  },
                ]}
              >
                <Select
                  mode="multiple"
                  showSearch
                  optionFilterProp="label"
                  options={userOptionItems}
                  placeholder={t('adminAnnouncements.recipientsPlaceholder')}
                  onFocus={ensureUserOptionsLoaded}
                />
              </Form.Item>
            )}

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

            <div className="anuncios-editor__row">
              <Form.Item
                label={t('adminAnnouncements.fieldLink')}
                name="linkUrl"
                className="anuncios-editor__col"
              >
                <Input placeholder={t('adminAnnouncements.hintLink')} />
              </Form.Item>

              <Form.Item
                label={t('adminAnnouncements.fieldLinkLabel')}
                name="linkLabel"
                className="anuncios-editor__col"
              >
                <Input placeholder={t('adminAnnouncements.hintLinkLabel')} />
              </Form.Item>
            </div>

            <div className="anuncios-editor__row">
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
            </div>
          </Form>

          <div className="anuncios-editor__preview">
            <AnuncioPreview
              surface={watched?.surface ?? 'BANNER'}
              tone={watched?.tone ?? 'INFO'}
              template={watched?.template ?? 'SIMPLE'}
              title={watched?.title ?? ''}
              body={watched?.body ?? ''}
              linkUrl={watched?.linkUrl}
              linkLabel={watched?.linkLabel}
              dismissible={watched?.dismissible ?? true}
              frameLabel={t('adminAnnouncements.previewLabel')}
            />
          </div>
        </div>
      </Drawer>
    </div>
  );
}
