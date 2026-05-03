'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout/AppLayout';
import {
  Table,
  Button,
  Input,
  Modal,
  Form,
  Popconfirm,
  Space,
  Tag,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useMessage } from '@/hooks/useMessage';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { interpolateMessage } from '@/lib/i18n-format';
import { AdminPageHero } from '@/components/admin/AdminPageHero/AdminPageHero';
import { AdminTableToolbar } from '@/components/admin/AdminTableToolbar/AdminTableToolbar';
import { AdminNav } from '../AdminNav';
import '../admin.css';

const { TextArea } = Input;

interface Universe {
  id: number;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  _count?: {
    series: number;
  };
}

export default function UniversesAdminPage() {
  const message = useMessage();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { t } = useLocale();
  const [universes, setUniverses] = useState<Universe[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUniverse, setEditingUniverse] = useState<Universe | null>(null);
  const [form] = Form.useForm();

  const loadUniverses = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/universes');
      if (!response.ok) throw new Error(t('adminUniverses.loadError'));
      const data = await response.json();
      setUniverses(data);
    } catch (error) {
      message.error(t('adminUniverses.loadError'));
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [message, t]);

  useEffect(() => {
    loadUniverses();
  }, [loadUniverses]);

  const filteredUniverses = useMemo(() => {
    if (!searchTerm.trim()) return universes;
    const term = searchTerm.toLowerCase();
    return universes.filter(
      (universe) =>
        universe.name.toLowerCase().includes(term) ||
        universe.description?.toLowerCase().includes(term)
    );
  }, [universes, searchTerm]);

  const handleOpenModal = (universe?: Universe) => {
    if (universe) {
      setEditingUniverse(universe);
      form.setFieldsValue(universe);
    } else {
      setEditingUniverse(null);
      form.resetFields();
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingUniverse(null);
    form.resetFields();
  };

  const handleSubmit = async (values: Record<string, unknown>) => {
    try {
      const url = editingUniverse
        ? `/api/universes/${editingUniverse.id}`
        : '/api/universes';
      const method = editingUniverse ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || t('adminUniverses.saveError'));
      }

      message.success(
        editingUniverse
          ? t('adminUniverses.updateSuccess')
          : t('adminUniverses.createSuccess')
      );
      handleCloseModal();
      loadUniverses();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : t('adminUniverses.saveError');
      message.error(errorMessage);
    }
  };

  const handleDelete = async (universeId: number) => {
    try {
      const response = await fetch(`/api/universes/${universeId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || t('adminUniverses.deleteError'));
      }

      message.success(t('adminUniverses.deleteSuccess'));
      loadUniverses();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : t('adminUniverses.deleteError');
      message.error(errorMessage);
    }
  };

  const columns = [
    {
      title: t('adminUniverses.columnName'),
      dataIndex: 'name',
      key: 'name',
      sorter: (a: Universe, b: Universe) => a.name.localeCompare(b.name),
      render: (name: string) => <strong>{name}</strong>,
    },
    {
      title: t('adminUniverses.columnDescription'),
      dataIndex: 'description',
      key: 'description',
      render: (description: string | null) =>
        description || t('adminUniverses.emptyValue'),
      responsive: ['md' as const],
    },
    {
      title: t('adminUniverses.columnSeries'),
      key: 'count',
      sorter: (a: Universe, b: Universe) =>
        (a._count?.series || 0) - (b._count?.series || 0),
      render: (record: Universe) => (
        <Tag color="blue">
          {interpolateMessage(t('adminUniverses.seriesCount'), {
            count: record._count?.series || 0,
          })}
        </Tag>
      ),
    },
    {
      title: t('adminUniverses.columnActions'),
      key: 'actions',
      render: (record: Universe) => {
        const linkedSeriesCount = record._count?.series || 0;
        const isDeleteBlocked = linkedSeriesCount > 0;

        return (
          <Space>
            <Button
              icon={<EditOutlined />}
              onClick={() => handleOpenModal(record)}
              size="small"
            >
              {!isMobile && t('adminUniverses.actionEdit')}
            </Button>
            <Popconfirm
              title={t('adminUniverses.deleteTitle')}
              description={
                isDeleteBlocked
                  ? interpolateMessage(
                      t('adminUniverses.deleteBlockedDescription'),
                      {
                        count: linkedSeriesCount,
                      }
                    )
                  : t('adminUniverses.deleteDescription')
              }
              onConfirm={() => handleDelete(record.id)}
              okText={t('adminUniverses.actionDelete')}
              cancelText={t('adminUniverses.cancel')}
              okButtonProps={{ danger: true }}
              disabled={isDeleteBlocked}
            >
              <Button
                danger
                icon={<DeleteOutlined />}
                size="small"
                disabled={isDeleteBlocked}
              >
                {!isMobile && t('adminUniverses.actionDelete')}
              </Button>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <AppLayout>
      <div className="admin-page-wrapper">
        <AdminNav />

        <AdminPageHero
          title={t('adminUniverses.title')}
          subtitle={t('adminUniverses.subtitle')}
          stats={[
            { label: t('adminUniverses.statsTotal'), value: universes.length },
            {
              label: t('adminUniverses.statsFiltered'),
              value: filteredUniverses.length,
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
              {t('adminUniverses.newItem')}
            </Button>
          }
          searchPlaceholder={t('adminUniverses.searchPlaceholder')}
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          onSearchSubmit={() => undefined}
          onSearchClear={() => setSearchTerm('')}
        />

        <Table
          dataSource={filteredUniverses}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20, showSizeChanger: true }}
        />

        <Modal
          title={
            editingUniverse
              ? t('adminUniverses.modalEditTitle')
              : t('adminUniverses.modalNewTitle')
          }
          open={modalOpen}
          onCancel={handleCloseModal}
          onOk={() => form.submit()}
          okText={t('adminUniverses.save')}
          cancelText={t('adminUniverses.cancel')}
          forceRender
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item
              label={t('adminUniverses.fieldName')}
              name="name"
              rules={[
                {
                  required: true,
                  message: t('adminUniverses.requiredName'),
                },
              ]}
            >
              <Input placeholder={t('adminUniverses.hintName')} />
            </Form.Item>

            <Form.Item
              label={t('adminUniverses.fieldDescription')}
              name="description"
            >
              <TextArea
                rows={3}
                placeholder={t('adminUniverses.hintDescription')}
              />
            </Form.Item>

            <Form.Item
              label={t('adminUniverses.fieldImageUrl')}
              name="imageUrl"
            >
              <Input placeholder={t('adminUniverses.hintImageUrl')} />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </AppLayout>
  );
}
