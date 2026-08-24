'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  ThunderboltOutlined,
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
  versionLabel: string | null;
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
  const [aiBusy, setAiBusy] = useState<'polish' | 'category' | null>(null);
  const [autoGenOpen, setAutoGenOpen] = useState(false);
  const [autoGenLoading, setAutoGenLoading] = useState(false);
  const [autoGenSaving, setAutoGenSaving] = useState(false);
  const [autoGenDraft, setAutoGenDraft] = useState<{
    version: string;
    title: string;
    features?: string[];
    fixes?: string[];
    improvements?: string[];
  } | null>(null);
  const [form] = Form.useForm();

  const handleAutoGenerate = async () => {
    setAutoGenLoading(true);
    try {
      const res = await fetch('/api/admin/changelog/auto-generate', {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al generar con IA');
      setAutoGenDraft(data.draft);
      setAutoGenOpen(true);
    } catch (err) {
      console.error(err);
      message.error(
        err instanceof Error ? err.message : 'Error al generar novedades.'
      );
    } finally {
      setAutoGenLoading(false);
    }
  };

  const handleSaveAutoGen = async () => {
    if (!autoGenDraft) return;
    setAutoGenSaving(true);
    try {
      const bulkItems: Array<{
        version: string;
        versionLabel: string;
        category: string;
        body: string;
      }> = [];
      const version = autoGenDraft.version;
      const versionLabel = autoGenDraft.title || version;

      autoGenDraft.features?.forEach((f) => {
        bulkItems.push({
          version,
          versionLabel,
          category: 'Features',
          body: f,
        });
      });
      autoGenDraft.fixes?.forEach((f) => {
        bulkItems.push({
          version,
          versionLabel,
          category: 'Fixes',
          body: f,
        });
      });
      autoGenDraft.improvements?.forEach((i) => {
        bulkItems.push({
          version,
          versionLabel,
          category: 'Performance',
          body: i,
        });
      });

      const res = await fetch('/api/admin/changelog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bulkItems }),
      });
      if (!res.ok) throw new Error('Error al guardar items');
      message.success('¡Novedades guardadas exitosamente en el changelog!');
      setAutoGenOpen(false);
      void loadItems();
    } catch (err) {
      console.error(err);
      message.error('Error al guardar las novedades generadas.');
    } finally {
      setAutoGenSaving(false);
    }
  };

  const callChangelogAi = async (
    action: 'polish' | 'suggest-category'
  ): Promise<{ text?: string; category?: string }> => {
    const body = (form.getFieldValue('body') as string | undefined)?.trim();
    if (!body) {
      message.warning(t('adminChangelog.aiNeedBody'));
      throw new Error('no body');
    }
    const res = await fetch('/api/admin/changelog/ai-assist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, body }),
    });
    const data = (await res.json()) as {
      error?: string;
      text?: string;
      category?: string;
    };
    if (!res.ok) {
      throw new Error(data.error || t('adminChangelog.aiError'));
    }
    return data;
  };

  const handleAiPolish = async () => {
    setAiBusy('polish');
    try {
      const data = await callChangelogAi('polish');
      if (data.text) {
        form.setFieldValue('body', data.text);
        message.success(t('adminChangelog.aiPolished'));
      }
    } catch (error) {
      if (error instanceof Error && error.message !== 'no body') {
        message.error(error.message);
      }
    } finally {
      setAiBusy(null);
    }
  };

  const handleAiSuggestCategory = async () => {
    setAiBusy('category');
    try {
      const data = await callChangelogAi('suggest-category');
      if (data.category) {
        form.setFieldValue('category', data.category);
        message.success(t('adminChangelog.aiCategorySuggested'));
      } else {
        message.info(t('adminChangelog.aiCategoryNone'));
      }
    } catch (error) {
      if (error instanceof Error && error.message !== 'no body') {
        message.error(error.message);
      }
    } finally {
      setAiBusy(null);
    }
  };

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
      versionLabel: item.versionLabel ?? '',
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
            t(
              isEdit
                ? 'adminChangelog.updateError'
                : 'adminChangelog.createError'
            )
        );
      }

      message.success(
        t(
          isEdit
            ? 'adminChangelog.updateSuccess'
            : 'adminChangelog.createSuccess'
        )
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
      message.success(
        `${t('adminChangelog.importSuccess')} (${data.imported} items)`
      );
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
      key: 'version',
      width: 220,
      sorter: (a: ChangelogItem, b: ChangelogItem) =>
        (a.versionLabel ?? a.version).localeCompare(
          b.versionLabel ?? b.version
        ),
      render: (_: unknown, record: ChangelogItem) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Tag
            color="purple"
            style={{ marginRight: 0, alignSelf: 'flex-start' }}
          >
            {record.versionLabel ?? record.version}
          </Tag>
          {record.versionLabel && record.versionLabel !== record.version && (
            <span
              style={{
                fontSize: 11,
                color: 'var(--text-secondary)',
                fontFamily: 'monospace',
              }}
            >
              {record.version}
            </span>
          )}
        </div>
      ),
    },
    {
      title: t('adminChangelog.columnCategory'),
      dataIndex: 'category',
      key: 'category',
      width: 120,
      responsive: ['md' as const],
      render: (cat: string | null) =>
        cat ? (
          <Tag color="blue">{cat}</Tag>
        ) : (
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
    <>
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
            <Space wrap>
              <Button
                icon={<ThunderboltOutlined />}
                onClick={handleAutoGenerate}
                loading={autoGenLoading}
                style={{
                  background: 'linear-gradient(135deg, #7c3aed, #db2777)',
                  color: '#fff',
                  borderColor: 'transparent',
                }}
              >
                {!isMobile ? 'Generar con IA (Commits)' : 'IA'}
              </Button>
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
          scroll={{ x: 'max-content' }}
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
          maskClosable={false}
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
                {
                  required: true,
                  message: t('adminChangelog.requiredVersion'),
                },
              ]}
              tooltip={t('adminChangelog.fieldVersionHint')}
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
              name="versionLabel"
              label={t('adminChangelog.fieldVersionLabel')}
              tooltip={t('adminChangelog.fieldVersionLabelHint')}
            >
              <Input
                placeholder={t('adminChangelog.fieldVersionLabelPlaceholder')}
                maxLength={120}
                showCount
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

            <Space wrap size="small" style={{ marginBottom: 16 }}>
              <Button
                size="small"
                icon={<ThunderboltOutlined />}
                loading={aiBusy === 'polish'}
                disabled={Boolean(aiBusy)}
                onClick={handleAiPolish}
              >
                {t('adminChangelog.aiPolish')}
              </Button>
              <Button
                size="small"
                loading={aiBusy === 'category'}
                disabled={Boolean(aiBusy)}
                onClick={handleAiSuggestCategory}
              >
                {t('adminChangelog.aiSuggestCategory')}
              </Button>
            </Space>

            <Form.Item
              name="sortOrder"
              label="Orden"
              style={{ display: 'none' }}
            >
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

        {/* Modal de Previsualización de Changelog generado con IA */}
        <Modal
          title="✨ Novedades generadas con IA a partir de commits recientes"
          open={autoGenOpen}
          width={700}
          onCancel={() => setAutoGenOpen(false)}
          maskClosable={false}
          footer={[
            <Button key="cancel" onClick={() => setAutoGenOpen(false)}>
              Cancelar
            </Button>,
            <Button
              key="save"
              type="primary"
              loading={autoGenSaving}
              onClick={handleSaveAutoGen}
              style={{ background: '#7c3aed', borderColor: '#7c3aed' }}
            >
              Guardar y publicar en Changelog
            </Button>,
          ]}
        >
          {autoGenDraft && (
            <div
              style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: 8 }}
            >
              <div style={{ marginBottom: 16 }}>
                <Tag
                  color="purple"
                  style={{ fontSize: 13, padding: '2px 8px' }}
                >
                  Versión: {autoGenDraft.version}
                </Tag>
                <h3 style={{ marginTop: 8, marginBottom: 4 }}>
                  {autoGenDraft.title}
                </h3>
              </div>

              {autoGenDraft.features && autoGenDraft.features.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <Tag color="blue">Features</Tag>
                  <ul style={{ paddingLeft: 20, marginTop: 6 }}>
                    {autoGenDraft.features.map((f, i) => (
                      <li key={i} style={{ marginBottom: 4 }}>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {autoGenDraft.fixes && autoGenDraft.fixes.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <Tag color="green">Fixes</Tag>
                  <ul style={{ paddingLeft: 20, marginTop: 6 }}>
                    {autoGenDraft.fixes.map((f, i) => (
                      <li key={i} style={{ marginBottom: 4 }}>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {autoGenDraft.improvements &&
                autoGenDraft.improvements.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <Tag color="orange">Rendimiento / UX</Tag>
                    <ul style={{ paddingLeft: 20, marginTop: 6 }}>
                      {autoGenDraft.improvements.map((im, i) => (
                        <li key={i} style={{ marginBottom: 4 }}>
                          {im}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
            </div>
          )}
        </Modal>
      </div>
    </>
  );
}
