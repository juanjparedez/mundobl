'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout/AppLayout';
import {
  Table,
  Button,
  Popconfirm,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  ImportOutlined,
} from '@ant-design/icons';
import { useMessage } from '@/hooks/useMessage';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { AdminPageHero } from '@/components/admin/AdminPageHero/AdminPageHero';
import { AdminTableToolbar } from '@/components/admin/AdminTableToolbar/AdminTableToolbar';
import { AdminNav } from '../AdminNav';
import '../admin.css';

interface ChangelogItem {
  id: number;
  version: string;
  category: string | null;
  body: string;
  sortOrder: number;
  createdAt: string;
}

const KNOWN_VERSIONS = ['Proximo deploy'];
const KNOWN_CATEGORIES = ['Features', 'Fixes', 'Seguridad', 'Performance'];

export default function ChangelogAdminPage() {
  const message = useMessage();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { t } = useLocale();
  const [items, setItems] = useState<ChangelogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ChangelogItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [form] = Form.useForm();

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/changelog');
      if (!res.ok) throw new Error(t('adminChangelog.loadError'));
      const data = await res.json();
      setItems(data);
    } catch (error) {
      message.error(t('adminChangelog.loadError'));
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [message, t]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items;
    const term = searchTerm.toLowerCase();
    return items.filter(
      (item) =>
        item.version.toLowerCase().includes(term) ||
        item.category?.toLowerCase().includes(term) ||
        item.body.toLowerCase().includes(term)
    );
  }, [items, searchTerm]);

  const uniqueVersions = useMemo(
    () => Array.from(new Set(items.map((i) => i.version))),
    [items]
  );

  const openAddModal = () => {
    setEditingItem(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEditModal = (item: ChangelogItem) => {
    setEditingItem(item);
    form.setFieldsValue({
      version: item.version,
      category: item.category,
      body: item.body,
      sortOrder: item.sortOrder,
    });
    setModalOpen(true);
  };

  const handleSave = async (values: Record<string, unknown>) => {
    setSaving(true);
    try {
      const isEdit = editingItem !== null;
      const url = isEdit
        ? `/api/admin/changelog/${editingItem.id}`
        : '/api/admin/changelog';
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(
          err.error ||
            t(isEdit ? 'adminChangelog.updateError' : 'adminChangelog.createError')
        );
      }

      message.success(
        t(isEdit ? 'adminChangelog.updateSuccess' : 'adminChangelog.createSuccess')
      );
      setModalOpen(false);
      setEditingItem(null);
      form.resetFields();
      void loadItems();
    } catch (error) {
      const msg =
        error instanceof Error
          ? error.message
          : t(
              editingItem
                ? 'adminChangelog.updateError'
                : 'adminChangelog.createError'
            );
      message.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/changelog/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error(t('adminChangelog.deleteError'));
      message.success(t('adminChangelog.deleteSuccess'));
      void loadItems();
    } catch (error) {
      message.error(t('adminChangelog.deleteError'));
      console.error(error);
    }
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      const res = await fetch('/api/admin/changelog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ importFromFile: true }),
      });
      if (!res.ok) throw new Error(t('adminChangelog.importError'));
      const data = await res.json();
      message.success(`${t('adminChangelog.importSuccess')} (${data.imported} items)`);
      void loadItems();
    } catch (error) {
      message.error(t('adminChangelog.importError'));
      console.error(error);
    } finally {
      setImporting(false);
    }
  };

  const columns = [
    {
      title: t('adminChangelog.columnVersion'),
      dataIndex: 'version',
      key: 'version',
      width: 160,
      sorter: (a: ChangelogItem, b: ChangelogItem) =>
        a.version.localeCompare(b.version),
      render: (version: string) => <Tag color="purple">{version}</Tag>,
    },
    {
      title: t('adminChangelog.columnCategory'),
      dataIndex: 'category',
      key: 'category',
      width: 120,
      responsive: ['md' as const],
      render: (cat: string | null) =>
        cat ? <Tag color="blue">{cat}</Tag> : (
          <span style={{ color: 'var(--color-text-secondary)' }}>
            {t('adminChangelog.emptyCategory')}
          </span>
        ),
    },
    {
      title: t('adminChangelog.columnBody'),
      dataIndex: 'body',
      key: 'body',
      render: (body: string) => <span>{body}</span>,
    },
    {
      title: t('adminChangelog.columnActions'),
      key: 'actions',
      width: 120,
      render: (record: ChangelogItem) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => openEditModal(record)}
          >
            {!isMobile && t('adminChangelog.actionEdit')}
          </Button>
          <Popconfirm
            title={t('adminChangelog.deleteTitle')}
            description={t('adminChangelog.deleteDescription')}
            onConfirm={() => void handleDelete(record.id)}
            okText={t('adminChangelog.actionDelete')}
            cancelText={t('adminChangelog.cancel')}
            okButtonProps={{ danger: true }}
          >
            <Button danger icon={<DeleteOutlined />} size="small">
              {!isMobile && t('adminChangelog.actionDelete')}
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
          title={t('adminChangelog.title')}
          subtitle={t('adminChangelog.subtitle')}
          stats={[
            { label: t('adminChangelog.statsTotal'), value: items.length },
            {
              label: t('adminChangelog.statsVersions'),
              value: uniqueVersions.length,
            },
          ]}
        />

        <AdminTableToolbar
          filters={null}
          searchPlaceholder={t('adminChangelog.searchPlaceholder')}
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          onSearchSubmit={() => undefined}
          onSearchClear={() => setSearchTerm('')}
          rightActions={
            <Space>
              <Button
                icon={<ImportOutlined />}
                onClick={handleImport}
                loading={importing}
              >
                {!isMobile && t('adminChangelog.importFromFile')}
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={openAddModal}
              >
                {t('adminChangelog.addItem')}
              </Button>
            </Space>
          }
        />

        <Table
          dataSource={filteredItems}
          columns={columns}
          rowKey="id"
          loading={loading}
          size="small"
          pagination={{ pageSize: 50, showSizeChanger: false }}
        />

        <Modal
          title={
            editingItem
              ? t('adminChangelog.modalEditTitle')
              : t('adminChangelog.modalAddTitle')
          }
          open={modalOpen}
          onCancel={() => {
            setModalOpen(false);
            setEditingItem(null);
            form.resetFields();
          }}
          footer={null}
          destroyOnClose
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={(values) => void handleSave(values)}
            initialValues={{ sortOrder: 0 }}
          >
            <Form.Item
              name="version"
              label={t('adminChangelog.fieldVersion')}
              rules={[
                { required: true, message: t('adminChangelog.requiredVersion') },
              ]}
            >
              <Select
                showSearch
                allowClear
                options={[
                  ...KNOWN_VERSIONS.map((v) => ({ value: v, label: v })),
                  ...uniqueVersions
                    .filter((v) => !KNOWN_VERSIONS.includes(v))
                    .map((v) => ({ value: v, label: v })),
                ]}
                onSearch={(value) => form.setFieldValue('version', value)}
                placeholder="ej: Proximo deploy, v1.2.3"
              />
            </Form.Item>

            <Form.Item
              name="category"
              label={t('adminChangelog.fieldCategory')}
            >
              <Select
                showSearch
                allowClear
                options={KNOWN_CATEGORIES.map((c) => ({ value: c, label: c }))}
                onSearch={(value) => form.setFieldValue('category', value)}
                placeholder="ej: Features, Fixes, Seguridad"
              />
            </Form.Item>

            <Form.Item
              name="body"
              label={t('adminChangelog.fieldBody')}
              rules={[
                { required: true, message: t('adminChangelog.requiredBody') },
              ]}
            >
              <Input.TextArea rows={3} />
            </Form.Item>

            <Form.Item name="sortOrder" label="Orden" style={{ display: 'none' }}>
              <Input type="number" />
            </Form.Item>

            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button
                onClick={() => {
                  setModalOpen(false);
                  setEditingItem(null);
                  form.resetFields();
                }}
              >
                {t('adminChangelog.cancel')}
              </Button>
              <Button type="primary" htmlType="submit" loading={saving}>
                {t('adminChangelog.save')}
              </Button>
            </Space>
          </Form>
        </Modal>
      </div>
    </AppLayout>
  );
}
