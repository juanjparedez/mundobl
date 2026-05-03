'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout/AppLayout';
import {
  Table,
  Button,
  Input,
  Popconfirm,
  Space,
  Tag,
  Modal,
  Form,
  Radio,
  Alert,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  MergeCellsOutlined,
} from '@ant-design/icons';
import { useMessage } from '@/hooks/useMessage';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { interpolateMessage } from '@/lib/i18n-format';
import { AdminPageHero } from '@/components/admin/AdminPageHero/AdminPageHero';
import { AdminTableToolbar } from '@/components/admin/AdminTableToolbar/AdminTableToolbar';
import { AdminNav } from '../AdminNav';
import '../admin.css';

interface TagType {
  id: number;
  name: string;
  category?: string | null;
  _count?: {
    series: number;
  };
}

export default function TagsAdminPage() {
  const message = useMessage();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { t } = useLocale();
  const [tags, setTags] = useState<TagType[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [adding, setAdding] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<TagType | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [mergeModalOpen, setMergeModalOpen] = useState(false);
  const [mergeTarget, setMergeTarget] = useState<number | null>(null);
  const [form] = Form.useForm();

  const loadTags = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/tags');
      if (!response.ok) throw new Error(t('adminTags.loadError'));
      const data = await response.json();
      setTags(data);
    } catch (error) {
      message.error(t('adminTags.loadError'));
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [message, t]);

  useEffect(() => {
    loadTags();
  }, [loadTags]);

  const filteredTags = useMemo(() => {
    if (!searchTerm.trim()) return tags;
    const term = searchTerm.toLowerCase();
    return tags.filter(
      (tag) =>
        tag.name.toLowerCase().includes(term) ||
        tag.category?.toLowerCase().includes(term)
    );
  }, [tags, searchTerm]);

  const handleAddTag = async () => {
    if (!newTagName.trim()) {
      message.warning(t('adminTags.createEmptyWarning'));
      return;
    }

    setAdding(true);
    try {
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTagName.trim(), category: 'trope' }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || t('adminTags.createError'));
      }

      message.success(t('adminTags.createSuccess'));
      setNewTagName('');
      loadTags();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : t('adminTags.createError');
      message.error(errorMessage);
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteTag = async (tagId: number) => {
    try {
      const response = await fetch(`/api/tags/${tagId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error(t('adminTags.deleteError'));

      message.success(t('adminTags.deleteSuccess'));
      loadTags();
    } catch (error) {
      message.error(t('adminTags.deleteError'));
      console.error(error);
    }
  };

  const handleEditTag = async (values: Record<string, unknown>) => {
    if (!editingTag) return;
    try {
      const response = await fetch(`/api/tags/${editingTag.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || t('adminTags.updateError'));
      }

      message.success(t('adminTags.updateSuccess'));
      setEditModalOpen(false);
      setEditingTag(null);
      form.resetFields();
      loadTags();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : t('adminTags.updateError');
      message.error(errorMessage);
    }
  };

  const handleMerge = async () => {
    if (!mergeTarget || selectedRowKeys.length !== 2) return;
    const sourceId = selectedRowKeys.find((id) => id !== mergeTarget);
    try {
      const response = await fetch('/api/tags/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceId, targetId: mergeTarget }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || t('adminTags.mergeError'));
      }
      message.success(t('adminTags.mergeSuccess'));
      setMergeModalOpen(false);
      setSelectedRowKeys([]);
      setMergeTarget(null);
      loadTags();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : t('adminTags.mergeError');
      message.error(errorMessage);
    }
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => {
      if (keys.length <= 2) setSelectedRowKeys(keys);
    },
  };

  const columns = [
    {
      title: t('adminTags.columnTag'),
      dataIndex: 'name',
      key: 'name',
      sorter: (a: TagType, b: TagType) => a.name.localeCompare(b.name),
      render: (name: string) => <Tag color="blue">{name}</Tag>,
    },
    {
      title: t('adminTags.columnCategory'),
      dataIndex: 'category',
      key: 'category',
      render: (category: string | null) =>
        category || t('adminTags.emptyCategory'),
      responsive: ['md' as const],
    },
    {
      title: t('adminTags.columnSeries'),
      key: 'count',
      sorter: (a: TagType, b: TagType) =>
        (a._count?.series || 0) - (b._count?.series || 0),
      render: (record: TagType) => <Tag>{record._count?.series || 0}</Tag>,
    },
    {
      title: t('adminTags.columnActions'),
      key: 'actions',
      render: (record: TagType) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => {
              setEditingTag(record);
              form.setFieldsValue(record);
              setEditModalOpen(true);
            }}
          >
            {!isMobile && t('adminTags.actionEdit')}
          </Button>
          <Popconfirm
            title={t('adminTags.deleteTitle')}
            description={interpolateMessage(t('adminTags.deleteDescription'), {
              count: record._count?.series || 0,
            })}
            onConfirm={() => handleDeleteTag(record.id)}
            okText={t('adminTags.actionDelete')}
            cancelText={t('adminTags.cancel')}
            okButtonProps={{ danger: true }}
          >
            <Button danger icon={<DeleteOutlined />} size="small">
              {!isMobile && t('adminTags.actionDelete')}
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
          title={t('adminTags.title')}
          subtitle={t('adminTags.subtitle')}
          stats={[
            { label: t('adminTags.statsTotal'), value: tags.length },
            {
              label: t('adminTags.statsFiltered'),
              value: filteredTags.length,
            },
            {
              label: t('adminTags.statsSelected'),
              value: selectedRowKeys.length,
            },
          ]}
        />

        <AdminTableToolbar
          filters={
            <Input
              placeholder={t('adminTags.newPlaceholder')}
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onPressEnter={handleAddTag}
              style={{ minWidth: isMobile ? 220 : 320 }}
            />
          }
          searchPlaceholder={t('adminTags.searchPlaceholder')}
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          onSearchSubmit={() => undefined}
          onSearchClear={() => setSearchTerm('')}
          rightActions={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddTag}
              loading={adding}
            >
              {t('adminTags.create')}
            </Button>
          }
        />

        {selectedRowKeys.length === 2 && (
          <Button
            type="primary"
            icon={<MergeCellsOutlined />}
            onClick={() => {
              setMergeTarget(selectedRowKeys[0] as number);
              setMergeModalOpen(true);
            }}
            style={{ marginBottom: 12 }}
          >
            {t('adminTags.mergeSelected')}
          </Button>
        )}

        <Table
          dataSource={filteredTags}
          columns={columns}
          rowKey="id"
          loading={loading}
          rowSelection={rowSelection}
          pagination={{ pageSize: 20, showSizeChanger: true }}
        />

        <Modal
          title={t('adminTags.modalEditTitle')}
          open={editModalOpen}
          onCancel={() => {
            setEditModalOpen(false);
            setEditingTag(null);
            form.resetFields();
          }}
          onOk={() => form.submit()}
          okText={t('adminTags.save')}
          cancelText={t('adminTags.cancel')}
          forceRender
        >
          <Form form={form} layout="vertical" onFinish={handleEditTag}>
            <Form.Item
              label={t('adminTags.fieldName')}
              name="name"
              rules={[{ required: true, message: t('adminTags.requiredName') }]}
            >
              <Input placeholder={t('adminTags.hintName')} />
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title={t('adminTags.modalMergeTitle')}
          open={mergeModalOpen}
          onCancel={() => {
            setMergeModalOpen(false);
            setMergeTarget(null);
          }}
          onOk={handleMerge}
          okText={t('adminTags.mergeSelected')}
          okButtonProps={{ danger: true }}
          cancelText={t('adminTags.cancel')}
        >
          <p style={{ marginBottom: 12 }}>
            {t('adminTags.mergeSelectSurvivor')}
          </p>
          <Radio.Group
            value={mergeTarget}
            onChange={(e) => setMergeTarget(e.target.value)}
            style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
          >
            {selectedRowKeys.map((id) => {
              const tag = tags.find((t) => t.id === id);
              if (!tag) return null;
              return (
                <Radio key={String(id)} value={id}>
                  <Tag color="blue">{tag.name}</Tag> (
                  {interpolateMessage(t('adminTags.seriesCount'), {
                    count: tag._count?.series || 0,
                  })}
                  )
                </Radio>
              );
            })}
          </Radio.Group>
          <Alert
            type="warning"
            message={t('adminTags.mergeWarning')}
            style={{ marginTop: 16 }}
          />
        </Modal>
      </div>
    </AppLayout>
  );
}
